import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import initSqlJs from 'sql.js';
import { LEARN_TOPICS } from '../src/data/learn.js';
import { CERT_LIST, getCertQuiz } from '../src/data/cert.js';
import { localizeCert, localizeLearnTopic, localizeQuiz } from '../src/lib/localizedContent.js';
import {
  getBasePath, getIndexablePages, getLocalizedPath, getLoginReturnPath, getPageSeo,
  getPathLanguage, getStaticPaths, SITE_URL,
} from '../src/lib/seo.js';
import { renderSeoDocument, renderSitemap } from '../scripts/build-seo.mjs';

const template = '<!doctype html><html lang="ko"><head><title>Old title</title><meta name="description" content="old"><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></head><body><div id="root"></div></body></html>';

function findAll(node, match) {
  return [...(match(node) ? [node] : []), ...(node.childNodes || []).flatMap((child) => findAll(child, match))];
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

test('locale paths preserve routes and canonical URLs omit transient parameters', () => {
  assert.equal(getPathLanguage('/ja/learn/select'), 'ja');
  assert.equal(getPathLanguage('/january'), 'ko');
  assert.equal(getBasePath('/ja/learn/select/'), '/learn/select');
  assert.equal(getLocalizedPath('/ja/problems/13', 'ko'), '/problems/13');
  assert.equal(getLocalizedPath('/', 'ja'), '/ja');
  assert.equal(getPageSeo('/ja/problems/13?release=test#answer').canonical, `${SITE_URL}/ja/problems/13`);
});

test('login return paths stay on the same origin and retain the current exercise', () => {
  assert.equal(getLoginReturnPath('/problems/13?mode=helper#sql'), '/problems/13?mode=helper#sql');
  assert.equal(getLoginReturnPath('/ja/problems/13'), '/problems/13');
  for (const value of [null, 'https://example.com', '//example.com', '/\\example.com', '//[', '/a/..//example.com', '/ja//example.com', '/unknown']) {
    assert.equal(getLoginReturnPath(value), '/');
  }
});

test('every public page has reciprocal Korean and Japanese alternatives', () => {
  const pages = getIndexablePages();
  assert.equal(new Set(pages.map((page) => page.canonical)).size, pages.length);
  for (const page of pages) {
    assert.equal(page.alternatives.length, 3);
    assert.ok(page.alternatives.some((alternate) => alternate.url === page.canonical));
    assert.ok(page.title.includes('nullジマ'));
    assert.ok(page.description.length > 10 && page.description.length <= 160);
    assert.equal(page.structuredData['@graph'][1].inLanguage, page.language);
    assert.equal(page.structuredData['@graph'][1].url, page.canonical);
  }
  const ko = getPageSeo('/learn/join', 'ko');
  const ja = getPageSeo('/learn/join', 'ja');
  assert.notEqual(ko.title, ja.title);
  assert.notEqual(ko.description, ja.description);
  assert.equal(ja.canonical, `${SITE_URL}/ja/learn/join`);
});

test('personal pages, exams and invalid resource IDs are excluded from indexing', () => {
  for (const path of ['/progress', '/settings', '/login', '/cert/sqld/exam', '/learn/missing', '/problems/999', '/cert/missing', '/notFound', '//unknown']) {
    const page = getPageSeo(path);
    assert.equal(page.indexable, false, path);
    assert.match(page.robots, /noindex/);
    assert.deepEqual(page.alternatives, []);
    assert.equal(page.structuredData, null);
    assert.ok(!getIndexablePages().some((item) => item.path === path));
  }
  assert.ok(getStaticPaths().includes('/login'));
  assert.equal(getPageSeo('/problems/999').canonical, null);
});

test('generated lesson HTML exposes real examples, one title and matching metadata without JavaScript', () => {
  const page = getPageSeo('/ja/learn/join');
  const document = parse(renderSeoDocument(template, page));
  assert.equal(findAll(document, (node) => node.tagName === 'title').length, 1);
  assert.equal(findAll(document, (node) => node.tagName === 'h1').length, 1);
  assert.equal(attribute(findAll(document, (node) => node.tagName === 'html')[0], 'lang'), 'ja');
  const canonical = findAll(document, (node) => node.tagName === 'link' && attribute(node, 'rel') === 'canonical');
  assert.equal(canonical.length, 1);
  assert.equal(attribute(canonical[0], 'href'), page.canonical);
  assert.equal(findAll(document, (node) => node.tagName === 'meta' && attribute(node, 'name') === 'description').length, 1);
  const code = findAll(document, (node) => node.tagName === 'code');
  assert.ok(code.length >= page.content.examples.length);
  const links = findAll(document, (node) => node.tagName === 'a');
  assert.ok(links.some((node) => attribute(node, 'href') === '/ja/problems/13'));
  assert.ok(findAll(document, (node) => node.tagName === 'script' && attribute(node, 'src') === '/assets/app.js').length);
});

test('generated exercise HTML contains the prompt without revealing hints or the answer', () => {
  const page = getPageSeo('/problems/5');
  const html = renderSeoDocument(template, page);
  assert.ok(html.includes(page.content.title));
  assert.ok(html.includes(page.content.description));
  assert.ok(!html.includes(page.content.answer));
  assert.ok(!html.includes(page.content.hints[2]));
});

test('JSON-LD escapes script boundaries and sitemap contains only indexable canonical URLs', () => {
  const page = getPageSeo('/learn/select');
  page.structuredData['@graph'][1].name = '</script><script>alert(1)</script>';
  const document = parse(renderSeoDocument(template, page));
  const schema = findAll(document, (node) => attribute(node, 'id') === 'seo-schema')[0];
  assert.equal(JSON.parse(schema.childNodes[0].value)['@graph'][1].name, '</script><script>alert(1)</script>');
  assert.equal(findAll(document, (node) => node.tagName === 'script').length, 2);
  const pages = getIndexablePages();
  const sitemap = renderSitemap(pages);
  assert.equal((sitemap.match(/<loc>/g) || []).length, pages.length);
  assert.ok(sitemap.includes(`${SITE_URL}/ja/learn/select`));
  assert.ok(!sitemap.includes('/progress'));
  assert.ok(!sitemap.includes('/exam'));
});

test('Japanese public learning prose is translated rather than word substitutions', () => {
  for (const topic of LEARN_TOPICS) {
    const ja = localizeLearnTopic(topic, 'ja');
    assert.equal(ja.examples.length, topic.examples.length);
    const prose = [ja.title, ja.subtitle, ja.description, ja.syntax, ...ja.tips, ...ja.examples.flatMap((example) => [example.title, example.desc])];
    for (const text of prose) assert.doesNotMatch(text, /[가-힣]/, topic.id);
  }
});

test('Japanese certification guides and quiz subjects use consistent labels', () => {
  for (const cert of CERT_LIST) {
    const ja = localizeCert(cert, 'ja');
    const prose = [ja.desc, ja.org, ja.frequency, ja.passCriteria, ...ja.keyTopics, ...ja.studyPlan, ...ja.subjects.flatMap((subject) => [subject.name, ...subject.topics, subject.format || ''])];
    for (const text of prose) assert.doesNotMatch(text, /[가-힣]/, cert.id);
    assert.equal(ja.practicePassScore, cert.practicePassScore);
    const subjects = new Set(ja.subjects.map((subject) => subject.name));
    for (const question of localizeQuiz(getCertQuiz(cert.id), 'ja')) assert.ok(subjects.has(question.subject));
  }
});

test('Japanese SQL examples execute and preserve the original filtered rows', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  try {
    db.run(`
      CREATE TABLE departments (id INTEGER, name TEXT);
      CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER, department_id INTEGER, hire_date TEXT);
      CREATE TABLE products (id INTEGER, name TEXT, price INTEGER, stock INTEGER, category TEXT);
      CREATE TABLE orders (id INTEGER, employee_id INTEGER, product_id INTEGER, quantity INTEGER, order_date TEXT);
      INSERT INTO departments VALUES (1, '개발팀'), (2, '마케팅팀');
      INSERT INTO employees VALUES (1, '정도윤', 7000000, 1, '2020-01-01'), (2, '김철수', 5000000, 2, '2022-01-01'), (3, '이영희', 6000000, 1, '2021-01-01');
      INSERT INTO products VALUES (1, '노트북', 2000, 10, '전자제품'), (2, '의자', 1000, 5, '가구');
      INSERT INTO orders VALUES (1, 1, 1, 2, '2026-01-01'), (2, 2, 2, 1, '2026-01-02');
    `);
    for (const topic of LEARN_TOPICS) {
      const ja = localizeLearnTopic(topic, 'ja');
      for (let index = 0; index < topic.examples.length; index += 1) {
        const expected = db.exec(topic.examples[index].sql).map((result) => result.values.length);
        const actual = db.exec(ja.examples[index].sql).map((result) => result.values.length);
        assert.deepEqual(actual, expected, `${topic.id} example ${index + 1}`);
      }
    }
    const where = localizeLearnTopic(LEARN_TOPICS.find((topic) => topic.id === 'where'), 'ja');
    assert.equal(db.exec(where.examples[1].sql)[0].values[0][1], '정도윤');
  } finally {
    db.close();
  }
});
