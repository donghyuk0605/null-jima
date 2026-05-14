import { useParams, Link } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { PROBLEMS, TAG_COLORS } from '../data/problems';
import { runQuery, gradeQuery, translateSqlError } from '../lib/database';
import {
  getProblemProgress,
  recordAttempt,
  saveProblemDraft,
  toggleFavorite,
  toggleReview,
} from '../lib/progress';
import { formatSql } from '../lib/sqlFormatter';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import { getStoredEditorMode, saveStoredEditorMode } from '../lib/editorModes';

const AC_KEY = 'sqldojo_ac';

const buildHintSteps = (problem) => [
  `사용할 테이블: ${problem.tables.join(', ')}`,
  problem.hints[0] || problem.description,
  problem.hints[1] || 'SELECT, FROM, WHERE/JOIN/GROUP BY 순서로 쿼리 골격을 먼저 잡아보세요.',
  problem.hints[2] || `${problem.answer};`,
];

export default function ProblemDetail() {
  const { id } = useParams();
  const problem = PROBLEMS.find((p) => p.id === Number(id));

  if (!problem) return <div className="page"><p>문제를 찾을 수 없습니다.</p></div>;

  return <ProblemDetailContent key={problem.id} problem={problem} />;
}

function ProblemDetailContent({ problem }) {
  const [progress, setProgress] = useState(() => getProblemProgress(problem.id));
  const [userSql, setUserSql] = useState(() => progress.draftSql || '-- 여기에 SQL을 작성하세요\n');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [gradeResult, setGradeResult] = useState(null);
  const [hintsOpen, setHintsOpen] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [autocomplete, setAutocomplete] = useState(() => {
    const stored = localStorage.getItem(AC_KEY);
    return stored === null ? true : stored === 'true';
  });

  const execute = useCallback(() => {
    if (!problem) return;
    setError(null);
    setGradeResult(null);
    const start = performance.now();
    try {
      const res = runQuery(userSql.trim());
      setElapsed(Math.round(performance.now() - start));
      setResults(res);
    } catch (e) {
      setElapsed(null);
      setError(translateSqlError(e));
      setResults(null);
    }
  }, [userSql, problem]);

  const grade = useCallback(() => {
    if (!problem) return;
    execute();
    const result = gradeQuery(userSql.trim(), problem.answer, problem.checkOrder, {
      strictColumns: problem.strictColumns,
    });
    setGradeResult(result);
    const updated = recordAttempt(problem.id, result.correct, hintsOpen);
    setProgress(updated);
  }, [userSql, problem, hintsOpen, execute]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); execute(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [execute]);

  const toggleAutocomplete = () => {
    setAutocomplete((prev) => {
      const next = !prev;
      localStorage.setItem(AC_KEY, String(next));
      return next;
    });
  };

  const updateSql = (value) => {
    setUserSql(value);
    if (problem) {
      const updated = saveProblemDraft(problem.id, value);
      setProgress(updated);
    }
  };

  const handleFormat = () => {
    updateSql(formatSql(userSql));
  };

  const handleFavorite = () => {
    if (!problem) return;
    setProgress(toggleFavorite(problem.id));
  };

  const handleReview = () => {
    if (!problem) return;
    setProgress(toggleReview(problem.id));
  };

  const changeEditorMode = (mode) => {
    setEditorMode(mode);
    saveStoredEditorMode(mode);
  };

  const pickSyntax = (sql) => {
    updateSql(sql);
  };

  const prevP = PROBLEMS[PROBLEMS.indexOf(problem) - 1];
  const nextP = PROBLEMS[PROBLEMS.indexOf(problem) + 1];
  const hintSteps = buildHintSteps(problem);
  const effectiveAutocomplete = editorMode !== 'terminal' && autocomplete;

  return (
    <div className="page problem-detail-page">
      {/* 상단 네비 */}
      <div className="problem-nav">
        <Link to="/problems" className="btn btn-ghost-sm">← 목록</Link>
        <div className="problem-nav-pages">
          {prevP && <Link to={`/problems/${prevP.id}`} className="btn btn-ghost-sm">이전</Link>}
          {nextP && <Link to={`/problems/${nextP.id}`} className="btn btn-ghost-sm">다음</Link>}
        </div>
      </div>

      <div className="problem-layout">
        {/* 왼쪽: 문제 정보 */}
        <div className="problem-info">
          <div className="problem-meta">
            <span className={`badge level-${problem.level}`}>{problem.level}</span>
            {problem.tags.map((t) => (
              <span key={t} className="tag" style={{ background: TAG_COLORS[t] + '22', color: TAG_COLORS[t], border: `1px solid ${TAG_COLORS[t]}44` }}>{t}</span>
            ))}
            {progress?.solved && (
              <span className="solved-badge">
                <Icon name="success" className="status-icon" />
                완료
              </span>
            )}
            {progress?.favorite && <span className="review-badge">즐겨찾기</span>}
            {progress?.review && <span className="review-badge">다시 풀기</span>}
          </div>

          <h2 className="problem-title">{problem.title}</h2>
          <p className="problem-desc">{problem.description}</p>

          <div className="problem-tables">
            <div className="ptables-label">사용 테이블</div>
            {problem.tables.map((t) => (
              <span key={t} className="table-chip">{t}</span>
            ))}
          </div>

          <div className="problem-side-actions">
            <button className="btn btn-ghost-sm" onClick={handleFavorite}>
              <Icon name="star" className="status-icon" />
              {progress?.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
            </button>
            <button className="btn btn-ghost-sm" onClick={handleReview}>
              {progress?.review ? '다시 풀기 해제' : '다시 풀기'}
            </button>
          </div>

          {/* 힌트 */}
          <div className="hints-section">
            <div className="hints-label">힌트</div>
            {hintSteps.map((hint, i) => {
              const labels = ['사용 테이블', '조건/핵심', '쿼리 골격', '거의 정답'];
              return (
                <div key={i}>
                  {hintsOpen > i ? (
                    <div className="hint-box">
                      <span className="hint-num">{labels[i] || `힌트 ${i + 1}`}</span> {hint}
                    </div>
                  ) : (
                    i === hintsOpen && (
                      <button className="btn btn-ghost-sm" onClick={() => setHintsOpen(i + 1)}>
                        {labels[i] || `힌트 ${i + 1}`} 보기
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* 정답 보기 */}
          <div className="answer-section">
            {showAnswer ? (
              <div className="answer-box">
                <div className="answer-label">정답</div>
                <pre className="answer-sql">{problem.answer};</pre>
              </div>
            ) : (
              <button className="btn btn-ghost-sm" onClick={() => setShowAnswer(true)}>
                정답 보기
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽: 에디터 */}
        <div className="problem-editor-area">
          <div className={`editor-workbench ${editorMode === 'beginner' ? 'with-helper' : ''}`}>
            {editorMode === 'beginner' && (
              <SyntaxPicker onPick={pickSyntax} compact />
            )}
            <div className="editor-card">
              <EditorModeBar mode={editorMode} onModeChange={changeEditorMode} />
              {editorMode === 'beginner' && (
                <div className="editor-helper-strip">
                  문법 골격을 고른 뒤 문제 조건에 맞게 컬럼과 조건을 바꿔보세요.
                </div>
              )}
              {editorMode === 'terminal' && (
                <div className="terminal-titlebar">
                  <span>problem-sql-console</span>
                  <span>Ctrl+Enter</span>
                </div>
              )}
              <SqlEditor
                value={userSql}
                onChange={updateSql}
                height={editorMode === 'terminal' ? '260px' : '200px'}
                autocomplete={effectiveAutocomplete}
                mode={editorMode}
              />
              <div className="editor-toolbar">
                <button className="btn btn-run" onClick={execute}>
                  <Icon name="play" className="btn-icon" />
                  실행
                </button>
                <button className="btn btn-grade" onClick={grade}>
                  <Icon name="success" className="btn-icon" />
                  채점
                </button>
                <button className="btn btn-ghost-sm" onClick={handleFormat}>
                  <Icon name="format" className="status-icon" />
                  포맷
                </button>
                <button
                  className="btn btn-ghost-sm"
                  onClick={toggleAutocomplete}
                  title="자동완성 토글"
                  disabled={editorMode === 'terminal'}
                  style={{ marginLeft: 'auto' }}
                >
                  자동완성 {effectiveAutocomplete ? '✓' : '—'}
                </button>
              </div>
            </div>
          </div>

          {/* 채점 결과 */}
          {gradeResult && (
            <div className={`grade-result ${gradeResult.correct ? 'correct' : 'wrong'}`}>
              {gradeResult.correct ? (
                <>
                  <Icon name="trophy" className="grade-icon" />
                  정답입니다!
                </>
              ) : (
                <>
                  <Icon name="error" className="grade-icon" />
                  오답 — {gradeResult.msg}
                </>
              )}
              {gradeResult.checks?.length > 0 && (
                <ul className="grade-checks">
                  {gradeResult.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 실행 결과 */}
          <div className="result-card">
            <ResultTable results={results} error={error} elapsed={elapsed} />
          </div>
        </div>
      </div>
    </div>
  );
}
