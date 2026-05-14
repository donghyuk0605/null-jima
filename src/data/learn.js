export const LEARN_TOPICS = [
  {
    id: 'select',
    title: 'SELECT',
    subtitle: '원하는 컬럼 조회하기',
    description: 'SELECT는 테이블에서 데이터를 조회하는 가장 기본적인 명령어입니다.',
    syntax: `SELECT 컬럼1, 컬럼2\nFROM 테이블명;`,
    examples: [
      {
        title: '모든 컬럼 조회',
        desc: '* 를 사용하면 모든 컬럼을 한 번에 조회합니다.',
        sql: 'SELECT * FROM employees;',
      },
      {
        title: '특정 컬럼만 조회',
        desc: '원하는 컬럼 이름을 쉼표로 구분하여 나열합니다.',
        sql: 'SELECT name, salary FROM employees;',
      },
      {
        title: '별칭(AS) 사용',
        desc: 'AS 키워드로 컬럼에 별칭을 붙일 수 있습니다.',
        sql: 'SELECT name AS 이름, salary AS 급여 FROM employees;',
      },
    ],
    tips: ['* 는 편리하지만 실무에서는 필요한 컬럼만 지정하는 것이 좋습니다.', 'AS 생략도 가능합니다: SELECT name 이름 FROM employees;'],
    relatedProblems: [1, 2, 3, 4],
  },
  {
    id: 'where',
    title: 'WHERE',
    subtitle: '조건으로 데이터 필터링하기',
    description: 'WHERE 절은 조건에 맞는 행만 조회할 때 사용합니다.',
    syntax: `SELECT 컬럼\nFROM 테이블명\nWHERE 조건;`,
    examples: [
      {
        title: '숫자 조건',
        desc: '급여가 6,000,000 이상인 직원을 조회합니다.',
        sql: 'SELECT * FROM employees WHERE salary >= 6000000;',
      },
      {
        title: '문자열 조건',
        desc: '특정 이름의 직원을 조회합니다.',
        sql: "SELECT * FROM employees WHERE name = '정도윤';",
      },
      {
        title: '복합 조건 (AND)',
        desc: '두 조건을 모두 만족하는 행을 조회합니다.',
        sql: "SELECT * FROM employees WHERE department_id = 1 AND salary >= 6000000;",
      },
    ],
    tips: [
      '= (같다), != 또는 <> (다르다), >, >=, <, <= 를 사용할 수 있습니다.',
      'AND는 둘 다 만족, OR는 하나라도 만족할 때 사용합니다.',
      "문자열은 반드시 작은따옴표(' ')로 감싸야 합니다.",
    ],
    relatedProblems: [5, 6, 7],
  },
  {
    id: 'orderby',
    title: 'ORDER BY',
    subtitle: '원하는 기준으로 정렬하기',
    description: 'ORDER BY는 조회 결과를 특정 컬럼 기준으로 정렬합니다.',
    syntax: `SELECT 컬럼\nFROM 테이블명\nORDER BY 컬럼 [ASC|DESC];`,
    examples: [
      {
        title: '급여 내림차순 (높은 순)',
        desc: 'DESC는 내림차순(큰 값 먼저)입니다.',
        sql: 'SELECT * FROM employees ORDER BY salary DESC;',
      },
      {
        title: '이름 오름차순 (가나다 순)',
        desc: 'ASC는 오름차순(작은 값 먼저)이며 기본값입니다.',
        sql: 'SELECT * FROM employees ORDER BY name ASC;',
      },
      {
        title: '복수 기준 정렬',
        desc: '여러 컬럼으로 정렬 기준을 지정할 수 있습니다.',
        sql: 'SELECT * FROM employees ORDER BY department_id ASC, salary DESC;',
      },
    ],
    tips: [
      'ASC (Ascending: 오름차순)이 기본값이라 생략 가능합니다.',
      'DESC (Descending)은 내림차순입니다.',
      'NULL 값은 보통 정렬의 처음이나 마지막에 위치합니다.',
    ],
    relatedProblems: [8, 9],
  },
  {
    id: 'groupby',
    title: 'GROUP BY',
    subtitle: '그룹별로 집계하기',
    description: 'GROUP BY는 지정한 컬럼의 값이 같은 행들을 하나의 그룹으로 묶어 집계 함수와 함께 사용합니다.',
    syntax: `SELECT 그룹컬럼, 집계함수(컬럼)\nFROM 테이블명\nGROUP BY 그룹컬럼;`,
    examples: [
      {
        title: '부서별 직원 수',
        desc: '부서 ID 기준으로 그룹을 만들고 COUNT()로 직원 수를 셉니다.',
        sql: 'SELECT department_id, COUNT(*) AS 직원수 FROM employees GROUP BY department_id;',
      },
      {
        title: '부서별 평균 급여',
        desc: 'AVG() 함수로 그룹별 평균을 구합니다.',
        sql: 'SELECT department_id, AVG(salary) AS 평균급여 FROM employees GROUP BY department_id;',
      },
      {
        title: '카테고리별 상품 수와 평균가',
        desc: '여러 집계 함수를 동시에 사용할 수 있습니다.',
        sql: 'SELECT category, COUNT(*) AS 수량, AVG(price) AS 평균가격 FROM products GROUP BY category;',
      },
    ],
    tips: [
      'GROUP BY에 없는 컬럼은 SELECT에 집계 함수 없이 사용할 수 없습니다.',
      'COUNT(*): 전체 행 수, COUNT(컬럼): NULL 제외한 행 수',
      'HAVING으로 그룹 결과에 조건을 추가할 수 있습니다.',
    ],
    relatedProblems: [11, 12, 15],
  },
  {
    id: 'join',
    title: 'JOIN',
    subtitle: '여러 테이블 연결하기',
    description: 'JOIN은 공통 컬럼을 기준으로 두 테이블의 데이터를 합칩니다.',
    syntax: `SELECT 컬럼\nFROM 테이블A\nJOIN 테이블B ON 테이블A.컬럼 = 테이블B.컬럼;`,
    examples: [
      {
        title: '직원과 부서명 함께 조회',
        desc: 'employees의 department_id와 departments의 id를 기준으로 연결합니다.',
        sql: 'SELECT e.name, d.name AS 부서명\nFROM employees e\nJOIN departments d ON e.department_id = d.id;',
      },
      {
        title: '주문 상세 정보',
        desc: '세 테이블을 연달아 JOIN할 수 있습니다.',
        sql: 'SELECT e.name AS 주문자, p.name AS 상품, o.quantity\nFROM orders o\nJOIN employees e ON o.employee_id = e.id\nJOIN products p ON o.product_id = p.id;',
      },
    ],
    tips: [
      'INNER JOIN (기본): 양쪽 테이블에 모두 존재하는 행만 반환합니다.',
      'LEFT JOIN: 왼쪽 테이블의 모든 행을 포함합니다 (오른쪽에 없으면 NULL).',
      '테이블에 별칭을 붙이면 쿼리가 간결해집니다 (FROM employees e).',
    ],
    relatedProblems: [13, 14, 18],
  },
  {
    id: 'aggregate',
    title: '집계 함수',
    subtitle: 'COUNT, SUM, AVG, MAX, MIN',
    description: '집계 함수는 여러 행의 데이터를 하나의 값으로 요약합니다.',
    syntax: `SELECT COUNT(*), SUM(컬럼), AVG(컬럼), MAX(컬럼), MIN(컬럼)\nFROM 테이블명;`,
    examples: [
      {
        title: '전체 직원 수',
        desc: 'COUNT(*)는 전체 행 수를 반환합니다.',
        sql: 'SELECT COUNT(*) AS 전체직원수 FROM employees;',
      },
      {
        title: '급여 통계',
        desc: '여러 집계 함수를 동시에 사용할 수 있습니다.',
        sql: 'SELECT SUM(salary) AS 총급여, AVG(salary) AS 평균급여,\n       MAX(salary) AS 최고급여, MIN(salary) AS 최저급여\nFROM employees;',
      },
      {
        title: '카테고리별 재고 합계',
        desc: 'GROUP BY와 함께 사용하는 패턴입니다.',
        sql: 'SELECT category, SUM(stock) AS 총재고\nFROM products\nGROUP BY category;',
      },
    ],
    tips: [
      'COUNT(*): NULL 포함 전체 행 수 / COUNT(컬럼): NULL 제외 행 수',
      'SUM, AVG, MAX, MIN은 NULL을 자동으로 무시합니다.',
      '집계 함수는 WHERE 절에 직접 사용할 수 없습니다 → HAVING 사용',
    ],
    relatedProblems: [11, 12, 15, 17],
  },
  {
    id: 'subquery',
    title: '서브쿼리',
    subtitle: 'SELECT 안의 SELECT',
    description: '서브쿼리는 쿼리 안에 중첩된 또 다른 쿼리입니다. 집계 결과를 조건으로 사용할 때 유용합니다.',
    syntax: `SELECT 컬럼\nFROM 테이블\nWHERE 컬럼 연산자 (SELECT 컬럼 FROM 테이블 WHERE 조건);`,
    examples: [
      {
        title: '평균 급여 이상인 직원',
        desc: '서브쿼리로 평균 급여를 구한 뒤 조건으로 사용합니다.',
        sql: 'SELECT name, salary\nFROM employees\nWHERE salary >= (SELECT AVG(salary) FROM employees);',
      },
      {
        title: '가장 비싼 상품',
        desc: 'MAX()로 최댓값을 구해 조건으로 활용합니다.',
        sql: 'SELECT * FROM products\nWHERE price = (SELECT MAX(price) FROM products);',
      },
    ],
    tips: [
      '서브쿼리는 괄호 ( ) 안에 작성합니다.',
      '서브쿼리가 단일 값을 반환하면 =, >, < 등을 사용할 수 있습니다.',
      '여러 값을 반환하면 IN, ANY, ALL 을 사용합니다.',
    ],
    relatedProblems: [16],
  },

  // 8. HAVING
  {
    id: 'having',
    title: 'HAVING',
    subtitle: '그룹에 조건 걸기',
    description: 'HAVING은 GROUP BY로 만들어진 그룹에 조건을 적용합니다. WHERE가 행을 필터링한다면, HAVING은 그룹을 필터링합니다.',
    syntax: `SELECT 그룹컬럼, 집계함수(컬럼)\nFROM 테이블\nGROUP BY 그룹컬럼\nHAVING 집계조건;`,
    examples: [
      {
        title: '직원 2명 이상인 부서',
        desc: 'GROUP BY로 부서별 직원 수를 구한 뒤, HAVING으로 2명 이상인 부서만 남깁니다.',
        sql: 'SELECT department_id, COUNT(*) AS 직원수\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) >= 2;',
      },
      {
        title: '평균 급여 5백만 이상 부서',
        desc: 'AVG() 결과를 HAVING으로 필터링합니다.',
        sql: 'SELECT department_id,\n  COUNT(*) AS 인원,\n  AVG(salary) AS 평균급여\nFROM employees\nGROUP BY department_id\nHAVING AVG(salary) >= 5000000\nORDER BY 평균급여 DESC;',
      },
      {
        title: 'WHERE와 HAVING 함께 사용',
        desc: 'WHERE로 먼저 행을 필터링한 뒤, GROUP BY → HAVING 순서로 처리됩니다.',
        sql: "SELECT department_id, COUNT(*) AS 직원수, SUM(salary) AS 총급여\nFROM employees\nWHERE hire_date >= '2020-01-01'\nGROUP BY department_id\nHAVING COUNT(*) >= 2\nORDER BY 총급여 DESC;",
      },
    ],
    tips: [
      'WHERE는 개별 행을, HAVING은 집계된 그룹을 필터링합니다.',
      'WHERE 절에는 집계 함수(COUNT, SUM 등)를 쓸 수 없습니다.',
      'SQL 실행 순서: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY',
    ],
    relatedProblems: [15],
  },

  // 9. CASE WHEN / NULL 처리
  {
    id: 'case-when',
    title: 'CASE WHEN / NULL 처리',
    subtitle: '조건부 값 변환과 NULL 다루기',
    description: 'CASE WHEN은 조건에 따라 다른 값을 반환하는 SQL의 if-else입니다. NULL은 "알 수 없는 값"이므로 일반 비교 연산자로는 처리할 수 없습니다.',
    syntax: `-- CASE WHEN\nSELECT CASE\n  WHEN 조건1 THEN 값1\n  WHEN 조건2 THEN 값2\n  ELSE 기본값\nEND AS 별칭\nFROM 테이블;\n\n-- NULL 처리\nCOALESCE(컬럼, 대체값)\nNULLIF(값1, 값2)`,
    examples: [
      {
        title: '급여 등급 분류',
        desc: 'CASE WHEN으로 급여 구간에 따른 등급을 매깁니다.',
        sql: "SELECT name, salary,\n  CASE\n    WHEN salary >= 7000000 THEN 'S등급'\n    WHEN salary >= 6000000 THEN 'A등급'\n    WHEN salary >= 5000000 THEN 'B등급'\n    ELSE 'C등급'\n  END AS 급여등급\nFROM employees\nORDER BY salary DESC;",
      },
      {
        title: 'COALESCE — NULL 대체',
        desc: "COALESCE는 첫 번째 NULL이 아닌 값을 반환합니다. department_id가 NULL이면 '미배정'으로 표시합니다.",
        sql: "SELECT name,\n  COALESCE(CAST(department_id AS TEXT), '미배정') AS 부서\nFROM employees;",
      },
      {
        title: 'NULLIF — 특정 값을 NULL로',
        desc: 'NULLIF(a, b)는 a = b 이면 NULL을 반환합니다. 0으로 나누기 오류 방지에 활용됩니다.',
        sql: "SELECT name, salary,\n  -- salary가 0이면 NULL 반환 (0 나누기 방지)\n  salary / NULLIF(salary, 0) AS 정상여부\nFROM employees;\n\n-- CASE로 조건부 집계도 가능\nSELECT\n  COUNT(CASE WHEN department_id = 1 THEN 1 END) AS 개발팀수,\n  COUNT(CASE WHEN department_id = 2 THEN 1 END) AS 마케팅팀수\nFROM employees;",
      },
    ],
    tips: [
      'CASE는 SELECT, WHERE, ORDER BY, GROUP BY 어디서든 사용 가능합니다.',
      'NULL = NULL은 UNKNOWN입니다. NULL 비교는 반드시 IS NULL / IS NOT NULL을 사용하세요.',
      'COALESCE(a, b, c)는 왼쪽부터 NULL이 아닌 첫 번째 값을 반환합니다.',
    ],
    relatedProblems: [],
  },

  // 10. 윈도우 함수
  {
    id: 'window',
    title: '윈도우 함수',
    subtitle: '그룹 집계 + 개별 행 유지',
    description: '윈도우 함수(Window Function)는 GROUP BY처럼 집계하지만, 행을 합치지 않고 각 행을 유지한 채 집계 결과를 함께 보여줍니다. SQLD/SQLP 필수 개념입니다.',
    syntax: `함수() OVER (\n  [PARTITION BY 그룹컬럼]\n  [ORDER BY 정렬컬럼]\n  [ROWS/RANGE 범위]\n)`,
    examples: [
      {
        title: '급여 순위 (RANK / DENSE_RANK / ROW_NUMBER)',
        desc: 'RANK는 동점 다음 번호를 건너뛰고, DENSE_RANK는 이어서 매기며, ROW_NUMBER는 무조건 고유 번호를 부여합니다.',
        sql: 'SELECT name, salary,\n  RANK()       OVER (ORDER BY salary DESC) AS RANK순위,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS DENSE_RANK순위,\n  ROW_NUMBER() OVER (ORDER BY salary DESC) AS ROW_NUMBER순위\nFROM employees;',
      },
      {
        title: '부서 내 급여 순위 (PARTITION BY)',
        desc: 'PARTITION BY로 그룹을 나눠 각 그룹 내에서 순위를 매깁니다.',
        sql: 'SELECT name, department_id, salary,\n  RANK() OVER (\n    PARTITION BY department_id\n    ORDER BY salary DESC\n  ) AS 부서내순위\nFROM employees\nORDER BY department_id, 부서내순위;',
      },
      {
        title: 'LAG / LEAD — 이전·다음 행 참조',
        desc: 'LAG는 이전 행, LEAD는 다음 행의 값을 가져옵니다. 전월 대비 비교 등에 활용합니다.',
        sql: 'SELECT name, salary,\n  LAG(salary)  OVER (ORDER BY salary) AS 이전급여,\n  LEAD(salary) OVER (ORDER BY salary) AS 다음급여,\n  salary - LAG(salary) OVER (ORDER BY salary) AS 차이\nFROM employees\nORDER BY salary;',
      },
      {
        title: '누적 합계 (SUM OVER)',
        desc: 'ROWS BETWEEN으로 집계 범위를 지정합니다. UNBOUNDED PRECEDING = 처음부터 현재 행까지.',
        sql: 'SELECT name, salary,\n  SUM(salary) OVER (\n    ORDER BY salary\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS 누적급여합\nFROM employees\nORDER BY salary;',
      },
    ],
    tips: [
      'PARTITION BY는 GROUP BY처럼 그룹을 나누지만, 행을 합치지 않습니다.',
      'RANK vs DENSE_RANK: 동점자 처리 방식이 시험에 자주 출제됩니다.',
      'LAG(컬럼, N, 기본값): N번째 이전 행 참조, 없으면 기본값 반환.',
    ],
    relatedProblems: [],
  },

  // 11. 집합 연산
  {
    id: 'set-ops',
    title: '집합 연산',
    subtitle: 'UNION, INTERSECT, EXCEPT',
    description: '집합 연산은 두 SELECT 결과를 합치거나, 공통 부분을 구하거나, 차집합을 구합니다. 두 쿼리의 컬럼 수와 타입이 같아야 합니다.',
    syntax: `-- 합집합 (중복 제거)\nSELECT ... UNION SELECT ...\n\n-- 합집합 (중복 포함)\nSELECT ... UNION ALL SELECT ...\n\n-- 교집합\nSELECT ... INTERSECT SELECT ...\n\n-- 차집합\nSELECT ... EXCEPT SELECT ...`,
    examples: [
      {
        title: 'UNION — 합집합 (중복 제거)',
        desc: '개발팀 직원과 급여 6백만 이상 직원을 합칩니다. 중복은 자동 제거됩니다.',
        sql: 'SELECT name, department_id, salary\nFROM employees WHERE department_id = 1\nUNION\nSELECT name, department_id, salary\nFROM employees WHERE salary >= 6000000\nORDER BY salary DESC;',
      },
      {
        title: 'UNION ALL — 합집합 (중복 포함)',
        desc: 'UNION ALL은 중복을 제거하지 않아서 UNION보다 빠릅니다.',
        sql: "SELECT '직원' AS 구분, name AS 이름 FROM employees\nUNION ALL\nSELECT '부서', name FROM departments;",
      },
      {
        title: 'INTERSECT — 교집합',
        desc: '개발팀이면서 동시에 고급여인 직원 (department_id가 겹치는 것).',
        sql: "SELECT department_id FROM employees WHERE salary >= 6000000\nINTERSECT\nSELECT department_id FROM employees WHERE hire_date < '2021-01-01';",
      },
      {
        title: 'EXCEPT — 차집합',
        desc: '주문이 없는 직원 ID를 구합니다.',
        sql: 'SELECT id FROM employees\nEXCEPT\nSELECT DISTINCT employee_id FROM orders;',
      },
    ],
    tips: [
      '두 SELECT의 컬럼 수가 같아야 합니다. 컬럼명은 첫 번째 SELECT 기준을 따릅니다.',
      'UNION은 내부적으로 정렬·중복제거를 하므로 UNION ALL보다 느립니다.',
      'ORDER BY는 전체 결과 맨 마지막에 한 번만 씁니다.',
    ],
    relatedProblems: [],
  },
];
