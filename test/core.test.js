import test from 'node:test';
import assert from 'node:assert/strict';
import { splitSqlStatements } from '../src/lib/sqlStatements.js';
import { toLocalDateKey } from '../src/lib/streak.js';

test('SQL statements ignore semicolons inside strings and comments', () => {
  const sql = `SELECT 'a;b' AS value;\n-- keep ; inside comment\nSELECT 2;\n/* block ; comment */ SELECT "x;y";`;
  assert.deepEqual(splitSqlStatements(sql), [
    "SELECT 'a;b' AS value",
    '-- keep ; inside comment\nSELECT 2',
    '/* block ; comment */ SELECT "x;y"',
  ]);
});

test('SQL statements preserve escaped quote pairs', () => {
  assert.deepEqual(splitSqlStatements("SELECT 'it''s;ok'; SELECT 2"), [
    "SELECT 'it''s;ok'",
    'SELECT 2',
  ]);
});

test('local activity date uses the local calendar day', () => {
  const localDate = new Date(2026, 7, 13, 0, 5, 0);
  assert.equal(toLocalDateKey(localDate), '2026-08-13');
});
