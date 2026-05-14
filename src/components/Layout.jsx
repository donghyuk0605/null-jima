import { NavLink } from 'react-router-dom';
import { getAllProgress } from '../lib/progress';
import { PROBLEMS } from '../data/problems';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const NAV = [
  {
    group: '학습',
    items: [
      { to: '/', label: '홈', icon: 'home' },
      { to: '/learn', label: '학습 도우미', icon: 'book' },
      { to: '/cert', label: '자격증', icon: 'trophy' },
    ],
  },
  {
    group: '실습',
    items: [
      { to: '/editor', label: 'SQL 에디터', icon: 'keyboard' },
      { to: '/playground', label: '자유 연습', icon: 'keyboard' },
      { to: '/problems', label: '문제 풀기', icon: 'pencil' },
    ],
  },
  {
    group: '데이터',
    items: [
      { to: '/tables', label: '테이블 탐색', icon: 'database' },
    ],
  },
  {
    group: '내 정보',
    items: [
      { to: '/community', label: '커뮤니티', icon: 'community' },
      { to: '/progress', label: '내 진행률', icon: 'chart' },
      { to: '/settings', label: '사용자 설정', icon: 'settings' },
    ],
  },
];

export default function Layout({ children, theme, onToggleTheme }) {
  const prog = getAllProgress();
  const solved = Object.values(prog).filter((p) => p.solved).length;
  const total = PROBLEMS.length;
  const { user, isGuest, login, logout, exitGuestMode } = useAuth();

  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-top">
          <div className="nav-logo">
            <Icon name="null" className="nav-logo-icon" />
            <div>
              <span>NULL지마</span>
              <span className="nav-logo-sub">SQL 연습장</span>
            </div>
          </div>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div className="nav-progress-bar" title={`${solved} / ${total} 완료`}>
          <div className="nav-progress-fill" style={{ width: `${(solved / total) * 100}%` }} />
        </div>
        <div className="nav-progress-label">{solved} / {total} 문제 완료</div>

        {NAV.map((section) => (
          <div key={section.group} className="nav-section">
            <div className="nav-group-label">{section.group}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon name={item.icon} className="nav-icon" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="nav-auth">
          {user ? (
            <div className="nav-user">
              {user.photoURL && (
                <img src={user.photoURL} alt="프로필" className="nav-avatar" referrerPolicy="no-referrer" />
              )}
              <div className="nav-user-info">
                <span className="nav-user-name">{user.displayName || user.email}</span>
                <button className="nav-logout-btn" onClick={logout}>로그아웃</button>
              </div>
            </div>
          ) : isGuest ? (
            <div className="nav-guest">
              <span className="nav-guest-label">게스트 모드</span>
              <button
                className="nav-login-btn"
                onClick={() => { exitGuestMode(); login().catch(() => {}); }}
              >
                <GoogleIcon />
                로그인하기
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <main className="page-content">{children}</main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
