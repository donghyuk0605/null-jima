import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const KEY = 'sqldojo_progress';
const FAVORITES_KEY = 'sqldojo_favorites';
let syncUid = null;
let syncTimer = null;

export function mergeProgress(local, remote) {
  const merged = { ...remote };
  for (const [id, lp] of Object.entries(local)) {
    const rp = remote[id] || { solved: false, attempts: 0, hintsUsed: 0 };
    merged[id] = {
      ...lp,
      ...rp,
      solved: Boolean(lp.solved || rp.solved),
      favorite: Boolean(lp.favorite || rp.favorite),
      review: Boolean(lp.review || rp.review),
      attempted: Boolean(lp.attempted || rp.attempted),
      draftSql: lp.draftSql || rp.draftSql || '',
      attempts: Math.max(lp.attempts || 0, rp.attempts || 0),
      hintsUsed: Math.max(lp.hintsUsed || 0, rp.hintsUsed || 0),
    };
  }
  return merged;
}

const scheduleSync = () => {
  if (!syncUid) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    setDoc(progressRef(syncUid), load()).catch(() => {});
  }, 350);
};

export function setProgressSyncUser(uid) {
  syncUid = uid || null;
  clearTimeout(syncTimer);
  syncTimer = null;
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) || {};
    const legacyFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    for (const id of legacyFavorites) {
      data[id] = { ...(data[id] || {}), favorite: true };
    }
    return data;
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  localStorage.removeItem(FAVORITES_KEY);
  scheduleSync();
}

export function getProblemProgress(id) {
  return load()[id] || { solved: false, attempts: 0, hintsUsed: 0, favorite: false, review: false, draftSql: '' };
}

export function recordAttempt(id, solved, hintsUsed = 0) {
  const data = load();
  const prev = data[id] || { solved: false, attempts: 0, hintsUsed: 0 };
  data[id] = {
    ...prev,
    solved: prev.solved || solved,
    attempts: prev.attempts + 1,
    hintsUsed: Math.max(prev.hintsUsed, hintsUsed),
    review: prev.review || !solved,
  };
  save(data);
  return data[id];
}

export function saveProblemDraft(id, draftSql) {
  const data = load();
  const prev = data[id] || { solved: false, attempts: 0, hintsUsed: 0 };
  data[id] = { ...prev, draftSql };
  save(data);
  return data[id];
}

export function toggleFavorite(id) {
  const data = load();
  const prev = data[id] || { solved: false, attempts: 0, hintsUsed: 0 };
  data[id] = { ...prev, favorite: !prev.favorite };
  save(data);
  return data[id];
}

export function toggleReview(id) {
  const data = load();
  const prev = data[id] || { solved: false, attempts: 0, hintsUsed: 0 };
  data[id] = { ...prev, review: !prev.review };
  save(data);
  return data[id];
}

export function getAllProgress() {
  return load();
}

export function resetProgress() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(FAVORITES_KEY);
  scheduleSync();
}

export function getFavorites() {
  return Object.entries(load()).filter(([, value]) => value.favorite).map(([id]) => Number(id));
}

// ── Wrong answers / attempted tracking ──────────────────

export function markAttempted(problemId) {
  const prog = load();
  const key = String(problemId);
  if (!prog[key]) prog[key] = {};
  if (!prog[key].solved) {
    prog[key].attempted = true;
  }
  save(prog);
}

export function getWrongProblems() {
  const prog = load();
  return Object.entries(prog)
    .filter(([, v]) => v.attempted && !v.solved)
    .map(([id]) => Number(id));
}

// ── Firestore sync ───────────────────────────────────────

function progressRef(uid) {
  return doc(db, 'users', uid, 'data', 'progress');
}

export async function syncProgressFromFirestore(uid) {
  const snap = await getDoc(progressRef(uid));
  const local = load();

  if (snap.exists()) {
    const remote = snap.data();
    const merged = mergeProgress(local, remote);
    save(merged);
    await setDoc(progressRef(uid), merged);
  } else if (Object.keys(local).length > 0) {
    await setDoc(progressRef(uid), local);
  }
}

export async function pushProgressToFirestore(uid) {
  await setDoc(progressRef(uid), load());
}

export async function resetProgressWithSync(uid) {
  localStorage.removeItem(KEY);
  localStorage.removeItem(FAVORITES_KEY);
  if (uid) await setDoc(progressRef(uid), {});
}
