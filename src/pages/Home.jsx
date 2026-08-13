import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useProgress } from '../lib/progress';
import { PROBLEMS, LEVEL_ORDER } from '../data/problems';
import { LEARN_TOPICS } from '../data/learn';
import { getTodayGoal, setTodayGoal, useStreak } from '../lib/streak';
import { useLearningProgress } from '../lib/learningProgress';
import { getRecommendedProblem, getRecommendedTopic } from '../lib/recommendations';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeLearnTopics, localizeProblems, translateLevel, translateTag } from '../lib/localizedContent';

export default function Home() {
  const { language, t } = useLanguage();
  const tl = (level) => translateLevel(level, t);
  const tt = (tag) => translateTag(tag, t);
  const streakData = useStreak();
  const [goal, setGoal] = useState(() => getTodayGoal());
  const localizedProblems = localizeProblems(PROBLEMS, language);
  const learnTopics = localizeLearnTopics(LEARN_TOPICS, language);

  const prog = useProgress();
  const learningProgress = useLearningProgress();
  const solved = PROBLEMS.filter((problem) => prog[problem.id]?.solved).length;
  const total = PROBLEMS.length;
  const attempted = PROBLEMS.filter((problem) => {
    const entry = prog[problem.id];
    return entry?.attempted || Number(entry?.attempts) > 0;
  }).length;
  const accuracy = attempted === 0 ? null : Math.round((solved / attempted) * 100);

  const recommendedProblem = getRecommendedProblem(PROBLEMS, prog);
  const todayProblem = localizedProblems.find((p) => p.id === recommendedProblem?.problem.id) || localizedProblems[0];
  const recommendedTopic = getRecommendedTopic(LEARN_TOPICS, prog, learningProgress);
  const todayTopic = learnTopics.find((topic) => topic.id === recommendedTopic?.id);

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
          <h1 className="home-title">{t('app.name')}</h1>
          <p className="home-subtitle">{t('home.hero.subtitle')}</p>
          <div className="home-hero-progress" aria-label={t('problems.complete', { solved, total })}>
            <div className="home-hero-progress-copy">
              <span>{t('home.stat.current')}</span>
              <strong>{t('problems.complete', { solved, total })}</strong>
            </div>
            <div className="home-hero-progress-track">
              <span style={{ width: `${total > 0 ? (solved / total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="home-actions">
            <Link to="/editor" className="btn btn-primary"><Icon name="keyboard" className="btn-icon" />{t('home.cta.editor')}</Link>
            <Link to="/problems" className="btn btn-secondary"><Icon name="pencil" className="btn-icon" />{t('home.cta.problems')}</Link>
            <Link to="/learn" className="btn btn-ghost"><Icon name="book" className="btn-icon" />{t('home.cta.learn')}</Link>
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
        <section className="home-card">
          <h2 className="card-title"><Icon name="chart" />{t('home.stat.current')}</h2>
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
        </section>

        {/* 오늘의 문제 */}
        <section className="home-card home-card-next">
          <h2 className="card-title"><Icon name="target" />{t('home.next.title')}</h2>
          <div className="today-problem">
            <span className="home-recommendation-reason">{t(`home.next.reason.${recommendedProblem?.reason || 'new'}`)}</span>
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
        </section>

        {/* 학습 도우미 바로가기 */}
        <section className="home-card">
          <h2 className="card-title"><Icon name="book" />{t('home.learn.title')}</h2>
          {todayTopic && (
            <Link to={`/learn/${todayTopic.id}`} className="home-learning-next">
              <span className="home-learning-next-label">{t('home.learn.next')}</span>
              <strong>{todayTopic.title}</strong>
              <small>{todayTopic.subtitle}</small>
              <span className="home-learning-next-arrow">→</span>
            </Link>
          )}
          <div className="learn-list">
            {learnTopics.map((topic) => (
              <Link key={topic.id} to={`/learn/${topic.id}`} className="learn-item">
                <span className="learn-item-title">{topic.title}</span>
                <span className="learn-item-sub">{topic.subtitle}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
