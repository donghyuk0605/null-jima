import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createElement as h, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse, parseFragment, serialize } from 'parse5';
import { PROBLEMS } from '../src/data/problems.js';
import { LEARN_TOPICS } from '../src/data/learn.js';
import { CERT_LIST } from '../src/data/cert.js';
import { localizeLearnTopic, localizeProblems, translateLevel, translateTag } from '../src/lib/localizedContent.js';
import {
  getIndexablePages, getLocalizedPath, getPageSeo, getStaticPaths,
  SEO_LANGUAGES, seoTranslate, SHARE_IMAGE, SITE_NAME, SITE_URL,
} from '../src/lib/seo.js';

function metadataMarkup(page) {
  const meta = (name, content) => h('meta', { name, content });
  const property = (property, content) => h('meta', { property, content });
  return renderToStaticMarkup(h(Fragment, null,
    h('title', null, page.title),
    meta('description', page.description), meta('robots', page.robots),
    property('og:type', 'website'), property('og:site_name', SITE_NAME),
    property('og:title', page.title), property('og:description', page.description),
    page.canonical && property('og:url', page.canonical),
    property('og:locale', page.locale),
    property('og:locale:alternate', page.language === 'ja' ? 'ko_KR' : 'ja_JP'),
    property('og:image', SHARE_IMAGE), property('og:image:width', '1024'), property('og:image:height', '574'),
    property('og:image:alt', page.language === 'ja' ? 'nullジマのSQL学習画面' : 'nullジマ SQL 학습 화면'),
    meta('twitter:card', 'summary_large_image'), meta('twitter:title', page.title),
    meta('twitter:description', page.description), meta('twitter:image', SHARE_IMAGE),
    page.canonical && h('link', { rel: 'canonical', href: page.canonical }),
    ...page.alternatives.map((alternate) => h('link', { key: alternate.language, rel: 'alternate', hrefLang: alternate.language, href: alternate.url })),
    page.structuredData && h('script', {
      id: 'seo-schema', type: 'application/ld+json',
      dangerouslySetInnerHTML: { __html: JSON.stringify(page.structuredData).replaceAll('<', '\\u003c') },
    }),
  ));
}

function renderContent(page) {
  const t = (key) => seoTranslate(page.language, key);
  const link = (path, label) => h('a', { href: getLocalizedPath(path, page.language) }, label);
  const topics = LEARN_TOPICS.map((topic) => localizeLearnTopic(topic, page.language));
  const problems = localizeProblems(PROBLEMS, page.language);
  const heading = (key) => h('h2', null, t(key));
  const topicList = () => h('ul', null, ...topics.map((topic) => h('li', { key: topic.id },
    link(`/learn/${topic.id}`, topic.title), h('p', null, `${topic.subtitle}. ${topic.description}`))));
  const problemList = (items = problems) => h('ul', null, ...items.map((problem) => h('li', { key: problem.id },
    link(`/problems/${problem.id}`, problem.title),
    h('span', null, ` · ${translateLevel(problem.level, t)} · ${problem.tags.map((tag) => translateTag(tag, t)).join(', ')}`))));
  const certList = () => h('ul', null, ...CERT_LIST.map((cert) => h('li', { key: cert.id },
    link(`/cert/${cert.id}`, cert.name), h('p', null, getPageSeo(`/cert/${cert.id}`, page.language).description))));
  const content = [];

  if (page.kind === 'home') {
    content.push(heading('learn.title'), topicList(), heading('problems.title'), problemList(), heading('cert.title'), certList());
  } else if (page.kind === 'learn') {
    content.push(topicList());
  } else if (page.kind === 'problems') {
    content.push(problemList());
  } else if (page.kind === 'lesson') {
    const topic = page.content;
    content.push(heading('learn.syntax.title'), h('pre', null, h('code', null, topic.syntax)), heading('learn.examples.title'));
    for (const example of topic.examples) {
      content.push(h('section', { key: example.title },
        h('h3', null, example.title), h('p', null, example.desc), h('pre', null, h('code', null, example.sql))));
    }
    content.push(heading('learn.tips.title'), h('ul', null, ...topic.tips.map((tip) => h('li', { key: tip }, tip))));
    const related = problems.filter((problem) => topic.relatedProblems.includes(problem.id));
    if (related.length) content.push(heading('learn.practice.title'), problemList(related));
  } else if (page.kind === 'problem') {
    content.push(h('p', null, page.content.tables.join(', ')),
      h('p', null, page.content.tags.map((tag) => translateTag(tag, t)).join(', ')),
      link('/tables', t('tables.title')), h('hr'), link('/problems', t('problems.title')));
  } else if (page.kind === 'cert') {
    content.push(certList());
  } else if (page.kind === 'certDetail') {
    content.push(h('p', null, page.content.fullName),
      h('p', null, t('cert.practice.notice')),
      h('a', { href: page.content.officialUrl, rel: 'noopener noreferrer' }, page.language === 'ja' ? '公式の試験案内' : '공식 시험 안내'),
      h('hr'), link(`/cert/${page.content.id}/exam`, t('cert.exam.start')));
  } else if (['editor', 'playground', 'tables'].includes(page.kind)) {
    content.push(h('pre', null, h('code', null, 'SELECT e.name, d.name AS department\nFROM employees e\nJOIN departments d ON e.department_id = d.id;')),
      h('p', null, 'employees · departments · products · orders'),
      heading('learn.title'), topicList());
  }

  return renderToStaticMarkup(h('div', { className: 'seo-document' },
    h('header', { className: 'seo-header' }, link('/', SITE_NAME),
      h('nav', { 'aria-label': t('nav.menu') },
        link('/learn', t('nav.learn')), link('/problems', t('nav.problems')),
        link('/editor', t('nav.editor')), link('/cert', t('nav.cert')),
        h('a', { href: getLocalizedPath(page.path, page.language === 'ja' ? 'ko' : 'ja'), hrefLang: page.language === 'ja' ? 'ko' : 'ja' },
          page.language === 'ja' ? '한국어' : '日本語'))),
    h('main', null, h('h1', null, page.heading),
      h('p', { className: 'seo-description' }, page.kind === 'problem' ? page.content.description : page.description), ...content)));
}

function walk(node, match) {
  if (match(node)) return node;
  for (const child of node.childNodes || []) {
    const found = walk(child, match);
    if (found) return found;
  }
  return null;
}

function getAttribute(node, name) {
  return node.attrs?.find((attribute) => attribute.name === name)?.value;
}

function appendMarkup(parent, markup) {
  const nodes = parseFragment(markup).childNodes;
  for (const node of nodes) node.parentNode = parent;
  parent.childNodes.push(...nodes);
}

export function renderSeoDocument(template, page) {
  const document = parse(template);
  const html = walk(document, (node) => node.tagName === 'html');
  const head = walk(document, (node) => node.tagName === 'head');
  const root = walk(document, (node) => getAttribute(node, 'id') === 'root');
  if (!html || !head || !root) throw new Error('The build template must contain html, head, and #root.');
  html.attrs = html.attrs.filter((attribute) => attribute.name !== 'lang');
  html.attrs.push({ name: 'lang', value: page.language });
  head.childNodes = head.childNodes.filter((node) => {
    if (node.tagName === 'title' || getAttribute(node, 'id') === 'seo-schema') return false;
    if (node.tagName === 'meta') {
      const name = getAttribute(node, 'name') || '';
      const property = getAttribute(node, 'property') || '';
      return !['description', 'robots'].includes(name) && !name.startsWith('twitter:') && !property.startsWith('og:');
    }
    return node.tagName !== 'link' || !['canonical', 'alternate'].includes(getAttribute(node, 'rel'));
  });
  appendMarkup(head, metadataMarkup(page));
  appendMarkup(head, '<style>.seo-document{max-width:1080px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.7}.seo-header,.seo-header nav{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.seo-header{justify-content:space-between;border-bottom:1px solid #d8dee8;padding-bottom:16px}.seo-document h1{font-size:28px;margin-top:32px}.seo-document pre{padding:16px;overflow:auto;background:#f4f6f9;color:#16212e}.seo-document li{margin-block:12px}.seo-description{white-space:pre-line}</style>');
  root.childNodes = [];
  appendMarkup(root, renderContent(page));
  return serialize(document);
}

export function renderSitemap(pages) {
  const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const urls = pages.map((page) => `  <url>\n    <loc>${escape(page.canonical)}</loc>\n${page.alternatives.map((alternate) =>
    `    <xhtml:link rel="alternate" hreflang="${alternate.language}" href="${escape(alternate.url)}" />`).join('\n')}\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

async function buildSeo() {
  const template = await readFile('dist/index.html', 'utf8');
  let count = 0;
  for (const path of getStaticPaths()) {
    for (const language of SEO_LANGUAGES) {
      const page = getPageSeo(path, language);
      const localized = getLocalizedPath(path, language);
      const filename = localized === '/' ? 'dist/index.html' : `dist${localized}.html`;
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(filename, renderSeoDocument(template, page));
      count += 1;
    }
  }
  await writeFile('dist/404.html', renderSeoDocument(template, getPageSeo('/not-found')));
  const pages = getIndexablePages();
  await writeFile('dist/sitemap.xml', renderSitemap(pages));
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await copyFile('docs/images/null-jima-main.png', 'dist/og-image.png');
  let revision = process.env.GITHUB_SHA || null;
  if (!revision) {
    try {
      revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      // Source archives can be built without Git metadata.
    }
  }
  await writeFile('dist/release.json', JSON.stringify({ revision, builtAt: new Date().toISOString(), publicPages: pages.length, languages: SEO_LANGUAGES }, null, 2));
  console.log(`SEO: generated ${count} pages, ${pages.length} sitemap URLs, robots.txt and a share image.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildSeo();
}
