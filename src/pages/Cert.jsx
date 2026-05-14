import { Link } from 'react-router-dom';
import { CERT_LIST } from '../data/cert';
import Icon from '../components/Icon';

export default function Cert() {
  return (
    <div className="page cert-page">
      <div className="page-header">
        <h2 className="page-title">자격증 안내</h2>
        <span className="page-desc">SQL 관련 국가공인 자격증 정보를 확인하고 학습 계획을 세워보세요</span>
      </div>

      <div className="cert-grid">
        {CERT_LIST.map((cert) => (
          <Link key={cert.id} to={`/cert/${cert.id}`} className="cert-card">
            <div className="cert-card-top">
              <div className="cert-name-row">
                <Icon name="trophy" className="cert-trophy-icon" style={{ color: cert.color }} />
                <span className="cert-name" style={{ color: cert.color }}>{cert.name}</span>
                <span className={`badge level-${cert.level}`}>{cert.level}</span>
              </div>
              <div className="cert-fullname">{cert.fullName}</div>
              <div className="cert-org">{cert.org}</div>
            </div>

            <p className="cert-desc">{cert.desc}</p>

            <div className="cert-stats">
              <div className="cert-stat">
                <span className="cert-stat-label">과목 수</span>
                <span className="cert-stat-value">{cert.subjects.length}과목</span>
              </div>
              <div className="cert-stat">
                <span className="cert-stat-label">합격 기준</span>
                <span className="cert-stat-value">{cert.passCriteria.split(',')[0]}</span>
              </div>
              <div className="cert-stat">
                <span className="cert-stat-label">시험 시간</span>
                <span className="cert-stat-value">{cert.examTime}분</span>
              </div>
              <div className="cert-stat">
                <span className="cert-stat-label">시험 횟수</span>
                <span className="cert-stat-value">{cert.frequency}</span>
              </div>
            </div>

            <div className="cert-card-footer">
              <span className="cert-detail-link" style={{ color: cert.color }}>자세히 보기 →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
