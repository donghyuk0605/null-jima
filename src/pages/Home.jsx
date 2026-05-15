import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getAllProgress } from '../lib/progress';
import { PROBLEMS, LEVEL_ORDER } from '../data/problems';
import { LEARN_TOPICS } from '../data/learn';
import { getStreak, getTodayGoal, setTodayGoal } from '../lib/streak';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeLearnTopics, localizeProblems, translateLevel, translateTag } from '../lib/localizedContent';

export default function Home() {
  const { language, t } = useLanguage();
  const tl = (level) => translateLevel(level, t);
  const tt = (tag) => translateTag(tag, t);
  const [streakData] = useState(() => getStreak());
  const [goal, setGoal] = useState(() => getTodayGoal());
  const localizedProblems = localizeProblems(PROBLEMS, language);
  const learnTopics = localizeLearnTopics(LEARN_TOPICS, language);

  const prog = getAllProgress();
  const solved = Object.values(prog).filter((p) => p.solved).length;
  const total = PROBLEMS.length;
  const accuracy = Object.values(prog).length === 0 ? null
    : Math.round((solved / Object.values(prog).length) * 100);

  const todayProblem = localizedProblems.find((p) => !prog[p.id]?.solved) || localizedProblems[0];

  const byLevel = LEVEL_ORDER.map((level) => {
    const levelProblems = PROBLEMS.filter((p) => p.level === level);
    const levelSolved = levelProblems.filter((p) => prog[p.id]?.solved).length;
    return { level, total: levelProblems.length, solved: levelSolved };
  });

  return (
    <div className="page home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <span className="home-kicker">SQL PRACTICE WORKBENCH</span>
          <h1 className="home-title">NULL지마</h1>
          <p className="home-subtitle">{t('home.hero.subtitle')}</p>
          <div className="home-actions">
            <Link to="/editor" className="btn btn-primary">{t('home.cta.editor')}</Link>
            <Link to="/problems" className="btn btn-secondary">{t('home.cta.problems')}</Link>
            <Link to="/learn" className="btn btn-ghost">{t('home.cta.learn')}</Link>
          </div>
        </div>
        <div className="home-hero-console" aria-hidden="true">
          <div className="home-console-bar">
            <span />
            <span />
            <span />
            <strong>practice.sql</strong>
          </div>
          <pre>{`SELECT department_id,
       COUNT(*) AS solved
FROM practice_log
WHERE status = 'correct'
GROUP BY department_id
ORDER BY solved DESC;`}</pre>
        </div>
      </div>

      <div className="streak-widget">
        <div className="streak-main">
          <div className="streak-fire"><Icon name="fire" className="streak-fire-icon" /></div>
          <div className="streak-info">
            <div className="streak-num">{streakData.streak}{t('home.streak.day')}</div>
            <div className="streak-label">{t('home.streak.consecutive')}</div>
          </div>
          <div className="streak-divider" />
          <div className="streak-info">
            <div className="streak-num">{streakData.longest}{t('home.streak.day')}</div>
            <div className="streak-label">{t('home.streak.longest.label')}</div>
          </div>
          <div className="streak-divider" />
          <div className="streak-info">
            <div className="streak-num">{streakData.totalDays}{t('home.streak.day')}</div>
            <div className="streak-label">{t('home.streak.total.label')}</div>
          </div>
        </div>
        <div className="streak-today">
          <span className="streak-today-label">{t('home.goal.label')}</span>
          <div className="streak-goal-bar">
            <div className="streak-goal-fill" style={{ width: `${Math.min(100, (streakData.todayCount / goal) * 100)}%` }} />
          </div>
          <span className="streak-today-count">{streakData.todayCount} / {goal}</span>
          <select className="streak-goal-select" value={goal} onChange={e => { const v = Number(e.target.value); setGoal(v); setTodayGoal(v); }}>
            {[3,5,10,15,20].map(n => <option key={n} value={n}>{t('home.goal.option', { n })}</option>)}
          </select>
        </div>
      </div>

      <div className="home-grid">
        {/* 내 현황 */}
        <div className="home-card">
          <h3 className="card-title">{t('home.stat.current')}</h3>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-value">{solved}</span>
              <span className="stat-label">{t('home.stat.solved.label')}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{total}</span>
              <span className="stat-label">{t('home.stat.total.label')}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{accuracy !== null ? `${accuracy}%` : '-'}</span>
              <span className="stat-label">{t('home.stat.accuracy.label')}</span>
            </div>
          </div>
          <div className="level-progress">
            {byLevel.map(({ level, total: tot, solved: s }) => (
              <div key={level} className="level-row">
                <span className="level-name">{tl(level)}</span>
                <div className="level-bar">
                  <div className="level-fill" style={{ width: `${tot > 0 ? (s / tot) * 100 : 0}%` }} />
                </div>
                <span className="level-count">{s}/{tot}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 문제 */}
        <div className="home-card">
          <h3 className="card-title">{t('home.next.title')}</h3>
          <div className="today-problem">
            <div className="today-meta">
              <span className={`badge level-${todayProblem.level}`}>{tl(todayProblem.level)}</span>
              {todayProblem.tags.map((tag) => (
                <span key={tag} className="tag">{tt(tag)}</span>
              ))}
            </div>
            <p className="today-title">{todayProblem.title}</p>
            <p className="today-desc">{todayProblem.description.split('\n')[0]}</p>
            <Link to={`/problems/${todayProblem.id}`} className="btn btn-primary" style={{ marginTop: 12 }}>
              {t('home.next.go')}
            </Link>
          </div>
        </div>

        {/* 학습 도우미 바로가기 */}
        <div className="home-card">
          <h3 className="card-title">{t('home.learn.title')}</h3>
          <div className="learn-list">
            {learnTopics.map((topic) => (
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
