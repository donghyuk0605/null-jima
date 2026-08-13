import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { db } from './firebase';

const KEY = 'sqldojo_learning_progress';
const OWNER_KEY = 'sqldojo_learning_progress_owner';
const EMPTY_PROGRESS = Object.freeze({ topics: {} });
const listeners = new Set();
let syncUid = null;
let syncTimer = null;

function readOwner() {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function read() {
  if (typeof localStorage === 'undefined') return { topics: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { topics: {}, ...parsed };
  } catch {
    return { topics: {} };
  }
}

let snapshot = read();

function publish(next = read()) {
  snapshot = { topics: {}, ...next };
  listeners.forEach((listener) => listener());
}

function save(next) {
  const normalized = { topics: {}, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(normalized));
  } catch {
    // Local persistence is optional.
  }
  if (syncUid) {
    try { localStorage.setItem(OWNER_KEY, syncUid); } catch { /* optional */ }
  }
  publish(normalized);
  if (syncUid) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      setDoc(learningRef(syncUid), snapshot).catch(() => {});
    }, 350);
  }
  return snapshot;
}

export function getLearningProgress() {
  return snapshot;
}

export function useLearningProgress() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => EMPTY_PROGRESS,
  );
}

export function markTopicComplete(topicId, completed = true) {
  const topics = { ...snapshot.topics };
  const previous = topics[topicId] || {};
  topics[topicId] = {
    ...previous,
    completed: Boolean(completed),
    completedAt: completed ? (previous.completedAt || new Date().toISOString()) : null,
  };
  return save({ ...snapshot, topics });
}

function clearStoredProgress() {
  try { localStorage.removeItem(KEY); } catch { /* optional */ }
}

export function setLearningOwner(owner) {
  if (!owner) return;
  if (readOwner() && readOwner() !== owner) {
    clearStoredProgress();
    publish({ topics: {} });
  }
  try { localStorage.setItem(OWNER_KEY, owner); } catch { /* optional */ }
}

export function setLearningSyncUser(uid) {
  syncUid = uid || null;
  clearTimeout(syncTimer);
  syncTimer = null;
  if (uid) setLearningOwner(uid);
}

function learningRef(uid) {
  return doc(db, 'users', uid, 'data', 'learning');
}

function mergeLearning(local, remote) {
  const topics = { ...(remote?.topics || {}) };
  for (const [topicId, localTopic] of Object.entries(local?.topics || {})) {
    const remoteTopic = topics[topicId] || {};
    topics[topicId] = {
      ...localTopic,
      ...remoteTopic,
      completed: Boolean(localTopic.completed || remoteTopic.completed),
      completedAt: localTopic.completedAt || remoteTopic.completedAt || null,
    };
  }
  return { topics };
}

export async function syncLearningFromFirestore(uid) {
  const owner = readOwner();
  if (owner && owner !== uid) {
    clearStoredProgress();
    publish({ topics: {} });
  }
  setLearningOwner(uid);
  const snap = await getDoc(learningRef(uid));
  if (syncUid !== uid) return null;
  const local = getLearningProgress();
  if (snap.exists()) {
    const merged = mergeLearning(local, snap.data());
    save(merged);
    await setDoc(learningRef(uid), merged);
    return merged;
  }
  if (Object.keys(local.topics).length > 0) await setDoc(learningRef(uid), local);
  return local;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if ([KEY, OWNER_KEY].includes(event.key)) publish();
  });
}
