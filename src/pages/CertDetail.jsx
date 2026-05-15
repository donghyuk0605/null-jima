import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CERT_LIST, SQLD_QUIZ, SQLP_QUIZ } from '../data/cert';
import { runQuery, translateSqlError } from '../lib/database';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';

const CORE_SQL_EXAMPLES = [
  {
    title: 'GROUP BY / HAVING',
    desc: '부서별 직원 수와 평균 급여를 구하고, 직원 수가 2명 이상인 부서만 필터링합니다.',
    sql: 'SELECT department_id,\n  COUNT(*) AS 직원수,\n  AVG(salary) AS 평균급여\nFROM employees\nGROUP BY department_id\nHAVING COUNT(*) >= 2\nORDER BY 평균급여 DESC;',
  },
  {
    title: 'JOIN (INNER / LEFT)',
    desc: '직원 테이블과 부서 테이블을 조인하여 부서명과 함께 급여를 조회합니다.',
    sql: 'SELECT e.name AS 직원명,\n  d.name AS 부서명,\n  e.salary AS 급여\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nORDER BY e.salary DESC;',
  },
  {
    title: '서브쿼리',
    desc: '전체 평균 급여보다 높은 급여를 받는 직원을 조회합니다.',
    sql: 'SELECT name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC;',
  },
  {
    title: 'CASE WHEN',
    desc: '급여 구간에 따라 등급을 분류합니다.',
    sql: "SELECT name, salary,\n  CASE\n    WHEN salary >= 6500000 THEN 'S등급'\n    WHEN salary >= 5000000 THEN 'A등급'\n    WHEN salary >= 4000000 THEN 'B등급'\n    ELSE 'C등급'\n  END AS 급여등급\nFROM employees\nORDER BY salary DESC;",
  },
  {
    title: '윈도우 함수 (RANK / DENSE_RANK)',
    desc: '급여 순위를 RANK와 DENSE_RANK 두 방식으로 계산합니다.',
    sql: 'SELECT name, salary,\n  RANK() OVER (ORDER BY salary DESC) AS RANK순위,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS DENSE_RANK순위\nFROM employees;',
  },
  {
    title: 'NULL 처리 (COALESCE)',
    desc: 'COALESCE를 사용하여 NULL 값을 기본값으로 대체합니다.',
    sql: "SELECT name,\n  COALESCE(CAST(department_id AS TEXT), '미배정') AS 부서ID\nFROM employees;",
  },
];

export default function CertDetail() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const cert = CERT_LIST.find((c) => c.id === certId);
  const [activeTab, setActiveTab] = useState('overview');
  const [sqlResults, setSqlResults] = useState({});
  const [sqlErrors, setSqlErrors] = useState({});

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCorrect, setAnsweredCorrect] = useState([]);
  const [quizSqlResults, setQuizSqlResults] = useState(null);
  const [quizSqlError, setQuizSqlError] = useState(null);

  if (!cert) {
    return (
      <div className="page">
        <Link to="/cert" className="btn btn-ghost-sm">← 자격증 목록</Link>
        <p style={{ marginTop: 16 }}>자격증 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const quiz = certId === 'sqld' ? SQLD_QUIZ : certId === 'sqlp' ? SQLP_QUIZ : [];

  const runCoreSql = (idx, sqlStr) => {
    try {
      const res = runQuery(sqlStr.trim());
      setSqlResults((prev) => ({ ...prev, [idx]: res }));
      setSqlErrors((prev) => ({ ...prev, [idx]: null }));
    } catch (e) {
      setSqlErrors((prev) => ({ ...prev, [idx]: translateSqlError(e) }));
      setSqlResults((prev) => ({ ...prev, [idx]: null }));
    }
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const q = quiz[currentQ];
    const isCorrect = selected === q.answer;
    if (isCorrect) {
      setScore((s) => s + 1);
    }
    setAnsweredCorrect((prev) => {
      const updated = [...prev];
      updated[currentQ] = isCorrect;
      return updated;
    });
    setSubmitted(true);
    setQuizSqlResults(null);
    setQuizSqlError(null);
  };

  const handleNext = () => {
    setSelected(null);
    setSubmitted(false);
    setCurrentQ((q) => q + 1);
    setQuizSqlResults(null);
    setQuizSqlError(null);
  };

  const handlePrev = () => {
    setSelected(null);
    setSubmitted(false);
    setCurrentQ((q) => q - 1);
    setQuizSqlResults(null);
    setQuizSqlError(null);
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setAnsweredCorrect([]);
    setQuizSqlResults(null);
    setQuizSqlError(null);
  };

  const runQuizSql = (sqlStr) => {
    try {
      const res = runQuery(sqlStr.trim());
      setQuizSqlResults(res);
      setQuizSqlError(null);
    } catch (e) {
      setQuizSqlError(translateSqlError(e));
      setQuizSqlResults(null);
    }
  };

  const isQuizDone = currentQ >= quiz.length;

  return (
    <div className="page cert-detail-page">
      <div className="cert-detail-header">
        <Link to="/cert" className="btn btn-ghost-sm">← 자격증 목록</Link>
        <div className="cert-detail-title-row">
          <Icon name="trophy" style={{ width: 28, height: 28, color: cert.color }} />
          <h2 className="cert-detail-title" style={{ color: cert.color }}>{cert.name}</h2>
          <span className={`badge level-${cert.level}`}>{cert.level}</span>
          <span className="cert-detail-fullname">{cert.fullName}</span>
        </div>
        <p className="cert-detail-desc">{cert.desc}</p>
        <button
          className="btn btn-run exam-start-btn"
          onClick={() => navigate(`/cert/${cert.id}/exam`)}
          style={{ marginTop: 12 }}
        >
          🎯 모의고사 시작 ({quiz.length}문제 · {cert.examTime}분)
        </button>
      </div>

      {/* 탭 */}
      <div className="cert-tabs">
        {['overview', 'sql', ...(certId === 'sqld' ? ['quiz'] : [])].map((tab) => (
          <button
            key={tab}
            className={`cert-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? { borderBottomColor: cert.color, color: cert.color } : {}}
          >
            {tab === 'overview' ? '개요' : tab === 'sql' ? '핵심 SQL' : '예상문제'}
          </button>
        ))}
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <div className="cert-tab-content">
          <section className="cert-section">
            <h3 className="cert-section-title">시험 정보</h3>
            <div className="cert-info-table">
              <div className="cert-info-row">
                <span className="cert-info-label">주관 기관</span>
                <span className="cert-info-value">{cert.org}</span>
              </div>
              <div className="cert-info-row">
                <span className="cert-info-label">시험 시간</span>
                <span className="cert-info-value">{cert.examTime}분</span>
              </div>
              <div className="cert-info-row">
                <span className="cert-info-label">시험 횟수</span>
                <span className="cert-info-value">{cert.frequency}</span>
              </div>
              <div className="cert-info-row">
                <span className="cert-info-label">합격 기준</span>
                <span className="cert-info-value">{cert.passCriteria}</span>
              </div>
              <div className="cert-info-row">
                <span className="cert-info-label">총 문항 수</span>
                <span className="cert-info-value">{cert.totalQ}문항 / {cert.totalScore}점</span>
              </div>
            </div>
          </section>

          <section className="cert-section">
            <h3 className="cert-section-title">과목 구성</h3>
            <div className="cert-subjects">
              {cert.subjects.map((sub, i) => (
                <div key={i} className="cert-subject-card">
                  <div className="cert-subject-header">
                    <span className="cert-subject-name">{sub.name}</span>
                    <span className="cert-subject-score">{sub.questions}문항 / {sub.score}점</span>
                  </div>
                  <div className="cert-subject-topics">
                    {sub.topics.map((t) => (
                      <span key={t} className="cert-topic-chip">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="cert-section">
            <h3 className="cert-section-title">핵심 출제 범위</h3>
            <ul className="cert-key-topics">
              {cert.keyTopics.map((t, i) => (
                <li key={i} className="cert-key-topic-item">
                  <span className="cert-topic-num">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section className="cert-section">
            <h3 className="cert-section-title">학습 플랜</h3>
            <div className="cert-study-plan">
              {cert.studyPlan.map((step, i) => (
                <div key={i} className="cert-plan-step">
                  <div className="cert-plan-dot" style={{ background: cert.color }} />
                  <span className="cert-plan-text">{step}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 핵심 SQL 탭 */}
      {activeTab === 'sql' && (
        <div className="cert-tab-content">
          <p className="cert-sql-intro">SQLD 시험에 자주 출제되는 SQL 패턴을 직접 실행해보세요.</p>
          {CORE_SQL_EXAMPLES.map((ex, i) => (
            <div key={i} className="cert-sql-example">
              <div className="cert-sql-example-header">
                <span className="cert-sql-num">{i + 1}</span>
                <span className="cert-sql-title">{ex.title}</span>
              </div>
              <p className="cert-sql-desc">{ex.desc}</p>
              <div className="editor-card">
                <SqlEditor
                  value={ex.sql}
                  height="auto"
                  readOnly={true}
                  autocomplete={false}
                />
                <div className="editor-toolbar">
                  <button className="btn btn-run-sm" onClick={() => runCoreSql(i, ex.sql)}>
                    <Icon name="play" className="btn-icon" />
                    실행
                  </button>
                </div>
              </div>
              {(sqlResults[i] !== undefined || sqlErrors[i]) && (
                <div className="cert-sql-result">
                  <ResultTable results={sqlResults[i]} error={sqlErrors[i]} elapsed={null} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 예상문제 탭 (SQLD 전용) */}
      {activeTab === 'quiz' && certId === 'sqld' && (
        <div className="cert-tab-content">
          {isQuizDone ? (
            <div className="cert-quiz-done">
              <Icon name="trophy" style={{ width: 48, height: 48, color: cert.color }} />
              <h3 className="cert-quiz-done-title">퀴즈 완료!</h3>
              <p className="cert-quiz-done-score">
                {quiz.length}문제 중 <strong style={{ color: cert.color }}>{score}문제</strong> 정답
              </p>
              <p className="cert-quiz-done-pct">
                정답률: {Math.round((score / quiz.length) * 100)}%
                {score >= quiz.length * 0.8 ? ' — 훌륭합니다!' : score >= quiz.length * 0.6 ? ' — 합격권입니다!' : ' — 더 연습이 필요합니다.'}
              </p>
              <div className="cert-quiz-done-summary">
                {quiz.map((q, i) => (
                  <span
                    key={i}
                    className="cert-quiz-dot"
                    style={{ background: answeredCorrect[i] ? 'var(--success)' : 'var(--err)' }}
                    title={`Q${i + 1}: ${answeredCorrect[i] ? '정답' : '오답'}`}
                  />
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleReset}>다시 풀기</button>
            </div>
          ) : (
            <div className="cert-quiz-area">
              {/* 진행 표시 */}
              <div className="cert-quiz-progress">
                <div className="cert-quiz-progress-bar">
                  <div
                    className="cert-quiz-progress-fill"
                    style={{ width: `${(currentQ / quiz.length) * 100}%`, background: cert.color }}
                  />
                </div>
                <span className="cert-quiz-progress-label">{currentQ + 1} / {quiz.length}</span>
                <span className="cert-quiz-score-label">현재 점수: {score}점</span>
              </div>

              {/* 문제 카드 */}
              {(() => {
                const q = quiz[currentQ];
                return (
                  <div className="cert-quiz-card">
                    <div className="cert-quiz-meta">
                      <span className="cert-quiz-subject">{q.subject}</span>
                      <span className={`cert-quiz-difficulty diff-${q.difficulty}`}>{q.difficulty}</span>
                    </div>
                    <p className="cert-quiz-question" style={{ whiteSpace: 'pre-wrap' }}>{q.question}</p>

                    <div className="cert-quiz-options">
                      {q.options.map((opt, oi) => {
                        let cls = 'cert-quiz-option';
                        if (submitted) {
                          if (oi === q.answer) cls += ' correct';
                          else if (oi === selected) cls += ' wrong';
                        } else if (selected === oi) {
                          cls += ' selected';
                        }
                        return (
                          <button
                            key={oi}
                            className={cls}
                            onClick={() => !submitted && setSelected(oi)}
                            disabled={submitted}
                          >
                            <span className="cert-quiz-option-num">{oi + 1}</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div className={`cert-quiz-explanation ${selected === q.answer ? 'correct' : 'wrong'}`}>
                        <strong>{selected === q.answer ? '정답입니다!' : '오답입니다.'}</strong>
                        <p>{q.explanation}</p>
                        {q.sql && (
                          <div className="cert-quiz-sql-area">
                            <button className="btn btn-ghost-sm" onClick={() => runQuizSql(q.sql)}>
                              <Icon name="play" className="btn-icon" />
                              SQL 실행
                            </button>
                            <div style={{ marginTop: 8 }}>
                              <SqlEditor value={q.sql} readOnly height="auto" autocomplete={false} />
                            </div>
                            {(quizSqlResults !== null || quizSqlError) && (
                              <div style={{ marginTop: 8 }}>
                                <ResultTable results={quizSqlResults} error={quizSqlError} elapsed={null} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="cert-quiz-actions">
                      <button
                        className="btn btn-ghost-sm"
                        onClick={handlePrev}
                        disabled={currentQ === 0}
                      >
                        이전
                      </button>
                      {!submitted ? (
                        <button
                          className="btn btn-primary"
                          onClick={handleSubmit}
                          disabled={selected === null}
                        >
                          제출
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={handleNext}>
                          {currentQ < quiz.length - 1 ? '다음 문제' : '결과 보기'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
