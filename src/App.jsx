import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initDB } from './lib/database';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { syncProgressFromFirestore } from './lib/progress';
import { syncSettingsFromFirestore } from './lib/userSettings';
import { seedPostsIfEmpty } from './lib/community';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Playground from './pages/Playground';
import Learn from './pages/Learn';
import LearnTopic from './pages/LearnTopic';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Tables from './pages/Tables';
import Progress from './pages/Progress';
import Cert from './pages/Cert';
import CertDetail from './pages/CertDetail';
import CertExam from './pages/CertExam';
import Community from './pages/Community';
import Settings from './pages/Settings';
import './App.css';

const THEME_KEY = 'sqldojo_theme';

function AppInner() {
  const { user, isGuest } = useAuth();
  const { setLanguage, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch((e) => setInitError(e.message));
    seedPostsIfEmpty().catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    syncProgressFromFirestore(user.uid).catch(() => {});
    syncSettingsFromFirestore(user.uid)
      .then((settings) => setLanguage(settings.language))
      .catch(() => {});
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  );
}
