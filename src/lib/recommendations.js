function progressRank(entry = {}) {
  if (entry.review && !entry.solved) return 3;
  if (entry.attempted || Number(entry.attempts) > 0) return 2;
  return 1;
}

export function getRecommendedProblem(problems, progress = {}) {
  if (!Array.isArray(problems) || problems.length === 0) return null;

  const unsolved = problems.filter((problem) => !progress[problem.id]?.solved);
  const pool = unsolved.length > 0 ? unsolved : problems;
  const problem = [...pool].sort((a, b) => {
    const rankDiff = progressRank(progress[b.id]) - progressRank(progress[a.id]);
    if (rankDiff !== 0) return rankDiff;
    const attemptsDiff = (Number(progress[b.id]?.attempts) || 0) - (Number(progress[a.id]?.attempts) || 0);
    return attemptsDiff || a.id - b.id;
  })[0];

  const entry = progress[problem.id] || {};
  const reason = unsolved.length === 0
    ? 'allDone'
    : entry.review && !entry.solved
      ? 'review'
      : entry.attempted || Number(entry.attempts) > 0
        ? 'continue'
        : 'new';

  return { problem, reason };
}

export function getRecommendedTopic(topics, progress = {}, learningProgress = {}) {
  if (!Array.isArray(topics) || topics.length === 0) return null;
  const incompleteTopics = topics.filter((topic) => !learningProgress.topics?.[topic.id]?.completed);
  if (incompleteTopics.length === 0) return null;

  const getTopicScore = (topic) => topic.relatedProblems.reduce((score, problemId) => {
    const entry = progress[problemId] || {};
    if (entry.review && !entry.solved) return score + 4;
    if (entry.attempted || Number(entry.attempts) > 0) return score + 2;
    return score;
  }, topic.relatedProblems.length > 0 ? 1 : 0);

  return incompleteTopics
    .map((topic, index) => ({ topic, score: getTopicScore(topic), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0].topic;
}
