const FEATURE_PATTERNS = {
  WHERE: /\bwhere\b/i,
  'ORDER BY': /\border\s+by\b/i,
  LIMIT: /\blimit\b/i,
  DISTINCT: /\bdistinct\b/i,
  BETWEEN: /\bbetween\b/i,
  LIKE: /\blike\b/i,
  IN: /\bin\s*\(/i,
  AND: /\band\b/i,
  'GROUP BY': /\bgroup\s+by\b/i,
  HAVING: /\bhaving\b/i,
  JOIN: /\bjoin\b/i,
  'LEFT JOIN': /\bleft\s+join\b/i,
  'CASE WHEN': /\bcase\b[\s\S]*\bwhen\b/i,
  집계함수: /\b(count|sum|avg|max|min)\s*\(/i,
  서브쿼리: /\(\s*(?:with\b[\s\S]*?\s+)?select\b/i,
  윈도우함수: /\bover\s*\(/i,
  RANK: /\brank\s*\(/i,
  'SUM OVER': /\bsum\s*\([\s\S]*\)\s*over\s*\(/i,
  상관서브쿼리: /\(\s*(?:with\b[\s\S]*?\s+)?select\b[\s\S]*\b[a-z_]\w*\.[a-z_]\w*/i,
};

const MUTATING_PATTERN = /\b(insert|update|delete|create|drop|alter|replace|vacuum|reindex|pragma|attach|detach)\b/i;

function stripSqlNoise(sql) {
  let output = '';
  let i = 0;
  let quote = null;

  while (i < sql.length) {
    const current = sql[i];
    const next = sql[i + 1];

    if (!quote && current === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
      output += '\n';
      continue;
    }
    if (!quote && current === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1;
      i += 2;
      output += ' ';
      continue;
    }

    if (quote) {
      if (current === "'" && next === "'") {
        i += 2;
        output += '  ';
        continue;
      }
      if (current === "'") quote = null;
      output += current === '\n' ? '\n' : ' ';
      i += 1;
      continue;
    }

    if (current === "'") {
      quote = "'";
      output += ' ';
      i += 1;
      continue;
    }

    // Keep double-quoted/backtick identifiers so quoted table names still count.
    output += current;
    i += 1;
  }

  return output;
}

export function getMissingQueryRequirements(sql, { requiredTags = [], requiredTables = [] } = {}) {
  const normalized = stripSqlNoise(String(sql || ''));
  const missingTags = [...new Set(requiredTags)].filter((tag) => {
    const pattern = FEATURE_PATTERNS[tag];
    return pattern ? !pattern.test(normalized) : false;
  });
  const missingTables = [...new Set(requiredTables)].filter((table) => {
    const pattern = new RegExp(`\\b${String(table).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return !pattern.test(normalized);
  });

  return {
    missingTags,
    missingTables,
    readOnly: !MUTATING_PATTERN.test(normalized),
  };
}
