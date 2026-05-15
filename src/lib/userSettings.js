import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const KEY = 'sqldojo_user_settings';

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
    status: '문법 참고',
    description: 'LIMIT, 문자열 함수 등 MySQL 문법 차이를 확인하는 학습 모드입니다.',
    available: true,
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    status: '문법 참고',
    description: 'PostgreSQL 스타일 쿼리 작성 습관을 비교해볼 수 있습니다.',
    available: true,
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

export function getUserSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings) {
  const next = { ...DEFAULT_SETTINGS, ...settings };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resetUserSettings() {
  localStorage.removeItem(KEY);
  return DEFAULT_SETTINGS;
}

// ── Firestore sync ───────────────────────────────────────

function settingsRef(uid) {
  return doc(db, 'users', uid, 'data', 'settings');
}

export async function syncSettingsFromFirestore(uid) {
  const local = getUserSettings();
  const snap = await getDoc(settingsRef(uid));
  if (snap.exists()) {
    const remote = snap.data();
    // Local wins for language: if local differs from remote default, keep local and push to Firestore
    const merged = { ...DEFAULT_SETTINGS, ...remote };
    if (local.language && local.language !== DEFAULT_SETTINGS.language && local.language !== remote.language) {
      merged.language = local.language;
      await setDoc(settingsRef(uid), merged);
    }
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  } else {
    await setDoc(settingsRef(uid), local);
    return local;
  }
}

export async function saveUserSettingsWithSync(settings, uid) {
  const saved = saveUserSettings(settings);
  if (uid) await setDoc(settingsRef(uid), saved);
  return saved;
}
