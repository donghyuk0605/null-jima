import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PROBLEMS, LEVEL_ORDER, TAG_COLORS } from '../data/problems';
import { getAllProgress, getFavorites, toggleFavoriteById } from '../lib/progress';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeProblems, translateLevel, translateTag } from '../lib/localizedContent';

export default function Problems() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const tl = (level) => translateLevel(level, t);
  const tt = (tag) => translateTag(tag, t);
  const prog = getAllProgress();
  const localizedProblems = localizeProblems(PROBLEMS, language);
  const [levelFilter, setLevelFilter] = useState('전체');
  const [tagFilter, setTagFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const tags = [...new Set(PROBLEMS.flatMap((problem) => problem.tags))];

  const filteredProblems = localizedProblems.filter((problem) => {
    const status = prog[problem.id];
    const matchesLevel = levelFilter === '전체' || problem.level === levelFilter;
    const matchesTag = tagFilter === '전체' || problem.tags.includes(tagFilter);
    const matchesStatus =
      statusFilter === '전체' ||
      (statusFilter === '즐겨찾기' && status?.favorite) ||
      (statusFilter === '다시 풀기' && status?.review) ||
      (statusFilter === '미완료' && !status?.solved);
    const matchesFavs = !showFavsOnly || favorites.includes(problem.id);
    return matchesLevel && matchesTag && matchesStatus && matchesFavs;
  });

  const goRandomProblem = () => {
    const pool = filteredProblems.length > 0 ? filteredProblems : localizedProblems;
    const next = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/problems/${next.id}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{t('problems.title')}</h2>
        <span className="page-desc">{t('problems.desc')}</span>
      </div>

      <div className="problem-controls">
        <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
          <option value="전체">{t('problems.filter.all')}</option>
          {LEVEL_ORDER.map((level) => <option key={level} value={level}>{tl(level)}</option>)}
        </select>
        <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
          <option value="전체">{t('problems.filter.all')}</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tt(tag)}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="전체">{t('problems.filter.all')}</option>
          <option value="미완료">{t('problems.status.new')}</option>
          <option value="즐겨찾기">{t('problems.status.fav')}</option>
          <option value="다시 풀기">{t('problems.status.review')}</option>
        </select>
        <button
          className={`btn ${showFavsOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFavsOnly(v => !v)}
        >
          <Icon name="star" className="status-icon" />
          {t('problems.filter.favsOnly')}
        </button>
        <button className="btn btn-secondary" onClick={goRandomProblem}>
          <Icon name="shuffle" className="status-icon" />
          {t('problems.random')}
        </button>
      </div>

      {LEVEL_ORDER.map((level) => {
        const levelProblems = filteredProblems.filter((p) => p.level === level);
        if (levelProblems.length === 0) return null;
        const solved = levelProblems.filter((p) => prog[p.id]?.solved).length;
        return (
          <div key={level} className="problem-level-group">
            <div className="level-group-header">
              <span className={`level-badge level-${level}`}>{tl(level)}</span>
              <span className="level-group-count">{t('problems.complete', { solved, total: levelProblems.length })}</span>
            </div>
            <div className="problem-list">
              {levelProblems.map((problem) => {
                const status = prog[problem.id];
                const isSolved = status?.solved;
                return (
                  <Link key={problem.id} to={`/problems/${problem.id}`} className={`problem-row ${isSolved ? 'solved' : ''}`}>
                    <button
                      className={`fav-btn${favorites.includes(problem.id) ? ' fav-active' : ''}`}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFavorites(toggleFavoriteById(problem.id)); }}
                      title={t('problem.action.fav')}
                    >
                      <Icon name="star" className="fav-icon" />
                    </button>
                    <span className="problem-num">#{problem.id.toString().padStart(2, '0')}</span>
                    <span className="problem-name">{problem.title}</span>
                    <div className="problem-tags">
                      {problem.tags.map((tag) => (
                        <span key={tag} className="tag" style={{ background: TAG_COLORS[tag] + '22', color: TAG_COLORS[tag], border: `1px solid ${TAG_COLORS[tag]}44` }}>
                          {tt(tag)}
                        </span>
                      ))}
                    </div>
                    <span className={`problem-status ${isSolved ? 'status-solved' : status ? 'status-tried' : ''}`}>
                      {isSolved ? (
                        <>
                          <Icon name="success" className="status-icon" />
                          {t('problems.status.solved')}
                        </>
                      ) : status?.review ? t('problems.status.review') : status?.favorite ? t('problems.status.fav') : status ? t('problems.status.attempts', { n: status.attempts }) : t('problems.status.new')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
