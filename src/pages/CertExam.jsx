import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CERT_LIST, SQLD_QUIZ, SQLP_QUIZ } from '../data/cert';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeCert, localizeQuiz } from '../lib/localizedContent';

const EXAM_RESULTS_KEY = 'sqldojo_exam_results';

function saveExamResult(certId, result) {
  try {
    const all = JSON.parse(localStorage.getItem(EXAM_RESULTS_KEY) || '[]');
    all.unshift({ certId, ...result, date: new Date().toISOString() });
    localStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(all.slice(0, 10)));
  } catch {
    // Local history is optional; ignore storage failures.
  }
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function CertExam() {
  const { certId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const cert = localizeCert(CERT_LIST.find(c => c.id === certId), language);
  const quiz = useMemo(
    () => localizeQuiz(certId === 'sqld' ? SQLD_QUIZ : certId === 'sqlp' ? SQLP_QUIZ : [], language),
    [certId, language]
  );
  const totalTime = cert ? cert.examTime * 60 : 90 * 60;

  const [phase, setPhase] = useState('ready'); // 'ready' | 'exam' | 'result'
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const startExam = () => {
    setPhase('exam');
    setTimeLeft(totalTime);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const submitExam = () => {
    clearInterval(timerRef.current);
    const correct = quiz.filter(q => answers[q.id] === q.answer).length;
    const wrong = quiz.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.answer);
    const unanswered = quiz.filter(q => answers[q.id] === undefined).length;
    const score = Math.round((correct / quiz.length) * 100);
    const passed = score >= 60;
    const res = { correct, wrong: wrong.length, unanswered, score, passed, timeUsed: totalTime - timeLeft, answers: { ...answers } };
    saveExamResult(certId, res);
    setResult(res);
    setPhase('result');
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (!cert || quiz.length === 0) {
    return (
      <div className="page">
        <p>{t('exam.not.found')}</p>
        <Link to={`/cert/${certId}`}>{t('exam.back')}</Link>
      </div>
    );
  }

  // READY SCREEN
  if (phase === 'ready') {
    return (
      <div className="exam-ready">
        <div className="exam-ready-card">
          <div className="exam-cert-badge" style={{ background: cert.color }}>{cert.name}</div>
          <h2 className="exam-ready-title">{t('exam.ready.cert.title', { name: cert.fullName })}</h2>
          <div className="exam-ready-info">
            <div><span>{t('exam.ready.count')}</span><strong>{t('cert.exam.questions', { n: quiz.length })}</strong></div>
            <div><span>{t('exam.ready.time')}</span><strong>{t('cert.exam.minutes', { n: cert.examTime })}</strong></div>
            <div><span>{t('exam.ready.pass.crit')}</span><strong>{t('exam.pass.min')}</strong></div>
          </div>
          <ul className="exam-ready-rules">
            <li>{t('exam.ready.rule5')}</li>
            <li>{t('exam.ready.rule6')}</li>
            <li>{t('exam.ready.flag.before')}<Icon name="flag" style={{width:12,height:12,display:'inline'}} />{t('exam.ready.flag.after')}</li>
          </ul>
          <div className="exam-ready-actions">
            <button className="btn btn-ghost-sm" onClick={() => navigate(`/cert/${certId}`)}>{t('exam.ready.cancel')}</button>
            <button className="btn btn-run" onClick={startExam}>{t('exam.ready.begin')}</button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT SCREEN
  if (phase === 'result') {
    const pct = result.score;
    return (
      <div className="exam-result-page">
        <div className="exam-result-card">
          <div className={`exam-result-badge ${result.passed ? 'pass' : 'fail'}`}>
            {result.passed ? t('exam.result.pass') : t('exam.result.fail')}
          </div>
          <div className="exam-score-circle">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={result.passed ? '#3fb950' : '#f78166'} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 52 * pct / 100} ${2 * Math.PI * 52}`}
                strokeLinecap="round" transform="rotate(-90 60 60)" />
              <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text1)">{pct}</text>
              <text x="60" y="72" textAnchor="middle" fontSize="12" fill="var(--text3)">{t('exam.result.score')}</text>
            </svg>
          </div>
          <div className="exam-result-stats">
            <div><span>{t('exam.stat.correct')}</span><strong className="stat-correct">{result.correct}{t('exam.stat.suffix')}</strong></div>
            <div><span>{t('exam.stat.wrong')}</span><strong className="stat-wrong">{result.wrong}{t('exam.stat.suffix')}</strong></div>
            <div><span>{t('exam.stat.unanswered')}</span><strong>{result.unanswered}{t('exam.stat.suffix')}</strong></div>
            <div><span>{t('exam.stat.time')}</span><strong>{formatTime(result.timeUsed)}</strong></div>
          </div>
          <h4 className="exam-wrong-title">{t('exam.result.wrongList')}</h4>
          <div className="exam-wrong-list">
            {quiz.filter(q => result.answers[q.id] !== q.answer).map(q => (
              <div key={q.id} className="exam-wrong-item">
                <div className="exam-wrong-q">Q{q.id}. {q.question}</div>
                <div className="exam-wrong-ans">
                  <span className="my-ans">{t('exam.my.answer')} {result.answers[q.id] !== undefined ? q.options[result.answers[q.id]] : t('exam.no.answer')}</span>
                  <span className="correct-ans">{t('exam.correct.answer.label')} {q.options[q.answer]}</span>
                </div>
                <div className="exam-wrong-explain">{q.explanation}</div>
              </div>
            ))}
          </div>
          <div className="exam-result-actions">
            <button className="btn btn-ghost-sm" onClick={() => navigate(`/cert/${certId}`)}>{t('exam.cert.back')}</button>
            <button className="btn btn-run" onClick={() => { setAnswers({}); setFlagged(new Set()); setCurrent(0); setPhase('ready'); }}>{t('exam.retry')}</button>
          </div>
        </div>
      </div>
    );
  }

  // EXAM SCREEN
  const q = quiz[current];
  const answered = Object.keys(answers).length;
  const timerWarning = timeLeft < 300;

  return (
    <div className="exam-page">
      {/* Header */}
      <div className="exam-header">
        <div className="exam-header-left">
          <span className="exam-cert-tag" style={{ background: cert.color }}>{cert.name}</span>
          <span className="exam-progress-text">{t('cert.quiz.progress', { current: current + 1, total: quiz.length })}</span>
          <span className="exam-answered-text">{t('exam.q.answered', { answered, total: quiz.length })}</span>
        </div>
        <div className={`exam-timer ${timerWarning ? 'timer-warning' : ''}`}>
          {formatTime(timeLeft)}
        </div>
        <button className="btn exam-submit-btn" onClick={() => { if (window.confirm(t('exam.submit.confirm'))) submitExam(); }}>
          {t('exam.submit')}
        </button>
      </div>

      <div className="exam-body">
        {/* Question nav sidebar */}
        <div className="exam-nav">
          <div className="exam-nav-grid">
            {quiz.map((_, i) => (
              <button
                key={i}
                className={`exam-nav-btn ${i === current ? 'current' : ''} ${answers[quiz[i].id] !== undefined ? 'answered' : ''} ${flagged.has(quiz[i].id) ? 'flagged' : ''}`}
                onClick={() => setCurrent(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="exam-nav-legend">
            <span className="legend-item"><span className="legend-dot answered" />{t('exam.legend.answered')}</span>
            <span className="legend-item"><span className="legend-dot flagged" />{t('exam.legend.flagged')}</span>
          </div>
        </div>

        {/* Question */}
        <div className="exam-question-area">
          <div className="exam-q-header">
            <span className="exam-q-num">{t('exam.q.num', { n: current + 1 })}</span>
            <span className="exam-q-meta">{q.subject} · {q.difficulty}</span>
            <button
              className={`exam-flag-btn ${flagged.has(q.id) ? 'active' : ''}`}
              onClick={() => setFlagged(prev => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
            ><Icon name="flag" style={{width:12,height:12}} /> {flagged.has(q.id) ? t('exam.flagged') : t('exam.flag')}</button>
          </div>
          <div className="exam-q-text">{q.question}</div>
          <div className="exam-options">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                className={`exam-option ${answers[q.id] === oi ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
              >
                <span className="option-num">{oi + 1}</span>
                <span className="option-text">{opt}</span>
              </button>
            ))}
          </div>
          <div className="exam-q-nav">
            <button className="btn btn-ghost-sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← {t('exam.prev')}</button>
            <button className="btn btn-ghost-sm" onClick={() => setCurrent(c => Math.min(quiz.length - 1, c + 1))} disabled={current === quiz.length - 1}>{t('exam.next')} →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
