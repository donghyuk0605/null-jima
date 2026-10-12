import { PROBLEMS } from '../data/problems.js';
import { LEARN_TOPICS } from '../data/learn.js';
import { CERT_LIST } from '../data/cert.js';
import { localizeLearnTopic, localizeProblems } from './localizedContent.js';
import { translations } from './translations.js';

export const SITE_URL = 'https://null-jima.web.app';
export const SITE_NAME = 'nullジマ';
export const SEO_LANGUAGES = ['ko', 'ja'];
export const SHARE_IMAGE = `${SITE_URL}/og-image.png`;

const COPY = {
  ko: {
    homeTitle: '무료 SQL 연습 · 온라인 SQL 에디터 · SQLD 모의고사',
    homeDescription: 'nullジマ(널지마)에서 설치 없이 SQL을 배우고 실행하세요. SELECT, JOIN, GROUP BY부터 서브쿼리까지 문법 예제, 단계별 문제 풀이, SQLD·SQLP·OCP 연습 문제를 제공합니다.',
    learn: ['SQL 문법 학습', 'SELECT, WHERE, JOIN, GROUP BY, 서브쿼리와 윈도우 함수를 실제 SQL 예제로 배우세요. 문법별 설명과 연습 문제를 함께 확인할 수 있습니다.'],
    problems: ['SQL 연습 문제', `입문부터 고급까지 ${PROBLEMS.length}개의 SQL 연습 문제를 풀어보세요. SELECT, JOIN, 집계 함수와 서브쿼리를 직접 작성하고 단계별 힌트와 결과 채점으로 확인합니다.`],
    editor: ['온라인 SQL 에디터', '브라우저에서 SQL을 작성하고 실행하는 SQL 스튜디오입니다. SQLite 샘플 데이터, 초급 도우미·중급 에디터·고급 터미널, 쿼리 포맷과 결과 조회를 제공합니다.'],
    playground: ['SQL 예제 실습', 'SELECT, JOIN, 집계와 서브쿼리 예제를 골라 직접 실행해보세요. 설치 없이 SQLite 샘플 데이터로 SQL 결과를 확인할 수 있습니다.'],
    tables: ['SQL 샘플 테이블 · ERD', 'SQL 연습용 직원, 부서, 상품, 주문 테이블의 컬럼과 관계를 살펴보세요. 테이블 스키마와 ERD를 확인하고 JOIN 연습에 활용할 수 있습니다.'],
    cert: ['SQLD · SQLP · OCP 자격증 학습', 'SQLD, SQLP, Oracle OCP 시험 범위를 학습하고 직접 제작한 비공식 연습 문제와 모의고사를 풀어보세요. 공식 시험 안내 링크도 제공합니다.'],
    community: ['SQL 학습 커뮤니티', 'SQL 질문, 문제 풀이와 학습 팁을 나누는 nullジマ 커뮤니티입니다. SELECT, JOIN과 자격증 학습에 관한 이야기를 확인하세요.'],
    progress: ['내 학습 진행률', 'SQL 문제 풀이와 문법 학습의 개인 진행률을 확인하세요.'],
    settings: ['사용자 설정', '언어와 SQL 학습 환경, 에디터 설정을 관리하세요.'],
    login: ['로그인', 'nullジマ에 로그인해 학습 진행률과 설정을 계정에 저장하세요.'],
    notFound: ['페이지를 찾을 수 없습니다', '주소를 확인하거나 SQL 학습 페이지로 이동하세요.'],
    lesson: 'SQL 문법과 예제',
    problem: 'SQL 연습 문제',
    certDetail: '학습 안내와 연습 문제',
    exam: '모의고사',
    examDescription: '자격증 연습 모의고사를 시작하고 결과를 확인하세요.',
    sqld: '데이터 모델링과 SQL 기본·활용을 공부하는 SQLD 학습 안내입니다. 문법 예제와 비공식 실전형 연습 문제로 시험 범위를 복습하세요.',
    sqlp: '데이터 모델링, SQL 심화와 튜닝을 공부하는 SQLP 학습 안내입니다. 비공식 연습 문제로 실행 계획, 인덱스와 최적화 개념을 복습하세요.',
    ocp: 'Oracle Database 관리 역량을 위한 OCP 학습 안내입니다. RMAN, 멀티테넌트와 고급 관리 범위의 비공식 연습 문제를 확인하세요.',
  },
  ja: {
    homeTitle: 'SQL学習・オンラインSQLエディター・資格対策',
    homeDescription: 'nullジマでSQLを学び、そのまま実行できます。SELECT、JOIN、GROUP BYからサブクエリまで、文法の例、段階別の練習問題、SQLD・SQLP・OCPの非公式模擬問題を用意しています。',
    learn: ['SQL文法の学習', 'SELECT、WHERE、JOIN、GROUP BY、サブクエリ、ウィンドウ関数を実際のSQL例で学びます。文法ごとの説明と練習問題を確認できます。'],
    problems: ['SQL練習問題', `入門から上級まで${PROBLEMS.length}問のSQL練習問題に挑戦できます。SELECT、JOIN、集計関数、サブクエリを自分で書き、段階別ヒントと結果の採点で確認しましょう。`],
    editor: ['オンラインSQLエディター', 'ブラウザーでSQLを書いて実行できるSQLスタジオです。SQLiteのサンプルデータ、初心者ガイド・標準エディター・ターミナル、整形と結果表示を利用できます。'],
    playground: ['SQLサンプル練習', 'SELECT、JOIN、集計、サブクエリの例を選んで実行できます。インストールなしでSQLiteのサンプルデータを使い、SQLの結果を確認しましょう。'],
    tables: ['SQLサンプルテーブル・ERD', '社員、部署、商品、注文の練習用テーブルのカラムと関係を確認できます。スキーマとERDを見ながらJOINを練習しましょう。'],
    cert: ['SQLD・SQLP・OCPの資格対策', 'SQLD、SQLP、Oracle OCPの範囲を学び、独自に作成した非公式練習問題と模擬試験に挑戦できます。公式の試験案内へのリンクも掲載しています。'],
    community: ['SQL学習コミュニティ', 'SQLの質問、解答、学習のヒントを共有するnullジマのコミュニティです。SELECT、JOIN、資格対策についての話題を確認できます。'],
    progress: ['学習の進捗', 'SQL練習問題と文法学習の個人の進捗を確認できます。'],
    settings: ['ユーザー設定', '言語、SQL学習環境、エディターの設定を管理します。'],
    login: ['ログイン', 'nullジマにログインして、学習の進捗と設定をアカウントに保存できます。'],
    notFound: ['ページが見つかりません', 'URLを確認するか、SQL学習ページに移動してください。'],
    lesson: 'SQL文法と実例',
    problem: 'SQL練習問題',
    certDetail: '学習ガイドと練習問題',
    exam: '模擬試験',
    examDescription: '資格対策の模擬試験を開始し、結果を確認できます。',
    sqld: 'データモデリングとSQLの基本・活用を学ぶSQLDのガイドです。SQLの例と非公式練習問題を使って試験範囲を復習できます。',
    sqlp: 'データモデリング、高度なSQLとチューニングを学ぶSQLPのガイドです。非公式練習問題で実行計画、インデックス、最適化を復習できます。',
    ocp: 'Oracle Databaseの管理スキルを学ぶOCPのガイドです。RMAN、マルチテナント、高度な管理に関する非公式練習問題を確認できます。',
  },
};

function pathnameOnly(value) {
  const pathname = new URL(value.startsWith('/') ? `${SITE_URL}${value}` : value, SITE_URL).pathname;
  return pathname === '/' ? pathname : pathname.replace(/\/+$/, '') || '/';
}

export function getPathLanguage(pathname) {
  const path = pathnameOnly(pathname);
  return path === '/ja' || path.startsWith('/ja/') ? 'ja' : 'ko';
}

export function getBasePath(pathname) {
  const path = pathnameOnly(pathname);
  return getPathLanguage(path) === 'ja' ? path.slice(3) || '/' : path;
}

export function getLocalizedPath(pathname, language) {
  const path = getBasePath(pathname);
  return language === 'ja' ? `/ja${path === '/' ? '' : path}` : path;
}

export function getLoginReturnPath(value) {
  if (!value?.startsWith('/')) return '/';
  try {
    const url = new URL(value, SITE_URL);
    if (url.origin !== SITE_URL) return '/';
    return `${getBasePath(url.pathname)}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export function getStaticPaths() {
  return [
    '/', '/learn', '/problems', '/editor', '/playground', '/tables', '/cert', '/community',
    ...LEARN_TOPICS.map((topic) => `/learn/${topic.id}`),
    ...PROBLEMS.map((problem) => `/problems/${problem.id}`),
    ...CERT_LIST.map((cert) => `/cert/${cert.id}`),
    '/progress', '/settings', '/login',
    ...CERT_LIST.map((cert) => `/cert/${cert.id}/exam`),
  ];
}

export function seoTranslate(language, key) {
  return translations[language]?.[key] ?? translations.ko[key] ?? key;
}

export function getPageSeo(pathname, language = getPathLanguage(pathname)) {
  const lang = language === 'ja' ? 'ja' : 'ko';
  const copy = COPY[lang];
  const path = getBasePath(pathname);
  const topic = LEARN_TOPICS.find((item) => path === `/learn/${item.id}`);
  const problem = PROBLEMS.find((item) => path === `/problems/${item.id}`);
  const cert = CERT_LIST.find((item) => path === `/cert/${item.id}`);
  const examCert = CERT_LIST.find((item) => path === `/cert/${item.id}/exam`);
  const key = path === '/' ? 'home' : path.slice(1);
  let heading;
  let description;
  let title;
  let kind = key;
  let content = null;
  let parent = null;
  let indexable = true;

  if (path === '/') {
    heading = SITE_NAME;
    title = `${SITE_NAME} | ${copy.homeTitle}`;
    description = copy.homeDescription;
  } else if (topic) {
    kind = 'lesson';
    content = localizeLearnTopic(topic, lang);
    heading = content.title;
    title = `${heading} ${copy.lesson} | ${SITE_NAME}`;
    description = `${content.description} ${content.subtitle}`;
    parent = { path: '/learn', name: copy.learn[0] };
  } else if (problem) {
    kind = 'problem';
    content = localizeProblems([problem], lang)[0];
    heading = content.title;
    title = `${heading} - ${copy.problem} ${problem.id} | ${SITE_NAME}`;
    description = content.description;
    parent = { path: '/problems', name: copy.problems[0] };
  } else if (cert || examCert) {
    content = cert || examCert;
    kind = cert ? 'certDetail' : 'exam';
    heading = `${content.name} ${copy[kind]}`;
    title = `${heading} | ${SITE_NAME}`;
    description = cert ? copy[cert.id] : copy.examDescription;
    parent = { path: '/cert', name: copy.cert[0] };
    indexable = Boolean(cert);
  } else if (getStaticPaths().includes(path) && copy[key] && Array.isArray(copy[key])) {
    [heading, description] = copy[key];
    title = `${heading} | ${SITE_NAME}`;
    indexable = !['progress', 'settings', 'login'].includes(key);
  } else {
    kind = 'notFound';
    [heading, description] = copy.notFound;
    title = `${heading} | ${SITE_NAME}`;
    indexable = false;
  }

  const url = kind === 'notFound' ? null : `${SITE_URL}${getLocalizedPath(path, lang)}`;
  const alternatives = indexable
    ? [...SEO_LANGUAGES.map((language) => ({ language, url: `${SITE_URL}${getLocalizedPath(path, language)}` })),
      { language: 'x-default', url: `${SITE_URL}${path}` }]
    : [];
  const breadcrumbs = [{ name: SITE_NAME, url: `${SITE_URL}${getLocalizedPath('/', lang)}` }];
  if (parent) breadcrumbs.push({ name: parent.name, url: `${SITE_URL}${getLocalizedPath(parent.path, lang)}` });
  if (path !== '/' && url) breadcrumbs.push({ name: heading, url });

  const graph = [];
  if (indexable) {
    graph.push({
      '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME,
      alternateName: ['NULL지마', '널지마', 'null jima'], url: `${SITE_URL}/`, inLanguage: SEO_LANGUAGES,
    });
    graph.push({
      '@type': ['lesson', 'problem'].includes(kind) ? ['WebPage', 'LearningResource'] : 'WebPage',
      '@id': `${url}#webpage`, url, name: title, description, inLanguage: lang,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      ...(kind === 'lesson' ? { learningResourceType: 'Tutorial', teaches: content.title, isAccessibleForFree: true } : {}),
      ...(kind === 'problem' ? { learningResourceType: 'Exercise', teaches: content.tags.join(', '), isAccessibleForFree: true } : {}),
    });
    if (breadcrumbs.length > 1) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.name, item: item.url,
        })),
      });
    }
  }

  return {
    path, language: lang, kind, heading, title, content, breadcrumbs, alternatives, canonical: url, indexable,
    description: description.replace(/\s+/g, ' ').trim().slice(0, 160),
    locale: lang === 'ja' ? 'ja_JP' : 'ko_KR',
    robots: indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    structuredData: graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null,
  };
}

export function getIndexablePages() {
  return getStaticPaths().flatMap((path) => SEO_LANGUAGES.map((language) => getPageSeo(path, language)))
    .filter((page) => page.indexable);
}
