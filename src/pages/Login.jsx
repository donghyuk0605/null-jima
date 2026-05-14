import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

const PREVIEW_LINES = [
  { indent: 0, keyword: 'SELECT', rest: ' e.name, d.name AS 부서,' },
  { indent: 7, keyword: '', rest: '       AVG(e.salary) AS 평균급여' },
  { indent: 0, keyword: 'FROM', rest: ' employees e' },
  { indent: 0, keyword: 'JOIN', rest: ' departments d' },
  { indent: 5, keyword: '', rest: '  ON e.department_id = d.id' },
  { indent: 0, keyword: 'GROUP BY', rest: ' d.name' },
  { indent: 0, keyword: 'HAVING', rest: ' COUNT(*) >= 2' },
  { indent: 0, keyword: 'ORDER BY', rest: ' 평균급여 DESC;' },
];

export default function Login() {
  const { login, enterGuestMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-code-preview" aria-hidden="true">
          <div className="login-code-bar">
            <span className="login-code-dot" style={{ background: '#ff5f57' }} />
            <span className="login-code-dot" style={{ background: '#febc2e' }} />
            <span className="login-code-dot" style={{ background: '#28c840' }} />
            <span className="login-code-filename">query.sql</span>
          </div>
          <div className="login-code-body">
            {PREVIEW_LINES.map((line, i) => (
              <div key={i} className="login-code-line">
                <span className="login-code-lnum">{i + 1}</span>
                <span style={{ paddingLeft: line.indent * 6 }}>
                  {line.keyword && <span className="login-code-kw">{line.keyword}</span>}
                  <span className="login-code-rest">{line.rest}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="login-left-caption">브라우저 안에서 바로 실행되는 SQL 연습장</p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-logo">
            <Icon name="null" className="login-logo-icon" />
            <div>
              <span className="login-logo-title">NULL지마</span>
              <span className="login-logo-sub">SQL 연습장</span>
            </div>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">📊</span>
              <span>18개 실무 SQL 문제</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📚</span>
              <span>단계별 학습 도우미</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">🏆</span>
              <span>SQLD / SQLP 자격증 대비</span>
            </div>
          </div>

          <div className="login-divider">로그인</div>

          <button
            className="login-google-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? '로그인 중...' : 'Google로 시작하기'}
          </button>

          {error && <p className="login-error">{error}</p>}

          <p className="login-google-note">
            진행률, 즐겨찾기가 클라우드에 자동 저장됩니다
          </p>

          <div className="login-or">
            <span />
            <span>또는</span>
            <span />
          </div>

          <button className="login-guest-btn" onClick={enterGuestMode}>
            게스트로 시작하기
          </button>
          <p className="login-guest-note">
            로그인 없이 바로 연습할 수 있어요<br />
            진행률은 이 기기에만 저장됩니다
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
