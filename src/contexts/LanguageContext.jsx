/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getUserSettings, saveUserSettings, saveUserSettingsWithSync } from '../lib/userSettings';
import { useAuth } from './AuthContext';
import { translations } from '../lib/translations';

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { id: 'ko', label: '한국어', nativeLabel: '한국어' },
  { id: 'ja', label: '일본어', nativeLabel: '日本語' },
];

function resolveLanguage(value) {
  return LANGUAGES.some((lang) => lang.id === value) ? value : 'ko';
}

function interpolate(template, vars) {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [language, setLanguageState] = useState(() =>
    resolveLanguage(getUserSettings().language)
  );

  const value = useMemo(() => {
    const setLanguage = (nextLanguage) => {
      const resolved = resolveLanguage(nextLanguage);
      const currentSettings = getUserSettings();
      const next = { ...currentSettings, language: resolved };
      const uid = userRef.current?.uid;
      if (uid) {
        saveUserSettingsWithSync(next, uid).catch(() => saveUserSettings(next));
      } else {
        saveUserSettings(next);
      }
      setLanguageState(resolved);
    };

    const t = (key, vars) => {
      const template =
        translations[language]?.[key] ?? translations.ko[key] ?? key;
      return interpolate(template, vars);
    };

    return { language, languages: LANGUAGES, setLanguage, t };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
