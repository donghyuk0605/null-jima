import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getAllProgress } from '../lib/progress';
import { PROBLEMS, LEVEL_ORDER } from '../data/problems';
import { LEARN_TOPICS } from '../data/learn';
import { getStreak, getTodayGoal, setTodayGoal } from '../lib/streak';

export default function Home() {
  const [streakData] = useState(() => getStreak());
  const [goal, setGoal] = useState(() => getTodayGoal());

  const prog = getAllProgress();
  const solved = Object.values(prog).filter((p) => p.solved).length;
  const total = PROBLEMS.length;
  const accuracy = Object.values(prog).length === 0 ? null
    : Math.round((solved / Object.values(prog).length) * 100);

  const todayProblem = PROBLEMS.find((p) => !prog[p.id]?.solved) || PROBLEMS[0];

  const byLevel = LEVEL_ORDER.map((level) => {
    const levelProblems = PROBLEMS.filter((p) => p.level === level);
    const levelSolved = levelProblems.filter((p) => prog[p.id]?.solved).length;
    return { level, total: levelProblems.length, solved: levelSolved };
  });

  return (
    <div className="page home-page">
      <div className="home-hero">
        <h1 className="home-title">NULL지마</h1>
        <p className="home-subtitle">실무 데이터로 배우는 SQL 연습장</p>
        <div className="home-actions">
          <Link to="/playground" className="btn btn-primary">자유 연습 시작</Link>
          <Link to="/problems" className="btn btn-secondary">문제 풀기</Link>
          <Link to="/learn" className="btn btn-ghost">학습 도우미</Link>
        </div>
      </div>

      <div className="streak-widget">
        <div className="streak-main">
          <div className="streak-fire">🔥</div>
          <div className="streak-info">
            <div className="streak-num">{streakData.streak}일</div>
            <div className="streak-label">연속 학습</div>
          </div>
          <div className="streak-divider" />
          <div className="streak-info">
            <div className="streak-num">{streakData.longest}일</div>
            <div className="streak-label">최장 기록</div>
          </div>
          <div className="streak-divider" />
          <div className="streak-info">
            <div className="streak-num">{streakData.totalDays}일</div>
            <div className="streak-label">총 학습일</div>
          </div>
        </div>
        <div className="streak-today">
          <span className="streak-today-label">오늘 목표</span>
          <div className="streak-goal-bar">
            <div className="streak-goal-fill" style={{ width: `${Math.min(100, (streakData.todayCount / goal) * 100)}%` }} />
          </div>
          <span className="streak-today-count">{streakData.todayCount} / {goal}</span>
          <select className="streak-goal-select" value={goal} onChange={e => { const v = Number(e.target.value); setGoal(v); setTodayGoal(v); }}>
            {[3,5,10,15,20].map(n => <option key={n} value={n}>{n}개</option>)}
          </select>
        </div>
      </div>

      <div className="home-grid">
        {/* 내 현황 */}
        <div className="home-card">
          <h3 className="card-title">내 현황</h3>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-value">{solved}</span>
              <span className="stat-label">완료 문제</span>
            </div>
            <div className="stat">
              <span className="stat-value">{total}</span>
              <span className="stat-label">전체 문제</span>
            </div>
            <div className="stat">
              <span className="stat-value">{accuracy !== null ? `${accuracy}%` : '-'}</span>
              <span className="stat-label">정답률</span>
            </div>
          </div>
          <div className="level-progress">
            {byLevel.map(({ level, total: t, solved: s }) => (
              <div key={level} className="level-row">
                <span className="level-name">{level}</span>
                <div className="level-bar">
                  <div className="level-fill" style={{ width: `${t > 0 ? (s / t) * 100 : 0}%` }} />
                </div>
                <span className="level-count">{s}/{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 문제 */}
        <div className="home-card">
          <h3 className="card-title">다음 문제</h3>
          <div className="today-problem">
            <div className="today-meta">
              <span className={`badge level-${todayProblem.level}`}>{todayProblem.level}</span>
              {todayProblem.tags.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
            <p className="today-title">{todayProblem.title}</p>
            <p className="today-desc">{todayProblem.description.split('\n')[0]}</p>
            <Link to={`/problems/${todayProblem.id}`} className="btn btn-primary" style={{ marginTop: 12 }}>
              문제 풀러가기 →
            </Link>
          </div>
        </div>

        {/* 학습 도우미 바로가기 */}
        <div className="home-card">
          <h3 className="card-title">학습 도우미</h3>
          <div className="learn-list">
            {LEARN_TOPICS.map((topic) => (
              <Link key={topic.id} to={`/learn/${topic.id}`} className="learn-item">
                <span className="learn-item-title">{topic.title}</span>
                <span className="learn-item-sub">{topic.subtitle}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
