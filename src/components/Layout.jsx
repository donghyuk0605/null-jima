import { NavLink } from 'react-router-dom';
import { getAllProgress } from '../lib/progress';
import { PROBLEMS } from '../data/problems';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from './Icon';
import LanguageSwitcher from './LanguageSwitcher';

const NAV = [
  {
    groupKey: 'nav.group.study',
    items: [
      { to: '/', labelKey: 'nav.home', icon: 'home' },
      { to: '/learn', labelKey: 'nav.learn', icon: 'book' },
      { to: '/cert', labelKey: 'nav.cert', icon: 'trophy' },
    ],
  },
  {
    groupKey: 'nav.group.practice',
    items: [
      { to: '/editor', labelKey: 'nav.editor', icon: 'keyboard' },
      { to: '/playground', labelKey: 'nav.playground', icon: 'keyboard' },
      { to: '/problems', labelKey: 'nav.problems', icon: 'pencil' },
    ],
  },
  {
    groupKey: 'nav.group.data',
    items: [
      { to: '/tables', labelKey: 'nav.tables', icon: 'database' },
    ],
  },
  {
    groupKey: 'nav.group.me',
    items: [
      { to: '/community', labelKey: 'nav.community', icon: 'community' },
      { to: '/progress', labelKey: 'nav.progress', icon: 'chart' },
      { to: '/settings', labelKey: 'nav.settings', icon: 'settings' },
    ],
  },
];

export default function Layout({ children, theme, onToggleTheme }) {
  const { t } = useLanguage();
  const prog = getAllProgress();
  const solved = Object.values(prog).filter((p) => p.solved).length;
  const total = PROBLEMS.length;
  const { user, isGuest, login, logout, exitGuestMode } = useAuth();

  return (
    <div className="layout">
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <Icon name="null" className="mobile-topbar-icon" />
          <span>{t('app.name')}</span>
        </div>
        <div className="mobile-topbar-actions">
          <LanguageSwitcher className="compact" />
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-top">
          <div className="nav-logo">
            <Icon name="null" className="nav-logo-icon" />
            <div>
              <span>{t('app.name')}</span>
              <span className="nav-logo-sub">{t('app.subtitle')}</span>
            </div>
          </div>
          <div className="nav-top-actions">
            <LanguageSwitcher className="compact" />
            <button
              className="theme-toggle"
              onClick={onToggleTheme}
              title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        <div className="nav-progress-bar" title={t('nav.progress.title', { solved, total })}>
          <div className="nav-progress-fill" style={{ width: `${(solved / total) * 100}%` }} />
        </div>
        <div className="nav-progress-label">{t('nav.progress.label', { solved, total })}</div>

        {NAV.map((section) => (
          <div key={section.groupKey} className="nav-section">
            <div className="nav-group-label">{t(section.groupKey)}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon name={item.icon} className="nav-icon" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="nav-auth">
          {user ? (
            <div className="nav-user">
              {user.photoURL && (
                <img src={user.photoURL} alt={t('nav.profileAlt')} className="nav-avatar" referrerPolicy="no-referrer" />
              )}
              <div className="nav-user-info">
                <span className="nav-user-name">{user.displayName || user.email}</span>
                <button className="nav-logout-btn" onClick={logout}>{t('nav.logout')}</button>
              </div>
            </div>
          ) : isGuest ? (
            <div className="nav-guest">
              <span className="nav-guest-label">{t('nav.guest')}</span>
              <button
                className="nav-login-btn"
                onClick={() => { exitGuestMode(); login().catch(() => {}); }}
              >
                <GoogleIcon />
                {t('nav.login')}
              </button>
            </div>
          ) : null}
        </div>

        <div className="nav-social" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color, #eaeaea)', marginTop: '10px' }}>
          <a href="https://www.instagram.com/donghyuk65" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2, #666)', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Instagram
          </a>
          <a href="https://velog.io/@donghyuk65" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2, #666)', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></svg>
            Velog
          </a>
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
