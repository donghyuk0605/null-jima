import { Link } from 'react-router-dom';
import { PROBLEMS, LEVEL_ORDER, TAG_COLORS } from '../data/problems';
import { getAllProgress, resetProgress, getWrongProblems } from '../lib/progress';
import { useState } from 'react';
import Icon from '../components/Icon';
import { getHeatmapData, getStreak } from '../lib/streak';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeProblems, translateLevel, translateTag } from '../lib/localizedContent';

function HeatmapChart({ data, t }) {
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= maxCount * 0.25) return 1;
    if (count <= maxCount * 0.5) return 2;
    if (count <= maxCount * 0.75) return 3;
    return 4;
  };

  const DAYS = t('progress.days.str').split('');
  const months = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.find(d => d);
    if (firstDay) {
      const m = new Date(firstDay.date).getMonth();
      if (m !== lastMonth) { months.push({ wi, label: t('progress.month.label', { n: m + 1 }) }); lastMonth = m; }
    }
  });

  return (
    <div className="heatmap-container">
      <div className="heatmap-months">
        {months.map(m => <span key={m.wi} style={{ gridColumnStart: m.wi + 1 }}>{m.label}</span>)}
      </div>
      <div className="heatmap-rows">
        <div className="heatmap-day-labels">
          {DAYS.map((d, i) => <span key={i} className={i % 2 === 1 ? 'visible' : ''}>{d}</span>)}
        </div>
        <div className="heatmap-cells">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`heatmap-cell level-${getLevel(day.count)}`}
                  title={t('progress.activity.tooltip', { date: day.date, count: day.count })}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Progress() {
  const { language, t } = useLanguage();
  const [, forceUpdate] = useState(0);
  const localizedProblems = localizeProblems(PROBLEMS, language);
  const heatmap = getHeatmapData(17);
  const streak = getStreak();
  const prog = getAllProgress();
  const wrongIds = getWrongProblems();
  const wrongProblems = localizedProblems.filter(p => wrongIds.includes(p.id));

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
    if (window.confirm(t('progress.reset.confirm'))) {
      resetProgress();
      forceUpdate((n) => n + 1);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{t('progress.title')}</h2>
        <button className="btn btn-ghost-sm" onClick={handleReset} style={{ marginLeft: 'auto' }}>{t('progress.reset')}</button>
      </div>

      <section className="heatmap-section">
        <div className="heatmap-header">
          <h3 className="section-title">{t('progress.section.activity')}</h3>
          <div className="heatmap-stats">
            <span><><Icon name="fire" style={{width:14,height:14}} /> {t('home.streak.days', { n: streak.streak })}</></span>
            <span>{t('home.streak.longest', { n: streak.longest })}</span>
            <span>{t('home.streak.total', { n: streak.totalDays })}</span>
          </div>
        </div>
        <div className="heatmap-wrap">
          <div className="heatmap-grid">
            {/* Month labels */}
            <HeatmapChart data={heatmap} t={t} />
          </div>
          <div className="heatmap-legend">
            <span className="legend-label">{t('progress.legend.less')}</span>
            {[0,1,2,3,4].map(l => <div key={l} className={`heatmap-cell legend-cell level-${l}`} />)}
            <span className="legend-label">{t('progress.legend.more')}</span>
          </div>
        </div>
      </section>

      {/* 전체 통계 */}
      <div className="progress-stats">
        <div className="pstat">
          <span className="pstat-value">{solved}</span>
          <span className="pstat-label">{t('progress.stats.solved')}</span>
        </div>
        <div className="pstat">
          <span className="pstat-value">{total}</span>
          <span className="pstat-label">{t('progress.stat.total')}</span>
        </div>
        <div className="pstat">
          <span className="pstat-value">{accuracy !== null ? `${accuracy}%` : '-'}</span>
          <span className="pstat-label">{t('progress.stats.accuracy')}</span>
        </div>
        <div className="pstat">
          <span className="pstat-value">{noHintSolved}</span>
          <span className="pstat-label">{t('progress.stat.nohint')}</span>
        </div>
      </div>

      {/* 난이도별 */}
      <div className="progress-section">
        <h3 className="progress-section-title">{t('progress.level.title')}</h3>
        <div className="level-bars">
          {byLevel.map(({ level, total: tot, solved: sol }) => (
            <div key={level} className="lbar-row">
              <span className={`level-badge level-${level}`}>{translateLevel(level, t)}</span>
              <div className="lbar-track">
                <div className="lbar-fill" style={{ width: `${tot > 0 ? (sol / tot) * 100 : 0}%` }} />
              </div>
              <span className="lbar-count">{sol} / {tot}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 태그별 */}
      <div className="progress-section">
        <h3 className="progress-section-title">{t('progress.grammar.title')}</h3>
        <div className="tag-bars">
          {Object.entries(tagStats).map(([tag, { total: tot, solved: sol }]) => (
            <div key={tag} className="tbar-row">
              <span className="tbar-tag" style={{ color: TAG_COLORS[tag] }}>{translateTag(tag, t)}</span>
              <div className="lbar-track">
                <div className="lbar-fill" style={{ width: `${(sol / tot) * 100}%`, background: TAG_COLORS[tag] }} />
              </div>
              <span className="lbar-count">{sol} / {tot}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 문제별 현황 */}
      <div className="progress-section">
        <h3 className="progress-section-title">{t('progress.problems.title')}</h3>
        <div className="progress-problem-list">
          {localizedProblems.map((p) => {
            const s = prog[p.id];
            return (
              <Link key={p.id} to={`/problems/${p.id}`} className={`progress-problem-row ${s?.solved ? 'solved' : ''}`}>
                <span className="progress-problem-num">#{p.id.toString().padStart(2, '0')}</span>
                <span className="progress-problem-title">{p.title}</span>
                <span className="progress-problem-stat">
                  {s?.solved ? (
                    <>
                      <Icon name="success" className="status-icon" />
                      {s.hintsUsed > 0 ? t('progress.hint.count', { n: s.hintsUsed }) : t('progress.hint.none')}
                    </>
                  ) : s ? t('progress.tried.count', { n: s.attempts }) : '-'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 오답 노트 */}
      {wrongProblems.length > 0 && (
        <section className="wrong-section">
          <h3 className="section-title">{t('progress.wrong.title')} <span className="wrong-count">{t('progress.wrong.count', { n: wrongProblems.length })}</span></h3>
          <div className="wrong-list">
            {wrongProblems.map(p => (
              <Link key={p.id} to={`/problems/${p.id}`} className="wrong-item">
                <span className="wrong-id">#{p.id}</span>
                <span className="wrong-title">{p.title}</span>
                <span className={`diff-badge diff-${p.level}`}>{translateLevel(p.level, t)}</span>
                <span className="wrong-link">{t('progress.wrong.link')}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
