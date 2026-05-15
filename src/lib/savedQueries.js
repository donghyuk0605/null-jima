const KEY = 'sqldojo_saved_queries';
export const getSavedQueries = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
export const saveQuery = (name, sql) => {
  const items = getSavedQueries();
  const item = { id: `sq_${Date.now()}`, name: name.trim(), sql, createdAt: new Date().toISOString() };
  const next = [item, ...items].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};
export const deleteSavedQuery = (id) => {
  const next = getSavedQueries().filter(q => q.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};
