import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { getLocalizedPath, getPageSeo, getStaticPaths, SEO_LANGUAGES, SITE_URL } from '../src/lib/seo.js';

const origin = new URL(process.argv[2] || SITE_URL).origin;
const revision = process.argv[3];

function findAll(node, match) {
  return [...(match(node) ? [node] : []), ...(node.childNodes || []).flatMap((child) => findAll(child, match))];
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

const assets = new Set();
const pages = getStaticPaths().flatMap((path) => SEO_LANGUAGES.map((language) => getPageSeo(path, language)));
let checked = 0;

async function verifyPage(page) {
  const path = getLocalizedPath(page.path, page.language);
  const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') || '', /text\/html/, path);
  const document = parse(await response.text());
  const html = findAll(document, (node) => node.tagName === 'html')[0];
  assert.equal(attribute(html, 'lang'), page.language, path);
  const titles = findAll(document, (node) => node.tagName === 'title');
  assert.equal(titles.length, 1, path);
  assert.equal(titles[0].childNodes[0].value, page.title, path);
  const canonical = findAll(document, (node) => node.tagName === 'link' && attribute(node, 'rel') === 'canonical');
  assert.equal(canonical.length, 1, path);
  assert.equal(attribute(canonical[0], 'href'), page.canonical, path);
  const robots = findAll(document, (node) => node.tagName === 'meta' && attribute(node, 'name') === 'robots')[0];
  assert.equal(attribute(robots, 'content'), page.robots, path);
  assert.equal(findAll(document, (node) => node.tagName === 'h1').length, 1, path);
  for (const node of findAll(document, (node) => node.tagName === 'script' || node.tagName === 'link')) {
    const url = attribute(node, 'src') || attribute(node, 'href');
    if (url?.startsWith('/assets/')) assets.add(url);
  }
  checked += 1;
}

for (let offset = 0; offset < pages.length; offset += 10) {
  await Promise.all(pages.slice(offset, offset + 10).map(verifyPage));
}
console.log(`Verified ${checked} Korean/Japanese HTML routes and metadata.`);

for (const path of ['/unknown-page', '/learn/missing', '/problems/999']) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 404, path);
  assert.match(await response.text(), /noindex/, path);
}

for (const path of assets) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') || '', path.endsWith('.css') ? /text\/css/ : /javascript/, path);
}
for (const [path, contentType] of [['/sitemap.xml', /xml/], ['/robots.txt', /text\/plain/], ['/og-image.png', /image\/png/], ['/sql-wasm.wasm', /application\/wasm/]]) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') || '', contentType, path);
}
const release = await fetch(`${origin}/release.json`).then((response) => response.json());
if (revision) assert.equal(release.revision, revision);
console.log(`Verified 404 responses, ${assets.size} entry assets, sitemap, robots, share image, SQL engine and release ${release.revision}.`);
