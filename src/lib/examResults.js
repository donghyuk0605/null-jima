export const EXAM_RESULTS_KEY = 'sqldojo_exam_results';

export function getExamResults(certId) {
  try {
    const all = JSON.parse(localStorage.getItem(EXAM_RESULTS_KEY) || '[]');
    if (!Array.isArray(all)) return [];
    return all.filter((result) => !certId || result.certId === certId);
  } catch {
    return [];
  }
}

export function saveExamResult(certId, result) {
  try {
    const all = getExamResults();
    all.unshift({ certId, ...result, date: new Date().toISOString() });
    localStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(all.slice(0, 10)));
  } catch {
    // Local history is optional; ignore storage failures.
  }
}
