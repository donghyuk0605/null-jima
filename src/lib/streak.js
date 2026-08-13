import { useSyncExternalStore } from 'react';

const ACTIVITY_KEY = 'sqldojo_activity';
const ACTIVITY_OWNER_KEY = 'sqldojo_activity_owner';
const EMPTY_STREAK = Object.freeze({ streak: 0, longest: 0, hasToday: false, todayCount: 0, totalDays: 0 });
const listeners = new Set();

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return toLocalDateKey();
}

function readActivity() {
  if (typeof localStorage === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || {}; } catch { return {}; }
}

function readActivityOwner() {
  try {
    return localStorage.getItem(ACTIVITY_OWNER_KEY);
  } catch {
    return null;
  }
}

function parseLocalDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function calculateStreak(data) {
  const keys = Object.keys(data).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort();
  const today = new Date();
  let streak = 0;
  let longest = 0;
  const todayKey = getTodayKey();
  const hasToday = !!data[todayKey];

  let d = new Date(today);
  if (hasToday) {
    streak = 1;
    d.setDate(d.getDate() - 1);
    while (data[toLocalDateKey(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
  } else {
    d.setDate(d.getDate() - 1);
    if (data[toLocalDateKey(d)]) {
      streak = 1;
      d.setDate(d.getDate() - 1);
      while (data[toLocalDateKey(d)]) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
    }
  }

  let current = 0;
  for (let i = 0; i < keys.length; i += 1) {
    if (i === 0) {
      current = 1;
    } else {
      const previous = parseLocalDateKey(keys[i - 1]);
      const currentDate = parseLocalDateKey(keys[i]);
      const diff = Math.round((currentDate - previous) / 86400000);
      current = diff === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
  }

  const todayCount = data[todayKey]
    ? (Number(data[todayKey].queries) || 0) + (Number(data[todayKey].problems) || 0)
    : 0;
  return { streak, longest, hasToday, todayCount, totalDays: keys.length };
}

let activitySnapshot = readActivity();
let streakSnapshot = calculateStreak(activitySnapshot);
let activityOwner = readActivityOwner();

function publishActivity(data) {
  activitySnapshot = data;
  streakSnapshot = calculateStreak(data);
  listeners.forEach((listener) => listener());
}

function saveActivity(data) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
  } catch {
    // Activity history is optional.
  }
  publishActivity(data);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStreak() {
  return useSyncExternalStore(subscribe, () => streakSnapshot, () => EMPTY_STREAK);
}

export function setActivityOwner(owner) {
  if (!owner) return;
  if (activityOwner && activityOwner !== owner) {
    activitySnapshot = {};
    streakSnapshot = calculateStreak(activitySnapshot);
    try {
      localStorage.removeItem(ACTIVITY_KEY);
    } catch {
      // Activity history is optional.
    }
  }
  activityOwner = owner;
  try {
    localStorage.setItem(ACTIVITY_OWNER_KEY, owner);
  } catch {
    // Activity history is optional.
  }
  listeners.forEach((listener) => listener());
}

export function recordActivity(type = 'query') {
  const data = { ...activitySnapshot };
  const key = getTodayKey();
  data[key] = {
    queries: Number(data[key]?.queries) || 0,
    problems: Number(data[key]?.problems) || 0,
  };
  if (type === 'problem') data[key].problems += 1;
  else data[key].queries += 1;
  saveActivity(data);
}

export function getStreak() {
  return streakSnapshot;
}

export function getHeatmapData(weeks = 17) {
  const data = activitySnapshot;
  const result = [];
  const today = new Date();
  // Start from `weeks` weeks ago, on a Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  let d = new Date(start);
  while (d <= today) {
    const key = toLocalDateKey(d);
    const count = data[key]
      ? (Number(data[key].queries) || 0) + (Number(data[key].problems) || 0)
      : 0;
    result.push({ date: key, count, day: d.getDay() });
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export function getTodayGoal() {
  try { return Number(localStorage.getItem('sqldojo_daily_goal')) || 3; } catch { return 3; }
}
export function setTodayGoal(n) { localStorage.setItem('sqldojo_daily_goal', String(n)); }

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === ACTIVITY_KEY) publishActivity(readActivity());
    if (event.key === ACTIVITY_OWNER_KEY) {
      activityOwner = readActivityOwner();
      publishActivity(readActivity());
    }
  });
}
