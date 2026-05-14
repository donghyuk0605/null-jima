import { Link } from 'react-router-dom';
import { LEARN_TOPICS } from '../data/learn';
import { PROBLEMS } from '../data/problems';

const ROADMAP = [
  { title: '기본 조회', tags: ['SELECT', 'DISTINCT', 'LIMIT'] },
  { title: '조건과 정렬', tags: ['WHERE', 'ORDER BY'] },
  { title: '그룹 집계', tags: ['GROUP BY', '집계함수', 'HAVING'] },
  { title: '테이블 연결', tags: ['JOIN'] },
  { title: '고급 조회', tags: ['서브쿼리'] },
];

export default function Learn() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">학습 도우미</h2>
        <span className="page-desc">SQL 문법을 하나씩 이해해보세요</span>
      </div>

      <section className="roadmap-section">
        <h3 className="progress-section-title">문법별 학습 로드맵</h3>
        <div className="roadmap-track">
          {ROADMAP.map((step, index) => {
            const related = PROBLEMS.filter((problem) =>
              problem.tags.some((tag) => step.tags.includes(tag))
            );
            return (
              <div key={step.title} className="roadmap-step">
                <span className="roadmap-step-num">{index + 1}</span>
                <div className="roadmap-step-body">
                  <strong>{step.title}</strong>
                  <span>{step.tags.join(' → ')}</span>
                  <small>연관 문제 {related.length}개</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="learn-grid">
        {LEARN_TOPICS.map((topic) => (
          <Link key={topic.id} to={`/learn/${topic.id}`} className="learn-card">
            <div className="learn-card-title">{topic.title}</div>
            <div className="learn-card-sub">{topic.subtitle}</div>
            <div className="learn-card-desc">{topic.description}</div>
            <div className="learn-card-footer">
              예제 {topic.examples.length}개 · 연관 문제 {topic.relatedProblems.length}개 →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
