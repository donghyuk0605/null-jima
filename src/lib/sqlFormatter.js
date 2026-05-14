const CLAUSES = [
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'HAVING',
  'ORDER BY',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'OUTER JOIN',
  'UNION',
  'UNION ALL',
  'INTERSECT',
  'EXCEPT',
];

const KEYWORDS = [
  ...CLAUSES,
  'ON',
  'AS',
  'AND',
  'OR',
  'DESC',
  'ASC',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
];

export function formatSql(sql) {
  if (!sql.trim()) return sql;

  let formatted = sql
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*;\s*$/g, '');

  KEYWORDS
    .sort((a, b) => b.length - a.length)
    .forEach((keyword) => {
      formatted = formatted.replace(
        new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\b`, 'gi'),
        keyword
      );
    });

  CLAUSES
    .sort((a, b) => b.length - a.length)
    .forEach((clause) => {
      formatted = formatted.replace(
        new RegExp(`\\s+${clause.replace(' ', '\\s+')}\\b`, 'g'),
        `\n${clause}`
      );
    });

  formatted = formatted
    .replace(/\s+(AND|OR)\s+/g, '\n  $1 ')
    .replace(/\s+(JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN)\s+/g, '\n$1 ')
    .replace(/\s+ON\s+/g, '\n  ON ')
    .replace(/^SELECT\s+/g, 'SELECT ')
    .trim();

  return `${formatted};`;
}
