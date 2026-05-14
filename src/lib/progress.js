import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const KEY = 'sqldojo_progress';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
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
    const merged = { ...remote };
    for (const [id, lp] of Object.entries(local)) {
      const rp = remote[id] || { solved: false, attempts: 0, hintsUsed: 0 };
      merged[id] = {
        ...lp,
        ...rp,
        solved: lp.solved || rp.solved,
        attempts: Math.max(lp.attempts || 0, rp.attempts || 0),
        hintsUsed: Math.max(lp.hintsUsed || 0, rp.hintsUsed || 0),
      };
    }
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
  if (uid) await setDoc(progressRef(uid), {});
}
