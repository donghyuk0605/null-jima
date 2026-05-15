import { useParams, Link } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { PROBLEMS, TAG_COLORS } from '../data/problems';
import { runQuery, gradeQuery, translateSqlError } from '../lib/database';
import { recordActivity } from '../lib/streak';
import {
  getProblemProgress,
  recordAttempt,
  saveProblemDraft,
  toggleFavorite,
  toggleReview,
  toggleFavoriteById,
  isFavorite,
  markAttempted,
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
  const [hintsShown, setHintsShown] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [favorited, setFavorited] = useState(() => isFavorite(problem.id));
  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [mobilePanel, setMobilePanel] = useState('write');
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const timerRef = useRef(null);
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
    if (result.correct) {
      recordActivity('problem');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; setTimerActive(false); }
    } else {
      markAttempted(problem.id);
    }
  }, [userSql, problem, hintsOpen, execute]);

  const toggleTimer = () => {
    if (timerActive) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setTimerActive(false);
    } else {
      setTimerSecs(0);
      setTimerActive(true);
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000);
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

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
  const attemptCount = progress?.attempts || 0;
  const openedHintCount = Math.min(hintsOpen, hintSteps.length);
  const resultRowCount = results?.[0]?.values?.length ?? 0;

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

      <div className="problem-mobile-tabs">
        {[
          ['info', '문제'],
          ['write', '작성'],
          ['result', '결과'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`problem-mobile-tab ${mobilePanel === key ? 'active' : ''}`}
            onClick={() => setMobilePanel(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="problem-layout">
        {/* 왼쪽: 문제 정보 */}
        <div className={`problem-info problem-panel ${mobilePanel === 'info' ? 'mobile-active' : ''}`}>
          <div className="problem-panel-head">
            <span>문제</span>
            <strong>{problem.id}</strong>
          </div>
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

          <div className="problem-title-row">
            <h2 className="problem-title">{problem.title}</h2>
            <button
              className={`fav-btn ${favorited ? 'fav-active' : ''}`}
              onClick={() => { const next = toggleFavoriteById(problem.id); setFavorited(next.includes(Number(problem.id))); }}
              title="즐겨찾기"
            >
              <Icon name="star" className="fav-icon" />
            </button>
          </div>
          <p className="problem-desc">{problem.description}</p>

          {problem.hints && problem.hints.length > 0 && (
            <div className="hint-section">
              <div className="hint-header">
                <span className="hint-title">힌트</span>
                {hintsShown < problem.hints.length && (
                  <button className="hint-btn" onClick={() => setHintsShown(h => h + 1)}>
                    힌트 보기 ({hintsShown}/{problem.hints.length})
                  </button>
                )}
                {hintsShown > 0 && (
                  <button className="hint-reset" onClick={() => setHintsShown(0)}>초기화</button>
                )}
              </div>
              {problem.hints.slice(0, hintsShown).map((hint, i) => (
                <div key={i} className="hint-item">
                  <span className="hint-num">힌트 {i + 1}</span>
                  <span className="hint-text">{hint}</span>
                </div>
              ))}
            </div>
          )}

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
        <div className={`problem-editor-area problem-panel ${mobilePanel === 'write' ? 'mobile-active' : ''}`}>
          <div className="problem-panel-head">
            <span>SQL 작성</span>
            <strong>{editorMode === 'terminal' ? '고급' : editorMode === 'beginner' ? '초급' : '중급'}</strong>
          </div>
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
                onRun={execute}
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
                  className={`btn btn-ghost-sm ${timerActive ? 'btn-active' : ''}`}
                  onClick={toggleTimer}
                  title="타이머 시작/정지"
                >
                  <><Icon name="timer" style={{width:13,height:13}} /> {timerActive ? formatTimer(timerSecs) : '타이머'}</>
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
        </div>

        <aside className={`problem-feedback-panel problem-panel ${mobilePanel === 'result' ? 'mobile-active' : ''}`}>
          <div className="problem-panel-head">
            <span>결과와 피드백</span>
            <strong>{gradeResult ? (gradeResult.correct ? '정답' : '확인 필요') : '대기'}</strong>
          </div>

          <div className="problem-quick-stats">
            <div>
              <span>시도</span>
              <strong>{attemptCount}</strong>
            </div>
            <div>
              <span>힌트</span>
              <strong>{openedHintCount}</strong>
            </div>
            <div>
              <span>결과</span>
              <strong>{resultRowCount}행</strong>
            </div>
            {timerSecs > 0 && (
              <div>
                <span>경과</span>
                <strong style={{ color: timerActive ? 'var(--accent)' : 'var(--fg-muted)' }}>{formatTimer(timerSecs)}</strong>
              </div>
            )}
          </div>

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

          <div className="result-card">
            <ResultTable results={results} error={error} elapsed={elapsed} />
          </div>
        </aside>
      </div>
    </div>
  );
}
