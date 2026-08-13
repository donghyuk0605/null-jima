import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="page not-found-page">
      <span className="not-found-code">404</span>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.desc')}</p>
      <Link className="btn btn-primary" to="/">{t('notFound.home')}</Link>
    </div>
  );
}
