import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { setProgressOwner, setProgressSyncUser, syncProgressFromFirestore } from './lib/progress';
import { setSettingsOwner, setSettingsSyncUser, syncSettingsFromFirestore, useUserSettings } from './lib/userSettings';
import { setActivityOwner } from './lib/streak';
import { setLearningOwner, setLearningSyncUser, syncLearningFromFirestore } from './lib/learningProgress';
import Layout from './components/Layout';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import PageSeo from './components/PageSeo';
import { getPathLanguage } from './lib/seo';
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
let databaseModulePromise = null;

const loadDatabase = () => {
  if (!databaseModulePromise) databaseModulePromise = import('./lib/database');
  return databaseModulePromise;
};

function DatabaseGate({ children }) {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ready) return undefined;
    let active = true;
    loadDatabase()
      .then(({ initDB }) => initDB())
      .then(() => { if (active) setReady(true); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [ready]);

  if (error) {
    return (
      <div className="loading">
        <span style={{ color: 'var(--err)', fontFamily: 'monospace', padding: 24 }}>
          {t('loading.initFailed', { message: error })}
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

  return children;
}

function AppInner() {
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const settings = useUserSettings();
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

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    if (user === undefined) return undefined;
    if (!user) {
      setProgressSyncUser(null);
      setSettingsSyncUser(null);
      setLearningSyncUser(null);
      const localOwner = isGuest ? 'guest' : 'anonymous';
      setProgressOwner(localOwner);
      setSettingsOwner(localOwner);
      setActivityOwner(localOwner);
      setLearningOwner(localOwner);
      return;
    }
    setProgressSyncUser(user.uid);
    setSettingsSyncUser(user.uid);
    setLearningSyncUser(user.uid);
    setActivityOwner(user.uid);
    syncProgressFromFirestore(user.uid)
      .catch(() => {});
    syncSettingsFromFirestore(user.uid)
      .catch(() => {});
    syncLearningFromFirestore(user.uid).catch(() => {});
    return () => {
      setProgressSyncUser(null);
      setSettingsSyncUser(null);
      setLearningSyncUser(null);
    };
  }, [isGuest, user]);

  if (pathname === '/login') {
    return <Login />;
  }

  return (
    <Layout theme={theme} onToggleTheme={toggleTheme}>
      <Suspense fallback={<div className="route-loading"><div className="spinner" /><span>{t('loading.page')}</span></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<DatabaseGate><Editor /></DatabaseGate>} />
          <Route path="/playground" element={<DatabaseGate><Playground /></DatabaseGate>} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:topicId" element={<DatabaseGate><LearnTopic /></DatabaseGate>} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<DatabaseGate><ProblemDetail /></DatabaseGate>} />
          <Route path="/tables" element={<DatabaseGate><Tables /></DatabaseGate>} />
          <Route path="/community" element={<Community />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cert" element={<Cert />} />
          <Route path="/cert/:certId" element={<DatabaseGate><CertDetail /></DatabaseGate>} />
          <Route path="/cert/:certId/exam" element={<CertExam />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={getPathLanguage(window.location.pathname) === 'ja' ? '/ja' : '/'}>
      <AuthProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <PageSeo />
            <AppInner />
          </ErrorBoundary>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
