import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PROBLEMS, LEVEL_ORDER, TAG_COLORS } from '../data/problems';
import { getAllProgress, getFavorites, toggleFavoriteById } from '../lib/progress';
import Icon from '../components/Icon';

export default function Problems() {
  const navigate = useNavigate();
  const prog = getAllProgress();
  const [levelFilter, setLevelFilter] = useState('전체');
  const [tagFilter, setTagFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const tags = [...new Set(PROBLEMS.flatMap((problem) => problem.tags))];

  const filteredProblems = PROBLEMS.filter((problem) => {
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
    const pool = filteredProblems.length > 0 ? filteredProblems : PROBLEMS;
    const next = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/problems/${next.id}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">문제 풀기</h2>
        <span className="page-desc">SQL을 직접 작성하고 채점받아 보세요</span>
      </div>

      <div className="problem-controls">
        <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
          <option>전체</option>
          {LEVEL_ORDER.map((level) => <option key={level}>{level}</option>)}
        </select>
        <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
          <option>전체</option>
          {tags.map((tag) => <option key={tag}>{tag}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>전체</option>
          <option>미완료</option>
          <option>즐겨찾기</option>
          <option>다시 풀기</option>
        </select>
        <button
          className={`btn ${showFavsOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFavsOnly(v => !v)}
        >
          <Icon name="star" className="status-icon" />
          즐겨찾기만
        </button>
        <button className="btn btn-secondary" onClick={goRandomProblem}>
          <Icon name="shuffle" className="status-icon" />
          랜덤 문제
        </button>
      </div>

      {LEVEL_ORDER.map((level) => {
        const levelProblems = filteredProblems.filter((p) => p.level === level);
        if (levelProblems.length === 0) return null;
        const solved = levelProblems.filter((p) => prog[p.id]?.solved).length;
        return (
          <div key={level} className="problem-level-group">
            <div className="level-group-header">
              <span className={`level-badge level-${level}`}>{level}</span>
              <span className="level-group-count">{solved} / {levelProblems.length} 완료</span>
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
                      title="즐겨찾기"
                    >
                      <Icon name="star" className="fav-icon" />
                    </button>
                    <span className="problem-num">#{problem.id.toString().padStart(2, '0')}</span>
                    <span className="problem-name">{problem.title}</span>
                    <div className="problem-tags">
                      {problem.tags.map((tag) => (
                        <span key={tag} className="tag" style={{ background: TAG_COLORS[tag] + '22', color: TAG_COLORS[tag], border: `1px solid ${TAG_COLORS[tag]}44` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className={`problem-status ${isSolved ? 'status-solved' : status ? 'status-tried' : ''}`}>
                      {isSolved ? (
                        <>
                          <Icon name="success" className="status-icon" />
                          완료
                        </>
                      ) : status?.review ? '다시 풀기' : status?.favorite ? '즐겨찾기' : status ? `${status.attempts}회 시도` : '미시작'}
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
