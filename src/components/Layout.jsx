import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useProgress } from '../lib/progress';
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

const MOBILE_NAV = [
  { to: '/', labelKey: 'nav.home', icon: 'home' },
  { to: '/problems', labelKey: 'nav.problems', icon: 'pencil' },
  { to: '/editor', labelKey: 'nav.editor', icon: 'keyboard', featured: true },
  { to: '/community', labelKey: 'nav.community', icon: 'community' },
  { to: '/progress', labelKey: 'nav.progress', icon: 'chart' },
];

export default function Layout({ children, theme, onToggleTheme }) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prog = useProgress();
  const solved = PROBLEMS.filter((problem) => prog[problem.id]?.solved).length;
  const total = PROBLEMS.length;
  const { user, isGuest, login, logout } = useAuth();

  return (
    <div className="layout">
      <div className="mobile-topbar">
        <NavLink to="/" className="mobile-topbar-brand" aria-label={t('app.name')}>
          <Icon name="null" className="mobile-topbar-icon" />
          <span>{t('app.name')}</span>
        </NavLink>
        <div className="mobile-topbar-actions">
          <LanguageSwitcher className="compact" />
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 15, height: 15 }} />
          </button>
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-app-menu"
            aria-label={mobileMenuOpen ? t('nav.menu.close') : t('nav.menu')}
            title={mobileMenuOpen ? t('nav.menu.close') : t('nav.menu')}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      <nav className="nav desktop-nav" aria-label={t('nav.menu')}>
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
                onClick={() => { login().catch(() => {}); }}
              >
                <GoogleIcon />
                {t('nav.login')}
              </button>
            </div>
          ) : null}
        </div>

        <div className="nav-social">
          <a href="https://www.instagram.com/donghyuk65" target="_blank" rel="noopener noreferrer">
            <Icon name="instagram" />
            Instagram
          </a>
          <a href="https://velog.io/@donghyuk65" target="_blank" rel="noopener noreferrer">
            <Icon name="article" />
            Velog
          </a>
        </div>
      </nav>

      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-label={t('nav.menu.close')}
        />
      )}

      <aside
        id="mobile-app-menu"
        className={`mobile-menu-sheet${mobileMenuOpen ? ' open' : ''}`}
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
      >
        <div className="mobile-menu-head">
          <div>
            <strong>{t('nav.menu')}</strong>
            <span>{t('nav.progress.label', { solved, total })}</span>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label={t('nav.menu.close')}>
            <Icon name="close" />
          </button>
        </div>
        <div className="mobile-menu-scroll">
          {NAV.map((section) => (
            <section key={section.groupKey} className="mobile-menu-section">
              <h2>{t(section.groupKey)}</h2>
              <div className="mobile-menu-grid">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon name={item.icon} />
                    <span>{t(item.labelKey)}</span>
                    <Icon name="chevron-right" className="mobile-menu-chevron" />
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <main className="page-content">{children}</main>

      <nav className="mobile-bottom-nav" aria-label={t('nav.menu')}>
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `mobile-bottom-item${item.featured ? ' featured' : ''}${isActive ? ' active' : ''}`}
          >
            <span className="mobile-bottom-icon"><Icon name={item.icon} /></span>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
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
