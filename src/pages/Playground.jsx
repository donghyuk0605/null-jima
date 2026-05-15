import { useState, useCallback, useEffect, useMemo } from 'react';
import { runQuery, getSchema, translateSqlError } from '../lib/database';
import { formatSql } from '../lib/sqlFormatter';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import CsvImport from '../components/CsvImport';
import { getStoredEditorMode, saveStoredEditorMode } from '../lib/editorModes';

const AC_KEY = 'sqldojo_ac';

const EXAMPLE_GROUPS = [
  {
    group: '기본 조회',
    items: [
      { label: '전체 조회', sql: 'SELECT * FROM employees;' },
      { label: '특정 컬럼', sql: 'SELECT name, salary FROM employees;' },
      { label: '별칭(AS)', sql: 'SELECT name AS 이름, salary AS 급여 FROM employees;' },
      { label: '중복 제거', sql: 'SELECT DISTINCT category FROM products;' },
      { label: '계산 컬럼', sql: 'SELECT name, salary, salary * 12 AS 연봉 FROM employees;' },
    ],
  },
  {
    group: '조건 검색',
    items: [
      { label: '숫자 조건', sql: 'SELECT * FROM employees WHERE salary >= 6000000;' },
      { label: 'AND / OR', sql: "SELECT * FROM employees\nWHERE department_id = 1 AND salary >= 6000000;" },
      { label: 'IN', sql: 'SELECT * FROM employees WHERE department_id IN (1, 2);' },
      { label: 'BETWEEN', sql: 'SELECT * FROM employees\nWHERE salary BETWEEN 4000000 AND 6000000;' },
      { label: 'LIKE', sql: "SELECT * FROM employees WHERE name LIKE '김%';" },
      { label: 'IS NULL', sql: 'SELECT * FROM employees WHERE department_id IS NOT NULL;' },
      { label: 'NOT', sql: 'SELECT * FROM employees WHERE department_id NOT IN (1);' },
    ],
  },
  {
    group: '정렬 / 제한',
    items: [
      { label: 'ORDER BY DESC', sql: 'SELECT * FROM employees ORDER BY salary DESC;' },
      { label: '다중 정렬', sql: 'SELECT * FROM employees\nORDER BY department_id ASC, salary DESC;' },
      { label: 'LIMIT', sql: 'SELECT * FROM employees ORDER BY salary DESC LIMIT 5;' },
      { label: 'OFFSET', sql: 'SELECT * FROM employees ORDER BY salary DESC LIMIT 3 OFFSET 2;' },
    ],
  },
  {
    group: '집계 함수',
    items: [
      { label: 'COUNT', sql: 'SELECT COUNT(*) AS 전체직원수 FROM employees;' },
      { label: 'SUM / AVG', sql: 'SELECT SUM(salary) AS 총급여, AVG(salary) AS 평균급여\nFROM employees;' },
      { label: 'MAX / MIN', sql: 'SELECT MAX(salary) AS 최고급여, MIN(salary) AS 최저급여\nFROM employees;' },
      { label: 'GROUP BY', sql: 'SELECT department_id, COUNT(*) AS 직원수, AVG(salary) AS 평균급여\nFROM employees\nGROUP BY department_id;' },
      { label: 'HAVING', sql: 'SELECT department_id, COUNT(*) AS 직원수\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) >= 3;' },
      { label: 'GROUP BY + ORDER BY', sql: 'SELECT department_id, SUM(salary) AS 부서총급여\nFROM employees\nGROUP BY department_id\nORDER BY 부서총급여 DESC;' },
    ],
  },
  {
    group: 'JOIN',
    items: [
      { label: 'INNER JOIN', sql: 'SELECT e.name, d.name AS 부서명, e.salary\nFROM employees e\nJOIN departments d ON e.department_id = d.id;' },
      { label: 'LEFT JOIN', sql: 'SELECT d.name AS 부서, COUNT(e.id) AS 직원수\nFROM departments d\nLEFT JOIN employees e ON d.id = e.department_id\nGROUP BY d.name;' },
      { label: '3테이블 JOIN', sql: 'SELECT e.name AS 직원, p.name AS 상품, o.quantity, o.order_date\nFROM orders o\nJOIN employees e ON o.employee_id = e.id\nJOIN products p ON o.product_id = p.id\nORDER BY o.order_date;' },
      { label: 'SELF JOIN', sql: 'SELECT a.name AS 직원, b.name AS 같은부서직원\nFROM employees a\nJOIN employees b ON a.department_id = b.department_id\nWHERE a.id <> b.id\nORDER BY a.name;' },
    ],
  },
  {
    group: '서브쿼리',
    items: [
      { label: 'WHERE 서브쿼리', sql: 'SELECT name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);' },
      { label: 'IN 서브쿼리', sql: 'SELECT * FROM employees\nWHERE department_id IN\n  (SELECT id FROM departments WHERE budget >= 4000000);' },
      { label: '스칼라 서브쿼리', sql: 'SELECT name, salary,\n  (SELECT AVG(salary) FROM employees) AS 전체평균\nFROM employees;' },
      { label: '인라인 뷰', sql: 'SELECT * FROM (\n  SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS rnk\n  FROM employees\n) ranked\nWHERE rnk <= 3;' },
      { label: 'EXISTS', sql: 'SELECT name FROM departments d\nWHERE EXISTS (\n  SELECT 1 FROM employees e WHERE e.department_id = d.id\n);' },
    ],
  },
  {
    group: 'CASE / NULL 처리',
    items: [
      { label: 'CASE WHEN', sql: "SELECT name, salary,\n  CASE\n    WHEN salary >= 6500000 THEN 'S등급'\n    WHEN salary >= 5000000 THEN 'A등급'\n    WHEN salary >= 4000000 THEN 'B등급'\n    ELSE 'C등급'\n  END AS 급여등급\nFROM employees;" },
      { label: 'COALESCE', sql: "SELECT name, COALESCE(CAST(department_id AS TEXT), '미배정') AS 부서\nFROM employees;" },
      { label: 'NULLIF', sql: 'SELECT name, NULLIF(salary, 0) AS salary FROM employees;' },
    ],
  },
  {
    group: '문자열 / 날짜 함수',
    items: [
      { label: '문자열 길이', sql: 'SELECT name, LENGTH(name) AS 이름길이\nFROM employees\nORDER BY 이름길이 DESC;' },
      { label: 'SUBSTR', sql: "SELECT name, hire_date,\n  SUBSTR(hire_date, 1, 4) AS 입사연도,\n  SUBSTR(hire_date, 6, 2) AS 입사월\nFROM employees;" },
      { label: 'UPPER / LOWER', sql: "SELECT UPPER('hello') AS upper_case,\n  LOWER('WORLD') AS lower_case;" },
      { label: 'REPLACE', sql: "SELECT name, REPLACE(hire_date, '-', '/') AS 입사일\nFROM employees;" },
      { label: 'TRIM', sql: "SELECT TRIM('  hello  ') AS trimmed;" },
    ],
  },
  {
    group: '윈도우 함수',
    items: [
      { label: 'ROW_NUMBER', sql: 'SELECT name, salary,\n  ROW_NUMBER() OVER (ORDER BY salary DESC) AS 급여순위\nFROM employees;' },
      { label: 'RANK / DENSE_RANK', sql: 'SELECT name, salary,\n  RANK() OVER (ORDER BY salary DESC) AS RANK순위,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS DENSE_RANK순위\nFROM employees;' },
      { label: 'PARTITION BY', sql: 'SELECT name, department_id, salary,\n  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS 부서내순위\nFROM employees;' },
      { label: 'LAG / LEAD', sql: 'SELECT name, salary,\n  LAG(salary, 1) OVER (ORDER BY salary) AS 이전급여,\n  LEAD(salary, 1) OVER (ORDER BY salary) AS 다음급여\nFROM employees;' },
      { label: '누적합 (SUM OVER)', sql: 'SELECT name, salary,\n  SUM(salary) OVER (ORDER BY salary\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 누적급여합\nFROM employees;' },
      { label: '이동평균', sql: 'SELECT name, salary,\n  AVG(salary) OVER (ORDER BY id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS 이동평균\nFROM employees;' },
    ],
  },
  {
    group: '집합 연산',
    items: [
      { label: 'UNION', sql: "SELECT name, 'employees' AS source FROM employees\nUNION\nSELECT name, 'departments' AS source FROM departments;" },
      { label: 'UNION ALL', sql: "SELECT name FROM employees WHERE department_id = 1\nUNION ALL\nSELECT name FROM employees WHERE salary >= 6000000;" },
      { label: 'INTERSECT', sql: "SELECT department_id FROM employees WHERE salary >= 6000000\nINTERSECT\nSELECT department_id FROM employees WHERE hire_date < '2021-01-01';" },
      { label: 'EXCEPT', sql: 'SELECT id FROM departments\nEXCEPT\nSELECT DISTINCT department_id FROM employees;' },
    ],
  },
  {
    group: '실무 패턴',
    items: [
      { label: '부서별 TOP 급여자', sql: 'SELECT * FROM (\n  SELECT name, department_id, salary,\n    RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n  FROM employees\n)\nWHERE rnk = 1;' },
      { label: '전월 대비 비교', sql: 'SELECT product_id, order_date, quantity,\n  LAG(quantity) OVER (PARTITION BY product_id ORDER BY order_date) AS 이전주문수량\nFROM orders;' },
      { label: '비율 계산', sql: 'SELECT department_id, COUNT(*) AS 직원수,\n  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 1) AS 비율\nFROM employees\nGROUP BY department_id;' },
      { label: '누적 주문 금액', sql: 'SELECT o.order_date,\n  o.quantity * p.price AS 주문금액,\n  SUM(o.quantity * p.price) OVER (\n    ORDER BY o.order_date\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS 누적금액\nFROM orders o\nJOIN products p ON o.product_id = p.id;' },
    ],
  },
  {
    group: 'CREATE TABLE',
    items: [
      {
        label: '기본 생성',
        sql: 'CREATE TABLE IF NOT EXISTS students (\n  id   INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT    NOT NULL,\n  age  INTEGER,\n  gpa  REAL    DEFAULT 0.0\n);',
      },
      {
        label: '복합 기본키',
        sql: 'CREATE TABLE IF NOT EXISTS enrollment (\n  student_id INTEGER NOT NULL,\n  course_id  INTEGER NOT NULL,\n  enrolled_at TEXT DEFAULT (DATE(\'now\')),\n  PRIMARY KEY (student_id, course_id)\n);',
      },
      {
        label: 'FOREIGN KEY 포함',
        sql: 'PRAGMA foreign_keys = ON;\n\nCREATE TABLE IF NOT EXISTS courses (\n  id   INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  credit INTEGER CHECK (credit BETWEEN 1 AND 6)\n);\n\nCREATE TABLE IF NOT EXISTS enrollments (\n  id         INTEGER PRIMARY KEY AUTOINCREMENT,\n  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,\n  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,\n  score      REAL CHECK (score BETWEEN 0 AND 100)\n);',
      },
      {
        label: 'SELECT로 테이블 복사',
        sql: '-- 구조 + 데이터 복사\nCREATE TABLE employees_backup AS\nSELECT * FROM employees;\n\n-- 구조만 복사 (데이터 없음)\nCREATE TABLE employees_empty AS\nSELECT * FROM employees WHERE 1 = 0;',
      },
      {
        label: 'DROP / TRUNCATE',
        sql: 'DROP TABLE IF EXISTS students;\n\n-- SQLite에는 TRUNCATE 없음 → DELETE로 대체\nDELETE FROM employees_backup;\n-- 또는 auto-increment 초기화까지\nDELETE FROM employees_backup;\nDELETE FROM sqlite_sequence WHERE name = \'employees_backup\';',
      },
    ],
  },
  {
    group: '제약조건 (Constraints)',
    items: [
      {
        label: 'NOT NULL + DEFAULT',
        sql: 'CREATE TABLE IF NOT EXISTS accounts (\n  id         INTEGER PRIMARY KEY AUTOINCREMENT,\n  username   TEXT    NOT NULL UNIQUE,\n  balance    REAL    NOT NULL DEFAULT 0.0,\n  created_at TEXT    NOT NULL DEFAULT (DATETIME(\'now\')),\n  is_active  INTEGER NOT NULL DEFAULT 1   -- SQLite 불리언 대용\n);',
      },
      {
        label: 'UNIQUE (단일 / 복합)',
        sql: 'CREATE TABLE IF NOT EXISTS user_emails (\n  id      INTEGER PRIMARY KEY,\n  user_id INTEGER NOT NULL,\n  email   TEXT    NOT NULL,\n  type    TEXT    NOT NULL DEFAULT \'work\',\n  -- 단일 UNIQUE\n  UNIQUE (email),\n  -- 복합 UNIQUE: 한 유저가 같은 타입의 이메일 중복 불가\n  UNIQUE (user_id, type)\n);',
      },
      {
        label: 'CHECK',
        sql: 'CREATE TABLE IF NOT EXISTS products_v2 (\n  id       INTEGER PRIMARY KEY,\n  name     TEXT NOT NULL,\n  price    REAL NOT NULL CHECK (price > 0),\n  stock    INTEGER   CHECK (stock >= 0),\n  category TEXT      CHECK (category IN (\'전자제품\',\'가구\',\'사무용품\'))\n);\n\n-- 확인\nINSERT INTO products_v2 VALUES (1, \'노트북\', 1200000, 10, \'전자제품\');\nINSERT INTO products_v2 VALUES (2, \'마우스\', -100, 5, \'전자제품\'); -- CHECK 위반!',
      },
      {
        label: 'FOREIGN KEY ON DELETE',
        sql: 'PRAGMA foreign_keys = ON;\n\nCREATE TABLE IF NOT EXISTS depts (\n  id   INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nCREATE TABLE IF NOT EXISTS emps (\n  id      INTEGER PRIMARY KEY,\n  name    TEXT NOT NULL,\n  dept_id INTEGER REFERENCES depts(id)\n    ON DELETE SET NULL    -- 부서 삭제 시 NULL로\n    ON UPDATE CASCADE     -- 부서 ID 변경 시 따라감\n);\n\nINSERT INTO depts VALUES (1,\'개발팀\'),(2,\'영업팀\');\nINSERT INTO emps VALUES (1,\'홍길동\',1),(2,\'김철수\',2);\nDELETE FROM depts WHERE id = 1;  -- emps.dept_id → NULL\nSELECT * FROM emps;',
      },
      {
        label: 'FOREIGN KEY ON DELETE CASCADE',
        sql: 'PRAGMA foreign_keys = ON;\n\nCREATE TABLE IF NOT EXISTS parents (\n  id   INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS children (\n  id        INTEGER PRIMARY KEY,\n  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,\n  name      TEXT NOT NULL\n);\n\nINSERT INTO parents VALUES (1,\'부모A\'),(2,\'부모B\');\nINSERT INTO children VALUES (1,1,\'자녀1\'),(2,1,\'자녀2\'),(3,2,\'자녀3\');\nDELETE FROM parents WHERE id = 1;  -- 자녀1, 자녀2 자동 삭제\nSELECT * FROM children;',
      },
      {
        label: 'CONSTRAINT 이름 지정',
        sql: 'CREATE TABLE IF NOT EXISTS orders_v2 (\n  id          INTEGER,\n  employee_id INTEGER,\n  amount      REAL,\n  status      TEXT,\n  CONSTRAINT pk_orders     PRIMARY KEY (id),\n  CONSTRAINT fk_emp        FOREIGN KEY (employee_id) REFERENCES employees(id),\n  CONSTRAINT chk_amount    CHECK (amount > 0),\n  CONSTRAINT chk_status    CHECK (status IN (\'대기\',\'처리\',\'완료\',\'취소\'))\n);',
      },
    ],
  },
  {
    group: 'ALTER TABLE',
    items: [
      {
        label: '컬럼 추가',
        sql: '-- 기준 테이블 생성\nCREATE TABLE IF NOT EXISTS members (\n  id   INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\nINSERT INTO members VALUES (1,\'홍길동\'),(2,\'김철수\');\n\n-- 컬럼 추가 (DEFAULT 지정 가능)\nALTER TABLE members ADD COLUMN email    TEXT;\nALTER TABLE members ADD COLUMN joined   TEXT DEFAULT (DATE(\'now\'));\nALTER TABLE members ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;\nSELECT * FROM members;',
      },
      {
        label: '컬럼 이름 변경',
        sql: 'CREATE TABLE IF NOT EXISTS members (\n  id   INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n-- SQLite 3.25+\nALTER TABLE members RENAME COLUMN name TO full_name;\nSELECT * FROM members;',
      },
      {
        label: '컬럼 삭제',
        sql: 'CREATE TABLE IF NOT EXISTS members (\n  id    INTEGER PRIMARY KEY,\n  name  TEXT NOT NULL,\n  temp  TEXT\n);\nINSERT INTO members(id,name,temp) VALUES (1,\'홍길동\',\'삭제예정\');\n-- SQLite 3.35+\nALTER TABLE members DROP COLUMN temp;\nSELECT * FROM members;',
      },
      {
        label: '테이블 이름 변경',
        sql: 'CREATE TABLE IF NOT EXISTS old_name (id INTEGER PRIMARY KEY, val TEXT);\nINSERT INTO old_name VALUES (1,\'테스트\');\n\nALTER TABLE old_name RENAME TO new_name;\nSELECT * FROM new_name;',
      },
    ],
  },
  {
    group: '뷰 (VIEW)',
    items: [
      {
        label: 'CREATE VIEW',
        sql: 'CREATE VIEW IF NOT EXISTS v_emp_dept AS\nSELECT\n  e.id,\n  e.name AS 직원명,\n  d.name AS 부서명,\n  e.salary,\n  e.hire_date\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.id;\n\nSELECT * FROM v_emp_dept ORDER BY salary DESC;',
      },
      {
        label: '집계 뷰',
        sql: 'CREATE VIEW IF NOT EXISTS v_dept_stats AS\nSELECT\n  d.name AS 부서,\n  COUNT(e.id)       AS 인원수,\n  AVG(e.salary)     AS 평균급여,\n  MAX(e.salary)     AS 최고급여,\n  MIN(e.salary)     AS 최저급여,\n  SUM(e.salary)     AS 총급여\nFROM departments d\nLEFT JOIN employees e ON d.id = e.department_id\nGROUP BY d.id, d.name;\n\nSELECT * FROM v_dept_stats;',
      },
      {
        label: 'VIEW로 쿼리',
        sql: '-- 뷰가 없으면 먼저 위 예제 실행\nSELECT * FROM v_emp_dept\nWHERE 부서명 = \'개발팀\'\nORDER BY salary DESC;',
      },
      {
        label: 'DROP VIEW',
        sql: 'DROP VIEW IF EXISTS v_emp_dept;\nDROP VIEW IF EXISTS v_dept_stats;',
      },
    ],
  },
  {
    group: '인덱스 (INDEX)',
    items: [
      {
        label: '단일 컬럼 인덱스',
        sql: '-- 조회 성능 향상 (자주 WHERE/ORDER BY에 쓰는 컬럼)\nCREATE INDEX IF NOT EXISTS idx_emp_salary\n  ON employees (salary);\n\nCREATE INDEX IF NOT EXISTS idx_emp_hire\n  ON employees (hire_date);\n\n-- 인덱스 목록 확인\nSELECT * FROM sqlite_master WHERE type = \'index\';',
      },
      {
        label: 'UNIQUE INDEX',
        sql: '-- 중복 방지 + 성능 향상\nCREATE TABLE IF NOT EXISTS users (\n  id    INTEGER PRIMARY KEY,\n  email TEXT NOT NULL\n);\nCREATE UNIQUE INDEX IF NOT EXISTS uidx_users_email\n  ON users (email);\n\nINSERT INTO users VALUES (1,\'a@test.com\');\nINSERT INTO users VALUES (2,\'a@test.com\'); -- UNIQUE 위반!',
      },
      {
        label: '복합 인덱스',
        sql: '-- (부서, 급여) 복합 인덱스\nCREATE INDEX IF NOT EXISTS idx_emp_dept_salary\n  ON employees (department_id, salary DESC);\n\n-- 이 쿼리에서 인덱스 활용됨\nSELECT name, salary\nFROM employees\nWHERE department_id = 1\nORDER BY salary DESC;',
      },
      {
        label: '부분 인덱스',
        sql: '-- 조건에 맞는 행만 인덱싱\nCREATE INDEX IF NOT EXISTS idx_high_salary\n  ON employees (salary)\n  WHERE salary >= 6000000;\n\nSELECT name, salary FROM employees WHERE salary >= 6000000;',
      },
      {
        label: 'DROP INDEX',
        sql: 'DROP INDEX IF EXISTS idx_emp_salary;\nDROP INDEX IF EXISTS idx_emp_hire;\nDROP INDEX IF EXISTS idx_emp_dept_salary;\n\nSELECT * FROM sqlite_master WHERE type = \'index\';',
      },
    ],
  },
  {
    group: '트랜잭션',
    items: [
      {
        label: 'BEGIN / COMMIT',
        sql: 'CREATE TABLE IF NOT EXISTS accounts (\n  id      INTEGER PRIMARY KEY,\n  owner   TEXT NOT NULL,\n  balance REAL NOT NULL DEFAULT 0\n);\nINSERT OR IGNORE INTO accounts VALUES (1,\'홍길동\',100000),(2,\'김철수\',50000);\n\nBEGIN;\n  UPDATE accounts SET balance = balance - 30000 WHERE id = 1;\n  UPDATE accounts SET balance = balance + 30000 WHERE id = 2;\nCOMMIT;\n\nSELECT * FROM accounts;',
      },
      {
        label: 'ROLLBACK',
        sql: 'SELECT * FROM accounts;  -- 현재 잔액 확인\n\nBEGIN;\n  UPDATE accounts SET balance = balance - 999999 WHERE id = 1;\n  -- 오류 발견! 취소\nROLLBACK;\n\nSELECT * FROM accounts;  -- 잔액 그대로',
      },
      {
        label: 'SAVEPOINT',
        sql: 'BEGIN;\n  INSERT INTO accounts(id,owner,balance) VALUES (3,\'이영희\',80000);\n  SAVEPOINT sp1;\n\n  INSERT INTO accounts(id,owner,balance) VALUES (4,\'박민수\',60000);\n  SAVEPOINT sp2;\n\n  -- sp2 이후만 취소\n  ROLLBACK TO sp2;\n\n  -- sp1 이후 (박민수) 취소됨, 이영희는 유지\nCOMMIT;\n\nSELECT * FROM accounts;',
      },
      {
        label: 'INSERT OR IGNORE / REPLACE',
        sql: 'CREATE TABLE IF NOT EXISTS tags (\n  id   INTEGER PRIMARY KEY,\n  name TEXT UNIQUE NOT NULL\n);\n\n-- 중복이면 무시\nINSERT OR IGNORE INTO tags VALUES (1,\'SQL\'),(2,\'JOIN\'),(3,\'SQL\');\n\n-- 중복이면 삭제 후 재삽입\nINSERT OR REPLACE INTO tags VALUES (2,\'JOIN-업데이트됨\');\n\nSELECT * FROM tags;',
      },
    ],
  },
  {
    group: '데이터 타입 / 기타',
    items: [
      {
        label: 'SQLite 데이터 타입',
        sql: '-- SQLite 타입 선호도 (Type Affinity)\nCREATE TABLE IF NOT EXISTS type_demo (\n  col_int     INTEGER,   -- 정수\n  col_real    REAL,      -- 부동소수점\n  col_text    TEXT,      -- 문자열\n  col_blob    BLOB,      -- 바이너리\n  col_num     NUMERIC,   -- INTEGER 또는 REAL\n  col_bool    INTEGER,   -- 불리언 (0/1)\n  col_date    TEXT,      -- 날짜 (ISO 8601)\n  col_json    TEXT       -- JSON 문자열\n);\n\nINSERT INTO type_demo VALUES\n  (42, 3.14, \'hello\', NULL, 1234.5, 1, DATE(\'now\'), \'{"key":"value"}\');\n\nSELECT *, TYPEOF(col_int), TYPEOF(col_real), TYPEOF(col_text) FROM type_demo;',
      },
      {
        label: 'PRAGMA 정보 조회',
        sql: '-- 테이블 컬럼 정보\nPRAGMA table_info(employees);\n\n-- 외래키 목록\nPRAGMA foreign_key_list(employees);\n\n-- 인덱스 목록\nPRAGMA index_list(employees);\n\n-- 외래키 활성화 상태\nPRAGMA foreign_keys;',
      },
      {
        label: 'sqlite_master 조회',
        sql: '-- 모든 오브젝트 목록 (테이블, 뷰, 인덱스)\nSELECT type, name, sql\nFROM sqlite_master\nWHERE type IN (\'table\',\'view\',\'index\')\nORDER BY type, name;',
      },
      {
        label: 'UPSERT (INSERT OR)',
        sql: 'CREATE TABLE IF NOT EXISTS kv_store (\n  key   TEXT PRIMARY KEY,\n  value TEXT NOT NULL,\n  updated_at TEXT DEFAULT (DATETIME(\'now\'))\n);\n\n-- 없으면 삽입, 있으면 업데이트 (SQLite 3.24+)\nINSERT INTO kv_store(key, value) VALUES (\'theme\',\'dark\')\n  ON CONFLICT(key) DO UPDATE SET\n    value = excluded.value,\n    updated_at = DATETIME(\'now\');\n\nINSERT INTO kv_store(key, value) VALUES (\'theme\',\'light\')\n  ON CONFLICT(key) DO UPDATE SET\n    value = excluded.value,\n    updated_at = DATETIME(\'now\');\n\nSELECT * FROM kv_store;',
      },
    ],
  },
];

export default function Playground() {
  const [query, setQuery] = useState('SELECT * FROM employees;');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [ddlSuccess, setDdlSuccess] = useState(false);
  const [schema, setSchema] = useState(() => getSchema());
  const [selectedTable, setSelectedTable] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [autocomplete, setAutocomplete] = useState(() => {
    const stored = localStorage.getItem(AC_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [showCsvImport, setShowCsvImport] = useState(false);

  const schemaForEditor = useMemo(() => {
    const obj = {};
    schema.forEach((tbl) => { obj[tbl.name] = tbl.columns.map((c) => c.col); });
    return obj;
  }, [schema]);

  const execute = useCallback(() => {
    setError(null);
    setResults(null);
    setDdlSuccess(false);
    const start = performance.now();
    try {
      const res = runQuery(query.trim());
      setElapsed(Math.round(performance.now() - start));
      if (res.length === 0) {
        setDdlSuccess(true);
      } else {
        setResults(res);
      }
      setSchema(getSchema());
    } catch (e) {
      setElapsed(null);
      setError(translateSqlError(e));
    }
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); execute(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [execute]);

  const previewTable = (name) => {
    setSelectedTable(name);
    setQuery(`SELECT * FROM ${name} LIMIT 10;`);
  };

  const toggleAutocomplete = () => {
    setAutocomplete((prev) => {
      const next = !prev;
      localStorage.setItem(AC_KEY, String(next));
      return next;
    });
  };

  const toggleGroup = (group) => {
    setOpenGroup((prev) => (prev === group ? null : group));
  };

  const handleFormat = () => {
    setQuery((value) => formatSql(value));
  };

  const changeEditorMode = (mode) => {
    setEditorMode(mode);
    saveStoredEditorMode(mode);
  };

  const pickSyntax = (sql) => {
    setQuery(sql);
  };

  const effectiveAutocomplete = editorMode !== 'terminal' && autocomplete;

  return (
    <div className="page playground-page">
      <div className="page-header">
        <h2 className="page-title">자유 연습</h2>
        <span className="page-desc">마음껏 SQL을 작성하고 실행해보세요 (Ctrl+Enter)</span>
      </div>

      <div className="playground-layout">
        {/* 왼쪽: 예제 그룹 */}
        <aside className="playground-sidebar">
          {editorMode === 'beginner' ? (
            <SyntaxPicker onPick={pickSyntax} />
          ) : editorMode === 'terminal' ? (
            <div className="sidebar-section terminal-help">
              <div className="sidebar-label">터미널 모드</div>
              <div className="terminal-help-line">Ctrl+Enter로 실행</div>
              <div className="terminal-help-line">자동완성 최소화</div>
              <div className="terminal-help-line">결과만 빠르게 확인</div>
            </div>
          ) : (
            <div className="sidebar-section">
              <div className="sidebar-label">예제 쿼리</div>
              {EXAMPLE_GROUPS.map((grp) => (
                <div key={grp.group} className="ex-group">
                  <button
                    className="ex-group-header"
                    onClick={() => toggleGroup(grp.group)}
                  >
                    <span>{grp.group}</span>
                    <span className="ex-group-chevron"><Icon name={openGroup === grp.group ? 'chevron-down' : 'chevron-right'} style={{width:12,height:12}} /></span>
                  </button>
                  {openGroup === grp.group && (
                    <div className="ex-group-items">
                      {grp.items.map((ex) => (
                        <button
                          key={ex.label}
                          className="ex-btn"
                          onClick={() => setQuery(ex.sql)}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-label">테이블 목록</div>
            {schema.map((tbl) => (
              <div key={tbl.name} className="schema-tbl">
                <button
                  className={`schema-tbl-name ${selectedTable === tbl.name ? 'selected' : ''}`}
                  onClick={() => previewTable(tbl.name)}
                >
                  <Icon name="table" className="inline-icon" />
                  {tbl.name}
                </button>
                <div className="schema-cols">
                  {tbl.columns.map((col) => (
                    <div key={col.col} className="schema-col-row">
                      <span className="col-nm">{col.col}</span>
                      <span className="col-tp">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 오른쪽: 에디터 + 결과 */}
        <div className="playground-main">
          {showCsvImport && (
            <CsvImport
              onSuccess={() => { setSchema(getSchema()); setShowCsvImport(false); }}
              onClose={() => setShowCsvImport(false)}
            />
          )}
          <div className="editor-card">
            <EditorModeBar mode={editorMode} onModeChange={changeEditorMode} />
            {editorMode === 'beginner' && (
              <div className="editor-helper-strip">
                왼쪽 문법을 고르면 SQL 골격이 들어갑니다. 값을 바꿔가며 실행해보세요.
              </div>
            )}
            {editorMode === 'terminal' && (
              <div className="terminal-titlebar">
                <span>sqlite-console</span>
                <span>Ctrl+Enter</span>
              </div>
            )}
            <SqlEditor
              value={query}
              onChange={setQuery}
              onRun={execute}
              height={editorMode === 'terminal' ? '260px' : '200px'}
              autocomplete={effectiveAutocomplete}
              schemaOverride={schemaForEditor}
              mode={editorMode}
              placeholder={editorMode === 'terminal' ? 'SELECT * FROM employees;' : undefined}
            />
            <div className="editor-toolbar">
              <button className="btn btn-run" onClick={execute}>
                <Icon name="play" className="btn-icon" />
                실행
              </button>
              <button className="btn btn-ghost-sm" onClick={handleFormat}>
                <Icon name="format" className="status-icon" />
                포맷
              </button>
              <button className="btn btn-ghost-sm" onClick={() => { setQuery(''); setResults(null); setError(null); }}>초기화</button>
              <button className="btn btn-ghost-sm" onClick={() => setShowCsvImport(v => !v)}>
                CSV 가져오기
              </button>
              <span className="editor-shortcut-hint">Ctrl+Enter로 실행</span>
              <button
                className="btn btn-ghost-sm"
                onClick={toggleAutocomplete}
                title="자동완성 토글"
                disabled={editorMode === 'terminal'}
                style={{ marginLeft: 'auto' }}
              >
                자동완성 {effectiveAutocomplete ? '✓' : '—'}
              </button>
            </div>
          </div>

          <div className="result-card">
            {ddlSuccess && !error && (
              <div className="ddl-success-msg">
                <Icon name="success" style={{ width: 16, height: 16 }} />
                명령이 실행되었습니다.
              </div>
            )}
            <ResultTable results={results} error={error} elapsed={elapsed} />
          </div>
        </div>
      </div>
    </div>
  );
}
