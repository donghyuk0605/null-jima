const ACTIVITY_KEY = 'sqldojo_activity';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function getActivity() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || {}; } catch { return {}; }
}

function saveActivity(data) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
}

export function recordActivity(type = 'query') {
  const data = getActivity();
  const key = getTodayKey();
  if (!data[key]) data[key] = { queries: 0, problems: 0 };
  if (type === 'problem') data[key].problems++;
  else data[key].queries++;
  saveActivity(data);
}

export function getStreak() {
  const data = getActivity();
  const today = new Date();
  let streak = 0;
  let longest = 0;
  // Check today first
  const todayKey = getTodayKey();
  const hasToday = !!data[todayKey];

  // Count current streak (going backwards from yesterday or today)
  let d = new Date(today);
  if (hasToday) {
    streak = 1;
    d.setDate(d.getDate() - 1);
    while (true) {
      const k = d.toISOString().split('T')[0];
      if (data[k]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
  } else {
    // Check if yesterday was active (streak not broken yet today)
    d.setDate(d.getDate() - 1);
    const yKey = d.toISOString().split('T')[0];
    if (data[yKey]) {
      streak = 1;
      d.setDate(d.getDate() - 1);
      while (true) {
        const k = d.toISOString().split('T')[0];
        if (data[k]) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      }
    }
  }

  // Compute longest streak from all data
  const keys = Object.keys(data).sort();
  let cur = 0;
  for (let i = 0; i < keys.length; i++) {
    if (i === 0) { cur = 1; }
    else {
      const prev = new Date(keys[i-1]);
      const curr = new Date(keys[i]);
      const diff = (curr - prev) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    }
    longest = Math.max(longest, cur);
  }

  const todayCount = data[todayKey] ? (data[todayKey].queries + data[todayKey].problems) : 0;
  const totalDays = Object.keys(data).length;
  return { streak, longest, hasToday, todayCount, totalDays };
}

export function getHeatmapData(weeks = 17) {
  const data = getActivity();
  const result = [];
  const today = new Date();
  // Start from `weeks` weeks ago, on a Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  let d = new Date(start);
  while (d <= today) {
    const key = d.toISOString().split('T')[0];
    const count = data[key] ? (data[key].queries + data[key].problems) : 0;
    result.push({ date: key, count, day: d.getDay() });
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export function getTodayGoal() {
  try { return Number(localStorage.getItem('sqldojo_daily_goal')) || 3; } catch { return 3; }
}
export function setTodayGoal(n) { localStorage.setItem('sqldojo_daily_goal', String(n)); }
