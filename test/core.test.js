import test from 'node:test';
import assert from 'node:assert/strict';
import { splitSqlStatements } from '../src/lib/sqlStatements.js';
import { toLocalDateKey } from '../src/lib/streak.js';
import { getMissingQueryRequirements } from '../src/lib/queryRequirements.js';
import { getRecommendedProblem, getRecommendedTopic } from '../src/lib/recommendations.js';
import { CERT_LIST, CERT_QUIZZES } from '../src/data/cert.js';
import { gradeCertificationExam } from '../src/lib/certExam.js';

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

test('query requirements ignore SQL literals and comments', () => {
  const result = getMissingQueryRequirements(
    "SELECT 'where order by employees' AS note FROM employees -- JOIN departments",
    { requiredTags: ['WHERE', 'ORDER BY'], requiredTables: ['employees', 'departments'] },
  );

  assert.deepEqual(result.missingTags, ['WHERE', 'ORDER BY']);
  assert.deepEqual(result.missingTables, ['departments']);
  assert.equal(result.readOnly, true);
});

test('query requirements reject data-changing statements', () => {
  const result = getMissingQueryRequirements('UPDATE employees SET salary = 1 WHERE id = 1', {
    requiredTags: ['WHERE'],
    requiredTables: ['employees'],
  });

  assert.equal(result.readOnly, false);
  assert.deepEqual(result.missingTags, []);
  assert.deepEqual(result.missingTables, []);
});

test('recommendations prioritize unfinished review problems', () => {
  const problems = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const recommendation = getRecommendedProblem(problems, {
    1: { attempted: true, attempts: 1 },
    2: { attempted: true, attempts: 2, review: true },
    3: { solved: true },
  });

  assert.equal(recommendation.problem.id, 2);
  assert.equal(recommendation.reason, 'review');
});

test('recommendations keep solved review problems in the practice queue', () => {
  const recommendation = getRecommendedProblem([{ id: 1 }, { id: 2 }], {
    1: { solved: true, review: true, attempts: 2 },
    2: { solved: false },
  });

  assert.equal(recommendation.problem.id, 1);
  assert.equal(recommendation.reason, 'review');
});

test('topic recommendations follow the learner\'s unresolved practice', () => {
  const topics = [
    { id: 'select', relatedProblems: [1, 2] },
    { id: 'where', relatedProblems: [3] },
  ];
  const recommendation = getRecommendedTopic(topics, {
    1: { solved: true },
    2: { attempted: true, review: true },
  }, { topics: {} });

  assert.equal(recommendation.id, 'select');
});

test('certification banks provide complete original practice sets', () => {
  assert.deepEqual(Object.keys(CERT_QUIZZES).sort(), ['ocp', 'sqld', 'sqlp']);
  const expectedSubjectCounts = {
    sqld: { '데이터 모델링의 이해': 6, 'SQL 기본 및 활용': 24 },
    sqlp: { '데이터 모델링의 이해': 5, 'SQL 기본 및 활용': 8, 'SQL 고급활용 및 튜닝': 17 },
    ocp: { '설치·패치·업그레이드': 7, '백업·복구와 RMAN': 8, '멀티테넌트': 9, '가용성·진단·보안': 6 },
  };

  for (const cert of CERT_LIST) {
    const quiz = CERT_QUIZZES[cert.id];
    assert.equal(quiz.length, 30, `${cert.id} should provide a 30-question practice set`);
    assert.equal(new Set(quiz.map((question) => question.id)).size, quiz.length, `${cert.id} question ids must be unique`);

    const subjectNames = new Set(cert.subjects.map((subject) => subject.name));
    for (const question of quiz) {
      assert.equal(question.options.length, 4, `${cert.id} question ${question.id} should have four options`);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
      assert.ok(question.question.length >= 10);
      assert.ok(question.explanation.length >= 20);
      assert.ok(subjectNames.has(question.subject), `${question.subject} must be declared in ${cert.id} metadata`);
    }

    const actualSubjectCounts = Object.fromEntries([...subjectNames].map((subject) => [
      subject,
      quiz.filter((question) => question.subject === subject).length,
    ]));
    assert.deepEqual(actualSubjectCounts, expectedSubjectCounts[cert.id]);
  }
});

test('certification metadata matches current official SQLD and SQLP formats', () => {
  const sqld = CERT_LIST.find((cert) => cert.id === 'sqld');
  const sqlp = CERT_LIST.find((cert) => cert.id === 'sqlp');
  const ocp = CERT_LIST.find((cert) => cert.id === 'ocp');

  assert.equal(sqld.totalQ, 50);
  assert.equal(sqld.frequency, '연 4회 정기 시행');
  assert.equal(sqlp.totalQ, 72);
  assert.deepEqual(sqlp.subjects.map((subject) => subject.name), [
    '데이터 모델링의 이해',
    'SQL 기본 및 활용',
    'SQL 고급활용 및 튜닝',
  ]);
  assert.equal(ocp.practicePassScore, 65);
  assert.equal(ocp.practiceSubjectPassScore, null);
});

test('certification grading applies SQLD subject cutoffs', () => {
  const quiz = [
    ...Array.from({ length: 5 }, (_, index) => ({ id: index + 1, subject: 'A', answer: 0 })),
    ...Array.from({ length: 5 }, (_, index) => ({ id: index + 6, subject: 'B', answer: 0 })),
  ];
  const answers = Object.fromEntries([
    ...Array.from({ length: 5 }, (_, index) => [index + 1, 0]),
    [6, 0],
    [7, 1],
    [8, 1],
    [9, 1],
    [10, 1],
  ]);
  const result = gradeCertificationExam(quiz, answers, { passScore: 60, subjectPassScore: 40 });

  assert.equal(result.score, 60);
  assert.equal(result.passed, false);
  assert.deepEqual(result.subjectResults.map(({ subject, score, passed }) => ({ subject, score, passed })), [
    { subject: 'A', score: 100, passed: true },
    { subject: 'B', score: 20, passed: false },
  ]);
});

test('OCP practice grading diagnoses subjects without creating an unofficial cutoff', () => {
  const quiz = [
    { id: 1, subject: 'RMAN', answer: 0 },
    { id: 2, subject: '멀티테넌트', answer: 1 },
    { id: 3, subject: '멀티테넌트', answer: 2 },
  ];
  const result = gradeCertificationExam(quiz, { 1: 0, 2: 1, 3: 2 }, { passScore: 65, subjectPassScore: null });

  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
  assert.ok(result.subjectResults.every((subject) => subject.passed === null));
});
