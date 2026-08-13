import { useParams, Link } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { PROBLEMS, TAG_COLORS } from '../data/problems';
import { runProblemQuery, gradeQuery, translateSqlError } from '../lib/database';
import { recordActivity } from '../lib/streak';
import {
  getProblemProgress,
  recordAttempt,
  saveProblemDraft,
  toggleFavorite,
  toggleReview,
  markAttempted,
} from '../lib/progress';
import { formatSql } from '../lib/sqlFormatter';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import { getStoredEditorMode, saveStoredEditorMode } from '../lib/editorModes';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { localizeProblems, translateLevel, translateTag } from '../lib/localizedContent';
import { useUserSettings } from '../lib/userSettings';

const AC_KEY = 'sqldojo_ac';

const buildHintSteps = (problem, t) => [
  t('problem.hint.tables', { tables: problem.tables.join(', ') }),
  problem.hints[0] || problem.description,
  problem.hints[1] || t('problem.hint.skeleton'),
  problem.hints[2] || `${problem.answer};`,
];

export default function ProblemDetail() {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const { user, isGuest } = useAuth();
  const localizedProblems = localizeProblems(PROBLEMS, language);
  const problem = localizedProblems.find((p) => p.id === Number(id));

  if (!problem) return <div className="page"><p>{t('problem.notFound')}</p></div>;

  const accountKey = user?.uid || (isGuest ? 'guest' : 'anonymous');
  return <ProblemDetailContent key={`${accountKey}-${problem.id}`} problem={problem} />;
}

function ProblemDetailContent({ problem }) {
  const { t } = useLanguage();
  const settings = useUserSettings();
  const tl = (level) => translateLevel(level, t);
  const tt = (tag) => translateTag(tag, t);
  const [progress, setProgress] = useState(() => getProblemProgress(problem.id));
  const [userSql, setUserSql] = useState(() => progress.draftSql || `${t('problem.editor.placeholder')}\n`);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [gradeResult, setGradeResult] = useState(null);
  const [hintsOpen, setHintsOpen] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [mobilePanel, setMobilePanel] = useState('info');
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
      const res = runProblemQuery(userSql.trim());
      setElapsed(Math.round(performance.now() - start));
      setResults(res);
    } catch (e) {
      setElapsed(null);
      setError(translateSqlError(e, t));
      setResults(null);
    }
  }, [userSql, problem, t]);

  const grade = useCallback(() => {
    if (!problem) return;
    execute();
    const result = gradeQuery(userSql.trim(), problem.answer, problem.checkOrder, {
      strictColumns: problem.strictColumns,
      requiredTags: problem.tags,
      requiredTables: problem.tables,
      featureLabels: Object.fromEntries(problem.tags.map((tag) => [tag, tt(tag)])),
    }, t);
    setGradeResult(result);
    const updated = recordAttempt(problem.id, result.correct, hintsOpen);
    setProgress(updated);
    if (result.correct) {
      recordActivity('problem');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; setTimerActive(false); }
    } else {
      markAttempted(problem.id);
    }
    setMobilePanel('result');
  }, [userSql, problem, hintsOpen, execute, t]);

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
      if (settings.autoSaveSql) {
        const updated = saveProblemDraft(problem.id, value);
        setProgress(updated);
      }
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

  const problemIndex = PROBLEMS.findIndex((p) => p.id === problem.id);
  const prevP = PROBLEMS[problemIndex - 1];
  const nextP = PROBLEMS[problemIndex + 1];
  const hintSteps = buildHintSteps(problem, t);
  const effectiveAutocomplete = editorMode !== 'terminal' && autocomplete;
  const attemptCount = progress?.attempts || 0;
  const openedHintCount = Math.min(hintsOpen, hintSteps.length);
  const resultRowCount = results?.[0]?.values?.length ?? 0;

  return (
    <div className="page problem-detail-page">
      {/* 상단 네비 */}
      <div className="problem-nav">
        <Link to="/problems" className="btn btn-ghost-sm"><Icon name="chevron-left" />{t('problem.nav.list')}</Link>
        <div className="problem-nav-pages">
          {prevP && <Link to={`/problems/${prevP.id}`} className="btn btn-ghost-sm"><Icon name="chevron-left" />{t('problem.nav.prev')}</Link>}
          {nextP && <Link to={`/problems/${nextP.id}`} className="btn btn-ghost-sm">{t('problem.nav.next')}<Icon name="chevron-right" /></Link>}
        </div>
      </div>

      <div className="problem-mobile-tabs">
        {[
          ['info', t('problem.tab.info')],
          ['write', t('problem.tab.write')],
          ['result', t('problem.tab.result')],
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
            <span>{t('problem.panel.info')}</span>
            <strong>{problem.id}</strong>
          </div>
          <div className="problem-meta">
            <span className={`badge level-${problem.level}`}>{tl(problem.level)}</span>
            {problem.tags.map((tag) => (
              <span key={tag} className="tag" style={{ background: TAG_COLORS[tag] + '22', color: TAG_COLORS[tag], border: `1px solid ${TAG_COLORS[tag]}44` }}>{tt(tag)}</span>
            ))}
            {progress?.solved && (
              <span className="solved-badge">
                <Icon name="success" className="status-icon" />
                {t('problem.status.solved')}
              </span>
            )}
            {progress?.favorite && <span className="review-badge">{t('problem.status.fav')}</span>}
            {progress?.review && <span className="review-badge">{t('problem.status.review')}</span>}
          </div>

          <div className="problem-title-row">
            <h2 className="problem-title">{problem.title}</h2>
            <button
                className={`fav-btn ${progress?.favorite ? 'fav-active' : ''}`}
                onClick={handleFavorite}
                title={t('problem.favorite.title')}
                aria-pressed={Boolean(progress?.favorite)}
            >
              <Icon name="star" className="fav-icon" />
            </button>
          </div>
          <p className="problem-desc">{problem.description}</p>

          <div className="problem-tables">
            <div className="ptables-label">{t('problem.tables.label')}</div>
            {problem.tables.map((tbl) => (
              <span key={tbl} className="table-chip">{tbl}</span>
            ))}
          </div>

          <div className="problem-side-actions">
            <button className="btn btn-ghost-sm" onClick={handleReview}>
              {progress?.review ? t('problem.action.unreview') : t('problem.action.review')}
            </button>
          </div>

          {/* 힌트 */}
          {settings.showLearningHints && <div className="hints-section">
            <div className="hints-label">{t('problem.hints.label')}</div>
            {hintSteps.map((hint, i) => {
              const labels = [t('problem.hint.step.1'), t('problem.hint.step.2'), t('problem.hint.step.3'), t('problem.hint.step.4')];
              return (
                <div key={i}>
                  {hintsOpen > i ? (
                    <div className="hint-box">
                      <span className="hint-num">{labels[i] || `${t('problem.hint.title')} ${i + 1}`}</span> {hint}
                    </div>
                  ) : (
                    i === hintsOpen && (
                      <button className="btn btn-ghost-sm" onClick={() => setHintsOpen(i + 1)}>
                        {t('problem.hints.showStep', { label: labels[i] || `${t('problem.hint.title')} ${i + 1}` })}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>}

          {/* 정답 보기 */}
          <div className="answer-section">
            {showAnswer ? (
              <div className="answer-box">
                <div className="answer-label">{t('problem.answer.label')}</div>
                <pre className="answer-sql">{problem.displayAnswer || problem.answer};</pre>
              </div>
            ) : (
              <button className="btn btn-ghost-sm" onClick={() => setShowAnswer(true)}>
                {t('problem.answer.show')}
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽: 에디터 */}
        <div className={`problem-editor-area problem-panel ${mobilePanel === 'write' ? 'mobile-active' : ''}`}>
          <div className="problem-panel-head">
            <span>{t('problem.panel.write')}</span>
            <strong>{editorMode === 'terminal' ? t('problem.panel.writeMode.terminal') : editorMode === 'beginner' ? t('problem.panel.writeMode.beginner') : t('problem.panel.writeMode.comfort')}</strong>
          </div>
          <div className={`editor-workbench ${editorMode === 'beginner' ? 'with-helper' : ''}`}>
            {editorMode === 'beginner' && (
              <SyntaxPicker onPick={pickSyntax} compact />
            )}
            <div className="editor-card">
              <EditorModeBar mode={editorMode} onModeChange={changeEditorMode} />
              {editorMode === 'beginner' && (
                <div className="editor-helper-strip">
                  {t('problem.helper.beginner')}
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
                height={editorMode === 'terminal' ? '360px' : '320px'}
                autocomplete={effectiveAutocomplete}
                mode={editorMode}
                fontSize={settings.editorFontSize}
              />
              <div className="editor-toolbar">
                <button className="btn btn-run" onClick={execute}>
                  <Icon name="play" className="btn-icon" />
                  {t('problem.run')}
                </button>
                <button className="btn btn-grade" onClick={grade}>
                  <Icon name="success" className="btn-icon" />
                  {t('problem.grade')}
                </button>
                <button className="btn btn-ghost-sm" onClick={handleFormat}>
                  <Icon name="format" className="status-icon" />
                  {t('problem.format')}
                </button>
                <button
                  className={`btn btn-ghost-sm ${timerActive ? 'btn-active' : ''}`}
                  onClick={toggleTimer}
                  title={t('problem.timer.toggle')}
                >
                  <><Icon name="timer" style={{width:13,height:13}} /> {timerActive ? formatTimer(timerSecs) : t('problem.timer')}</>
                </button>
                <button
                  className="btn btn-ghost-sm"
                  onClick={toggleAutocomplete}
                  title={t('problem.autocomplete.toggle')}
                  disabled={editorMode === 'terminal'}
                  style={{ marginLeft: 'auto' }}
                >
                  {effectiveAutocomplete ? t('problem.autocomplete.on') : t('problem.autocomplete.off')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className={`problem-feedback-panel problem-panel ${mobilePanel === 'result' ? 'mobile-active' : ''}`}>
          <div className="problem-panel-head">
            <span>{t('problem.panel.feedback')}</span>
            <strong>{gradeResult ? (gradeResult.correct ? t('problem.panel.feedback.correct') : t('problem.panel.feedback.wrong')) : t('problem.panel.feedback.waiting')}</strong>
          </div>

          <div className="problem-quick-stats">
            <div>
              <span>{t('problem.stat.attempts')}</span>
              <strong>{attemptCount}</strong>
            </div>
            <div>
              <span>{t('problem.stat.hints')}</span>
              <strong>{openedHintCount}</strong>
            </div>
            <div>
              <span>{t('problem.stat.rows')}</span>
              <strong>{t('problem.stat.rows.count', { n: resultRowCount })}</strong>
            </div>
            {timerSecs > 0 && (
              <div>
                <span>{t('problem.stat.elapsed')}</span>
                <strong style={{ color: timerActive ? 'var(--accent)' : 'var(--fg-muted)' }}>{formatTimer(timerSecs)}</strong>
              </div>
            )}
          </div>

          {gradeResult && (
            <div className={`grade-result ${gradeResult.correct ? 'correct' : 'wrong'}`}>
              {gradeResult.correct ? (
                <>
                  <Icon name="trophy" className="grade-icon" />
                  {t('problem.grade.correct')}
                </>
              ) : (
                <>
                  <Icon name="error" className="grade-icon" />
                  {t('problem.grade.wrong')} — {gradeResult.msg}
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
