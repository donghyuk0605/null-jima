import { Link } from 'react-router-dom';
import { PROBLEMS, LEVEL_ORDER, TAG_COLORS } from '../data/problems';
import { getAllProgress, resetProgress, getWrongProblems } from '../lib/progress';
import { useState } from 'react';
import Icon from '../components/Icon';

export default function Progress() {
  const [, forceUpdate] = useState(0);
  const prog = getAllProgress();
  const wrongIds = getWrongProblems();
  const wrongProblems = PROBLEMS.filter(p => wrongIds.includes(p.id));

  const solved = Object.values(prog).filter((p) => p.solved).length;
  const total = PROBLEMS.length;
  const tried = Object.keys(prog).length;
  const accuracy = tried === 0 ? null : Math.round((solved / tried) * 100);
  const noHintSolved = Object.entries(prog).filter(([, v]) => v.solved && v.hintsUsed === 0).length;

  const byLevel = LEVEL_ORDER.map((level) => {
    const lp = PROBLEMS.filter((p) => p.level === level);
    const ls = lp.filter((p) => prog[p.id]?.solved).length;
    return { level, total: lp.length, solved: ls };
  });

  // 태그별 집계
  const tagStats = {};
  PROBLEMS.forEach((p) => {
    p.tags.forEach((tag) => {
      if (!tagStats[tag]) tagStats[tag] = { total: 0, solved: 0 };
      tagStats[tag].total++;
      if (prog[p.id]?.solved) tagStats[tag].solved++;
    });
  });

  const handleReset = () => {
    if (window.confirm('진행 상황을 모두 초기화할까요?')) {
      resetProgress();
      forceUpdate((n) => n + 1);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">내 진행률</h2>
        <button className="btn btn-ghost-sm" onClick={handleReset} style={{ marginLeft: 'auto' }}>초기화</button>
      </div>

      {/* 전체 통계 */}
      <div className="progress-stats">
        <div className="pstat">
          <span className="pstat-value">{solved}</span>
          <span className="pstat-label">완료 문제</span>
        </div>
        <div className="pstat">
          <span className="pstat-value">{total}</span>
          <span className="pstat-label">전체 문제</span>
        </div>
        <div className="pstat">
          <span className="pstat-value">{accuracy !== null ? `${accuracy}%` : '-'}</span>
          <span className="pstat-label">정답률</span>
        </div>
        <div className="pstat">
          <span className="pstat-value">{noHintSolved}</span>
          <span className="pstat-label">힌트 없이 정답</span>
        </div>
      </div>

      {/* 난이도별 */}
      <div className="progress-section">
        <h3 className="progress-section-title">난이도별 진행률</h3>
        <div className="level-bars">
          {byLevel.map(({ level, total: t, solved: s }) => (
            <div key={level} className="lbar-row">
              <span className={`level-badge level-${level}`}>{level}</span>
              <div className="lbar-track">
                <div className="lbar-fill" style={{ width: `${t > 0 ? (s / t) * 100 : 0}%` }} />
              </div>
              <span className="lbar-count">{s} / {t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 태그별 */}
      <div className="progress-section">
        <h3 className="progress-section-title">문법별 진행률</h3>
        <div className="tag-bars">
          {Object.entries(tagStats).map(([tag, { total: t, solved: s }]) => (
            <div key={tag} className="tbar-row">
              <span className="tbar-tag" style={{ color: TAG_COLORS[tag] }}>{tag}</span>
              <div className="lbar-track">
                <div className="lbar-fill" style={{ width: `${(s / t) * 100}%`, background: TAG_COLORS[tag] }} />
              </div>
              <span className="lbar-count">{s} / {t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 문제별 현황 */}
      <div className="progress-section">
        <h3 className="progress-section-title">문제별 현황</h3>
        <div className="progress-problem-list">
          {PROBLEMS.map((p) => {
            const s = prog[p.id];
            return (
              <Link key={p.id} to={`/problems/${p.id}`} className={`progress-problem-row ${s?.solved ? 'solved' : ''}`}>
                <span className="progress-problem-num">#{p.id.toString().padStart(2, '0')}</span>
                <span className="progress-problem-title">{p.title}</span>
                <span className="progress-problem-stat">
                  {s?.solved ? (
                    <>
                      <Icon name="success" className="status-icon" />
                      {s.hintsUsed > 0 ? `힌트 ${s.hintsUsed}개` : '힌트 없음'}
                    </>
                  ) : s ? `${s.attempts}회 시도` : '-'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 오답 노트 */}
      {wrongProblems.length > 0 && (
        <section className="wrong-section">
          <h3 className="section-title">오답 노트 <span className="wrong-count">{wrongProblems.length}문제</span></h3>
          <div className="wrong-list">
            {wrongProblems.map(p => (
              <Link key={p.id} to={`/problems/${p.id}`} className="wrong-item">
                <span className="wrong-id">#{p.id}</span>
                <span className="wrong-title">{p.title}</span>
                <span className={`diff-badge diff-${p.difficulty}`}>{p.difficulty}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
