import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
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
  for (const value of [null, 'https://example.com', '//example.com', '/\\example.com', '//[']) {
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
