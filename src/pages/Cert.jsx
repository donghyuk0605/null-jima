import { Link } from 'react-router-dom';
import { CERT_LIST } from '../data/cert';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeCerts, translateLevel } from '../lib/localizedContent';

export default function Cert() {
  const { language, t } = useLanguage();
  const certs = localizeCerts(CERT_LIST, language);
  return (
    <div className="page cert-page">
      <div className="page-header">
        <h2 className="page-title">{t('cert.title')}</h2>
        <span className="page-desc">{t('cert.desc')}</span>
      </div>

      <div className="cert-grid">
        {certs.map((cert) => (
          <Link key={cert.id} to={`/cert/${cert.id}`} className="cert-card">
            <div className="cert-card-top">
              <div className="cert-name-row">
                <Icon name="trophy" className="cert-trophy-icon" style={{ color: cert.color }} />
                <span className="cert-name" style={{ color: cert.color }}>{cert.name}</span>
                <span className={`badge level-${cert.level}`}>{translateLevel(cert.level, t)}</span>
              </div>
              <div className="cert-fullname">{cert.fullName}</div>
              <div className="cert-org">{cert.org}</div>
            </div>

            <p className="cert-desc">{cert.desc}</p>

            <div className="cert-stats">
              <div className="cert-stat">
                <span className="cert-stat-label">{t('cert.subjects.label')}</span>
                <span className="cert-stat-value">{t('cert.exam.questions', { n: cert.subjects.length })}</span>
              </div>
              <div className="cert-stat">
                <span className="cert-stat-label">{t('cert.pass.label')}</span>
                <span className="cert-stat-value">{cert.passCriteria.split(',')[0]}</span>
              </div>
              <div className="cert-stat">
                <span className="cert-stat-label">{t('cert.time.label')}</span>
                <span className="cert-stat-value">{t('cert.exam.minutes', { n: cert.examTime })}</span>
              </div>
              <div className="cert-stat">
                <span className="cert-stat-label">{t('cert.freq.label')}</span>
                <span className="cert-stat-value">{cert.frequency}</span>
              </div>
            </div>

            <div className="cert-card-footer">
              <span className="cert-detail-link" style={{ color: cert.color }}>{t('cert.detail.link')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
