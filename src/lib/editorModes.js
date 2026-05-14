export const EDITOR_MODE_KEY = 'sqldojo_editor_mode';

export const EDITOR_MODES = [
  {
    id: 'beginner',
    label: '초급',
    title: '도우미 모드',
    description: '문법 메뉴와 자동완성으로 쿼리 뼈대를 고르며 연습합니다.',
  },
  {
    id: 'comfort',
    label: '중급',
    title: '편의성 에디터',
    description: '자동완성, 포맷, 스키마 참고를 켜두고 직접 작성합니다.',
  },
  {
    id: 'terminal',
    label: '고급',
    title: '터미널 모드',
    description: '도움말을 줄이고 SQL 콘솔처럼 빠르게 실행합니다.',
  },
];

export const SQL_SNIPPET_GROUPS = [
  {
    group: '기본 조회',
    items: [
      { label: 'SELECT 기본', sql: 'SELECT *\nFROM employees;' },
      { label: '필요 컬럼만', sql: 'SELECT name, salary\nFROM employees;' },
      { label: '별칭 사용', sql: 'SELECT name AS 이름, salary AS 급여\nFROM employees;' },
      { label: '중복 제거', sql: 'SELECT DISTINCT category\nFROM products;' },
    ],
  },
  {
    group: '조건',
    items: [
      { label: 'WHERE', sql: 'SELECT *\nFROM employees\nWHERE salary >= 5000000;' },
      { label: 'AND / OR', sql: 'SELECT *\nFROM employees\nWHERE department_id = 1\n  AND salary >= 5000000;' },
      { label: 'LIKE', sql: "SELECT *\nFROM employees\nWHERE name LIKE '김%';" },
      { label: 'BETWEEN', sql: 'SELECT *\nFROM employees\nWHERE salary BETWEEN 4000000 AND 6000000;' },
    ],
  },
  {
    group: '정렬',
    items: [
      { label: 'ORDER BY', sql: 'SELECT name, salary\nFROM employees\nORDER BY salary DESC;' },
      { label: 'LIMIT', sql: 'SELECT *\nFROM employees\nORDER BY id\nLIMIT 5;' },
    ],
  },
  {
    group: '집계',
    items: [
      { label: 'COUNT', sql: 'SELECT COUNT(*) AS 직원수\nFROM employees;' },
      { label: 'GROUP BY', sql: 'SELECT department_id, COUNT(*) AS 직원수\nFROM employees\nGROUP BY department_id;' },
      { label: 'HAVING', sql: 'SELECT department_id, COUNT(*) AS 직원수\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) >= 2;' },
    ],
  },
  {
    group: 'JOIN',
    items: [
      { label: 'INNER JOIN', sql: 'SELECT e.name, d.name AS 부서명\nFROM employees e\nJOIN departments d ON e.department_id = d.id;' },
      { label: 'LEFT JOIN', sql: 'SELECT d.name, COUNT(e.id) AS 직원수\nFROM departments d\nLEFT JOIN employees e ON d.id = e.department_id\nGROUP BY d.name;' },
      { label: '3테이블 JOIN', sql: 'SELECT e.name, p.name AS 상품명, o.quantity\nFROM orders o\nJOIN employees e ON o.employee_id = e.id\nJOIN products p ON o.product_id = p.id;' },
    ],
  },
  {
    group: '서브쿼리',
    items: [
      { label: 'WHERE 서브쿼리', sql: 'SELECT name, salary\nFROM employees\nWHERE salary > (\n  SELECT AVG(salary)\n  FROM employees\n);' },
      { label: 'IN 서브쿼리', sql: 'SELECT *\nFROM employees\nWHERE department_id IN (\n  SELECT id\n  FROM departments\n);' },
    ],
  },
];

export const getStoredEditorMode = () => {
  const stored = localStorage.getItem(EDITOR_MODE_KEY);
  return EDITOR_MODES.some((mode) => mode.id === stored) ? stored : 'comfort';
};

export const saveStoredEditorMode = (mode) => {
  localStorage.setItem(EDITOR_MODE_KEY, mode);
};
