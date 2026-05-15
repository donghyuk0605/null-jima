import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CERT_LIST, SQLD_QUIZ, SQLP_QUIZ } from '../data/cert';
import Icon from '../components/Icon';

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
  const cert = CERT_LIST.find(c => c.id === certId);
  const quiz = useMemo(
    () => (certId === 'sqld' ? SQLD_QUIZ : certId === 'sqlp' ? SQLP_QUIZ : []),
    [certId]
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
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitExam(); return 0; }
        return t - 1;
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
        <p>모의고사 데이터를 찾을 수 없습니다.</p>
        <Link to={`/cert/${certId}`}>← 돌아가기</Link>
      </div>
    );
  }

  // READY SCREEN
  if (phase === 'ready') {
    return (
      <div className="exam-ready">
        <div className="exam-ready-card">
          <div className="exam-cert-badge" style={{ background: cert.color }}>{cert.name}</div>
          <h2 className="exam-ready-title">{cert.fullName} 모의고사</h2>
          <div className="exam-ready-info">
            <div><span>문제 수</span><strong>{quiz.length}문제</strong></div>
            <div><span>제한 시간</span><strong>{cert.examTime}분</strong></div>
            <div><span>합격 기준</span><strong>60점 이상</strong></div>
          </div>
          <ul className="exam-ready-rules">
            <li>시험 중에는 힌트나 답이 표시되지 않습니다.</li>
            <li>시간 종료 시 자동으로 제출됩니다.</li>
            <li>문제 옆 <Icon name="flag" style={{width:12,height:12,display:'inline'}} /> 버튼으로 나중에 다시 확인할 문제를 표시할 수 있습니다.</li>
          </ul>
          <div className="exam-ready-actions">
            <button className="btn btn-ghost-sm" onClick={() => navigate(`/cert/${certId}`)}>취소</button>
            <button className="btn btn-run" onClick={startExam}>시험 시작</button>
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
            {result.passed ? '합격' : '불합격'}
          </div>
          <div className="exam-score-circle">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={result.passed ? '#3fb950' : '#f78166'} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 52 * pct / 100} ${2 * Math.PI * 52}`}
                strokeLinecap="round" transform="rotate(-90 60 60)" />
              <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text1)">{pct}</text>
              <text x="60" y="72" textAnchor="middle" fontSize="12" fill="var(--text3)">점</text>
            </svg>
          </div>
          <div className="exam-result-stats">
            <div><span>정답</span><strong className="stat-correct">{result.correct}개</strong></div>
            <div><span>오답</span><strong className="stat-wrong">{result.wrong}개</strong></div>
            <div><span>미응답</span><strong>{result.unanswered}개</strong></div>
            <div><span>소요 시간</span><strong>{formatTime(result.timeUsed)}</strong></div>
          </div>
          <h4 className="exam-wrong-title">오답 목록</h4>
          <div className="exam-wrong-list">
            {quiz.filter(q => result.answers[q.id] !== q.answer).map(q => (
              <div key={q.id} className="exam-wrong-item">
                <div className="exam-wrong-q">Q{q.id}. {q.question}</div>
                <div className="exam-wrong-ans">
                  <span className="my-ans">내 답: {result.answers[q.id] !== undefined ? q.options[result.answers[q.id]] : '미응답'}</span>
                  <span className="correct-ans">정답: {q.options[q.answer]}</span>
                </div>
                <div className="exam-wrong-explain">{q.explanation}</div>
              </div>
            ))}
          </div>
          <div className="exam-result-actions">
            <button className="btn btn-ghost-sm" onClick={() => navigate(`/cert/${certId}`)}>← 자격증 페이지</button>
            <button className="btn btn-run" onClick={() => { setAnswers({}); setFlagged(new Set()); setCurrent(0); setPhase('ready'); }}>다시 도전</button>
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
          <span className="exam-progress-text">{current + 1} / {quiz.length}</span>
          <span className="exam-answered-text">응답 {answered}/{quiz.length}</span>
        </div>
        <div className={`exam-timer ${timerWarning ? 'timer-warning' : ''}`}>
          {formatTime(timeLeft)}
        </div>
        <button className="btn exam-submit-btn" onClick={() => { if (window.confirm('제출하시겠습니까?')) submitExam(); }}>
          제출
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
            <span className="legend-item"><span className="legend-dot answered" />응답</span>
            <span className="legend-item"><span className="legend-dot flagged" />표시</span>
          </div>
        </div>

        {/* Question */}
        <div className="exam-question-area">
          <div className="exam-q-header">
            <span className="exam-q-num">문제 {current + 1}</span>
            <span className="exam-q-meta">{q.subject} · {q.difficulty}</span>
            <button
              className={`exam-flag-btn ${flagged.has(q.id) ? 'active' : ''}`}
              onClick={() => setFlagged(prev => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
            ><Icon name="flag" style={{width:12,height:12}} /> {flagged.has(q.id) ? '표시됨' : '표시'}</button>
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
            <button className="btn btn-ghost-sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← 이전</button>
            <button className="btn btn-ghost-sm" onClick={() => setCurrent(c => Math.min(quiz.length - 1, c + 1))} disabled={current === quiz.length - 1}>다음 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
