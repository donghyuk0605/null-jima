import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getPageSeo, SHARE_IMAGE, SITE_NAME } from '../lib/seo';

function updateMeta(attribute, key, value) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.append(tag);
  }
  tag.setAttribute('content', value);
}

export default function PageSeo() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const page = getPageSeo(pathname, language);
    document.title = page.title;
    document.documentElement.lang = page.language;
    updateMeta('name', 'description', page.description);
    updateMeta('name', 'robots', page.robots);
    updateMeta('property', 'og:type', 'website');
    updateMeta('property', 'og:site_name', SITE_NAME);
    updateMeta('property', 'og:title', page.title);
    updateMeta('property', 'og:description', page.description);
    updateMeta('property', 'og:url', page.canonical || '');
    updateMeta('property', 'og:locale', page.locale);
    updateMeta('property', 'og:locale:alternate', language === 'ja' ? 'ko_KR' : 'ja_JP');
    updateMeta('property', 'og:image', SHARE_IMAGE);
    updateMeta('property', 'og:image:width', '1024');
    updateMeta('property', 'og:image:height', '574');
    updateMeta('property', 'og:image:alt', language === 'ja' ? 'nullジマのSQL学習画面' : 'nullジマ SQL 학습 화면');
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', page.title);
    updateMeta('name', 'twitter:description', page.description);
    updateMeta('name', 'twitter:image', SHARE_IMAGE);

    document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
      .forEach((tag) => tag.remove());
    if (page.canonical) {
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = page.canonical;
      document.head.append(canonical);
    }
    for (const alternate of page.alternatives) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = alternate.language;
      link.href = alternate.url;
      document.head.append(link);
    }

    document.getElementById('seo-schema')?.remove();
    if (page.structuredData) {
      const script = document.createElement('script');
      script.id = 'seo-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(page.structuredData);
      document.head.append(script);
    }
  }, [pathname, language]);

  return null;
}
