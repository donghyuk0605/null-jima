export function gradeCertificationExam(quiz, answers, {
  passScore = 60,
  subjectPassScore = 40,
} = {}) {
  const correct = quiz.filter((question) => answers[question.id] === question.answer).length;
  const wrong = quiz.filter((question) => answers[question.id] !== undefined && answers[question.id] !== question.answer).length;
  const unanswered = quiz.length - correct - wrong;
  const score = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0;
  const hasSubjectCutoff = Number.isFinite(subjectPassScore);
  const subjectResults = [...new Set(quiz.map((question) => question.subject))].map((subject) => {
    const subjectQuiz = quiz.filter((question) => question.subject === subject);
    const subjectCorrect = subjectQuiz.filter((question) => answers[question.id] === question.answer).length;
    const subjectScore = Math.round((subjectCorrect / subjectQuiz.length) * 100);
    return {
      subject,
      correct: subjectCorrect,
      total: subjectQuiz.length,
      score: subjectScore,
      passed: hasSubjectCutoff ? subjectScore >= subjectPassScore : null,
    };
  });

  return {
    correct,
    wrong,
    unanswered,
    score,
    passed: score >= passScore && subjectResults.every((subjectResult) => subjectResult.passed !== false),
    subjectResults,
  };
}
