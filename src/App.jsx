import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initDB } from './lib/database';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { setProgressSyncUser, syncProgressFromFirestore } from './lib/progress';
import { syncSettingsFromFirestore, useUserSettings } from './lib/userSettings';
import Layout from './components/Layout';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Editor = lazy(() => import('./pages/Editor'));
const Playground = lazy(() => import('./pages/Playground'));
const Learn = lazy(() => import('./pages/Learn'));
const LearnTopic = lazy(() => import('./pages/LearnTopic'));
const Problems = lazy(() => import('./pages/Problems'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const Tables = lazy(() => import('./pages/Tables'));
const Progress = lazy(() => import('./pages/Progress'));
const Cert = lazy(() => import('./pages/Cert'));
const CertDetail = lazy(() => import('./pages/CertDetail'));
const CertExam = lazy(() => import('./pages/CertExam'));
const Community = lazy(() => import('./pages/Community'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const THEME_KEY = 'sqldojo_theme';

function AppInner() {
  const { user, isGuest } = useAuth();
  const { setLanguage, t } = useLanguage();
  const settings = useUserSettings();
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-compact', settings.compactMode);
  }, [settings.compactMode]);

  useEffect(() => {
    document.title = `${t('app.name')} — ${t('app.subtitle')}`;
  }, [t]);

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch((e) => setInitError(e.message));
  }, []);

  useEffect(() => {
    if (!user) {
      setProgressSyncUser(null);
      return;
    }
    syncProgressFromFirestore(user.uid)
      .then(() => setProgressSyncUser(user.uid))
      .catch(() => setProgressSyncUser(user.uid));
    syncSettingsFromFirestore(user.uid)
      .then((settings) => setLanguage(settings.language))
      .catch(() => {});
    return () => setProgressSyncUser(null);
  }, [setLanguage, user]);

  // Auth state still loading
  if (user === undefined) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in and not guest → show login screen
  if (user === null && !isGuest) {
    return <Login />;
  }

  if (initError) {
    return (
      <div className="loading">
        <span style={{ color: 'var(--err)', fontFamily: 'monospace', padding: 24 }}>
          {t('loading.initFailed', { message: initError })}
        </span>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>{t('loading.sqlEngine')}</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout theme={theme} onToggleTheme={toggleTheme}>
        <Suspense fallback={<div className="route-loading"><div className="spinner" /><span>{t('loading.page')}</span></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:topicId" element={<LearnTopic />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/community" element={<Community />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cert" element={<Cert />} />
          <Route path="/cert/:certId" element={<CertDetail />} />
          <Route path="/cert/:certId/exam" element={<CertExam />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </LanguageProvider>
    </AuthProvider>
  );
}
