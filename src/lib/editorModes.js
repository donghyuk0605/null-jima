export const EDITOR_MODE_KEY = 'sqldojo_editor_mode';

export const EDITOR_MODES = [
  {
    id: 'beginner',
    labelKey: 'editor.mode.beginner.label',
    titleKey: 'editor.mode.beginner.title',
    descKey: 'editor.mode.beginner.desc',
  },
  {
    id: 'comfort',
    labelKey: 'editor.mode.comfort.label',
    titleKey: 'editor.mode.comfort.title',
    descKey: 'editor.mode.comfort.desc',
  },
  {
    id: 'terminal',
    labelKey: 'editor.mode.terminal.label',
    titleKey: 'editor.mode.terminal.title',
    descKey: 'editor.mode.terminal.desc',
  },
];

export const SQL_SNIPPET_GROUPS = [
  {
    group: 'basic',
    groupKey: 'snippet.group.basic',
    items: [
      { id: 'basic.all', labelKey: 'snippet.basic.all', sql: 'SELECT *\nFROM employees;' },
      { id: 'basic.cols', labelKey: 'snippet.basic.cols', sql: 'SELECT name, salary\nFROM employees;' },
      { id: 'basic.alias', labelKey: 'snippet.basic.alias', sql: 'SELECT name AS 이름, salary AS 급여\nFROM employees;' },
      { id: 'basic.distinct', labelKey: 'snippet.basic.distinct', sql: 'SELECT DISTINCT category\nFROM products;' },
    ],
  },
  {
    group: 'where',
    groupKey: 'snippet.group.where',
    items: [
      { id: 'where.where', labelKey: 'snippet.where.where', sql: 'SELECT *\nFROM employees\nWHERE salary >= 5000000;' },
      { id: 'where.and_or', labelKey: 'snippet.where.and_or', sql: 'SELECT *\nFROM employees\nWHERE department_id = 1\n  AND salary >= 5000000;' },
      { id: 'where.like', labelKey: 'snippet.where.like', sql: "SELECT *\nFROM employees\nWHERE name LIKE '김%';" },
      { id: 'where.between', labelKey: 'snippet.where.between', sql: 'SELECT *\nFROM employees\nWHERE salary BETWEEN 4000000 AND 6000000;' },
    ],
  },
  {
    group: 'order',
    groupKey: 'snippet.group.order',
    items: [
      { id: 'order.orderby', labelKey: 'snippet.order.orderby', sql: 'SELECT name, salary\nFROM employees\nORDER BY salary DESC;' },
      { id: 'order.limit', labelKey: 'snippet.order.limit', sql: 'SELECT *\nFROM employees\nORDER BY id\nLIMIT 5;' },
    ],
  },
  {
    group: 'agg',
    groupKey: 'snippet.group.agg',
    items: [
      { id: 'agg.count', labelKey: 'snippet.agg.count', sql: 'SELECT COUNT(*) AS 직원수\nFROM employees;' },
      { id: 'agg.groupby', labelKey: 'snippet.agg.groupby', sql: 'SELECT department_id, COUNT(*) AS 직원수\nFROM employees\nGROUP BY department_id;' },
      { id: 'agg.having', labelKey: 'snippet.agg.having', sql: 'SELECT department_id, COUNT(*) AS 직원수\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) >= 2;' },
    ],
  },
  {
    group: 'join',
    groupKey: 'snippet.group.join',
    items: [
      { id: 'join.inner', labelKey: 'snippet.join.inner', sql: 'SELECT e.name, d.name AS 부서명\nFROM employees e\nJOIN departments d ON e.department_id = d.id;' },
      { id: 'join.left', labelKey: 'snippet.join.left', sql: 'SELECT d.name, COUNT(e.id) AS 직원수\nFROM departments d\nLEFT JOIN employees e ON d.id = e.department_id\nGROUP BY d.name;' },
      { id: 'join.triple', labelKey: 'snippet.join.triple', sql: 'SELECT e.name, p.name AS 상품명, o.quantity\nFROM orders o\nJOIN employees e ON o.employee_id = e.id\nJOIN products p ON o.product_id = p.id;' },
    ],
  },
  {
    group: 'subquery',
    groupKey: 'snippet.group.subquery',
    items: [
      { id: 'sub.where', labelKey: 'snippet.sub.where', sql: 'SELECT name, salary\nFROM employees\nWHERE salary > (\n  SELECT AVG(salary)\n  FROM employees\n);' },
      { id: 'sub.in', labelKey: 'snippet.sub.in', sql: 'SELECT *\nFROM employees\nWHERE department_id IN (\n  SELECT id\n  FROM departments\n);' },
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
