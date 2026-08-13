import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { db } from './firebase';

const KEY = 'sqldojo_progress';
const FAVORITES_KEY = 'sqldojo_favorites';
const OWNER_KEY = 'sqldojo_progress_owner';
const EMPTY_PROGRESS = Object.freeze({});
const listeners = new Set();
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

function clearStoredProgress() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(FAVORITES_KEY);
  } catch {
    // Local persistence is optional.
  }
}

export function setProgressSyncUser(uid) {
  syncUid = uid || null;
  clearTimeout(syncTimer);
  syncTimer = null;
}

export function setProgressOwner(owner) {
  if (!owner) return;
  if (readOwner() && readOwner() !== owner) {
    clearStoredProgress();
    publishProgress();
  }
  setOwner(owner);
}

function load() {
  if (typeof localStorage === 'undefined') return {};
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

let progressSnapshot = load();

function publishProgress() {
  progressSnapshot = load();
  listeners.forEach((listener) => listener());
}

function subscribeProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress() {
  return useSyncExternalStore(subscribeProgress, () => progressSnapshot, () => EMPTY_PROGRESS);
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    localStorage.removeItem(FAVORITES_KEY);
  } catch {
    // Local persistence is optional.
  }
  if (syncUid) setOwner(syncUid);
  publishProgress();
  scheduleSync();
}

const normalizeEntry = (value = {}) => {
  const entry = {
    solved: false,
    attempts: 0,
    hintsUsed: 0,
    favorite: false,
    review: false,
    attempted: false,
    draftSql: '',
    ...value,
  };
  return {
    ...entry,
    attempts: Number(entry.attempts) || 0,
    hintsUsed: Number(entry.hintsUsed) || 0,
  };
};

export function getProblemProgress(id) {
  return normalizeEntry(load()[id]);
}

export function recordAttempt(id, solved, hintsUsed = 0) {
  const data = load();
  const prev = normalizeEntry(data[id]);
  data[id] = {
    ...prev,
    solved: prev.solved || Boolean(solved),
    attempts: prev.attempts + 1,
    hintsUsed: Math.max(prev.hintsUsed, Number(hintsUsed) || 0),
    review: prev.review || !solved,
    attempted: true,
  };
  save(data);
  return data[id];
}

export function saveProblemDraft(id, draftSql) {
  const data = load();
  const prev = normalizeEntry(data[id]);
  data[id] = { ...prev, draftSql };
  save(data);
  return data[id];
}

export function toggleFavorite(id) {
  const data = load();
  const prev = normalizeEntry(data[id]);
  data[id] = { ...prev, favorite: !prev.favorite };
  save(data);
  return data[id];
}

export function toggleReview(id) {
  const data = load();
  const prev = normalizeEntry(data[id]);
  data[id] = { ...prev, review: !prev.review };
  save(data);
  return data[id];
}

export function getAllProgress() {
  return progressSnapshot;
}

export function resetProgress() {
  clearStoredProgress();
  publishProgress();
  scheduleSync();
}

export function getFavorites() {
  return Object.entries(load()).filter(([, value]) => value.favorite).map(([id]) => Number(id));
}

// ── Wrong answers / attempted tracking ──────────────────

export function markAttempted(problemId) {
  const prog = load();
  const key = String(problemId);
  prog[key] = normalizeEntry(prog[key]);
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

export function getReviewProblems() {
  const prog = load();
  return Object.entries(prog)
    .filter(([, value]) => value.review)
    .map(([id]) => Number(id));
}

// ── Firestore sync ───────────────────────────────────────

function progressRef(uid) {
  return doc(db, 'users', uid, 'data', 'progress');
}

export async function syncProgressFromFirestore(uid) {
  const owner = readOwner();
  if (owner && owner !== uid) {
    clearStoredProgress();
    publishProgress();
  }
  setOwner(uid);
  const snap = await getDoc(progressRef(uid));
  if (syncUid !== uid) return;
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
  clearStoredProgress();
  setOwner(uid);
  publishProgress();
  if (uid) await setDoc(progressRef(uid), {});
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if ([KEY, FAVORITES_KEY, OWNER_KEY].includes(event.key)) publishProgress();
  });
}
