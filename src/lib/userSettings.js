import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { db } from './firebase';

const KEY = 'sqldojo_user_settings';
const OWNER_KEY = 'sqldojo_settings_owner';

export const DB_TYPES = [
  {
    id: 'sqlite',
    name: 'SQLite',
    status: '지원중',
    description: '현재 실습 엔진입니다. 브라우저 안에서 바로 실행됩니다.',
    available: true,
  },
  {
    id: 'mysql',
    name: 'MySQL',
    status: '준비중',
    description: 'MySQL 전용 실행 환경은 준비중입니다.',
    available: false,
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    status: '준비중',
    description: 'PostgreSQL 전용 실행 환경은 준비중입니다.',
    available: false,
  },
  {
    id: 'oracle',
    name: 'Oracle',
    status: '준비중',
    description: 'Oracle 전용 문법과 실습 환경은 준비중입니다.',
    available: false,
  },
];

export const DEFAULT_SETTINGS = {
  displayName: '',
  language: 'ko',
  dbType: 'sqlite',
  editorFontSize: 13,
  autoSaveSql: true,
  showLearningHints: true,
  compactMode: false,
};

const listeners = new Set();
let syncUid = null;
let syncTimer = null;

const readSettings = () => {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

let settingsSnapshot = readSettings();

const publish = (next) => {
  settingsSnapshot = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function readOwner() {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function setOwner(uid) {
  try {
    if (uid) localStorage.setItem(OWNER_KEY, uid);
    else localStorage.removeItem(OWNER_KEY);
  } catch {
    // Local persistence is optional.
  }
}

function clearStoredSettings() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Local persistence is optional.
  }
}

const scheduleSync = () => {
  if (!syncUid) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    setDoc(settingsRef(syncUid), settingsSnapshot).catch(() => {});
  }, 350);
};

export function getUserSettings() {
  return settingsSnapshot;
}

export function useUserSettings() {
  return useSyncExternalStore(subscribe, () => settingsSnapshot, () => DEFAULT_SETTINGS);
}

export function saveUserSettings(settings) {
  const next = { ...DEFAULT_SETTINGS, ...settings };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Local persistence is optional.
  }
  if (syncUid) setOwner(syncUid);
  publish(next);
  scheduleSync();
  return next;
}

export function resetUserSettings() {
  clearStoredSettings();
  publish(DEFAULT_SETTINGS);
  scheduleSync();
  return DEFAULT_SETTINGS;
}

export function setSettingsSyncUser(uid) {
  syncUid = uid || null;
  clearTimeout(syncTimer);
  syncTimer = null;
  if (uid) setOwner(uid);
}

export function setSettingsOwner(owner) {
  if (!owner) return;
  if (readOwner() && readOwner() !== owner) {
    clearStoredSettings();
    publish(DEFAULT_SETTINGS);
  }
  setOwner(owner);
}

// ── Firestore sync ───────────────────────────────────────

function settingsRef(uid) {
  return doc(db, 'users', uid, 'data', 'settings');
}

export async function syncSettingsFromFirestore(uid) {
  const owner = readOwner();
  if (owner && owner !== uid) {
    clearStoredSettings();
    publish(DEFAULT_SETTINGS);
  }
  setOwner(uid);
  const local = getUserSettings();
  const snap = await getDoc(settingsRef(uid));
  if (syncUid !== uid) return null;
  if (snap.exists()) {
    const remote = snap.data();
    // Local wins for language: if local differs from remote default, keep local and push to Firestore
    const merged = { ...DEFAULT_SETTINGS, ...remote };
    if (local.language && local.language !== DEFAULT_SETTINGS.language && local.language !== remote.language) {
      merged.language = local.language;
      await setDoc(settingsRef(uid), merged);
    }
    saveUserSettings(merged);
    return merged;
  } else {
    await setDoc(settingsRef(uid), local);
    return local;
  }
}

export async function saveUserSettingsWithSync(settings, uid) {
  setSettingsSyncUser(uid);
  const saved = saveUserSettings(settings);
  if (uid) await setDoc(settingsRef(uid), saved);
  return saved;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (![KEY, OWNER_KEY].includes(event.key)) return;
    settingsSnapshot = readSettings();
    listeners.forEach((listener) => listener());
  });
}
