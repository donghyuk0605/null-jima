import { Link } from 'react-router-dom';
import { LEARN_TOPICS } from '../data/learn';
import { PROBLEMS } from '../data/problems';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeLearnTopics, translateTag } from '../lib/localizedContent';

const ROADMAP = [
  { titleKey: 'roadmap.basic', tags: ['SELECT', 'DISTINCT', 'LIMIT'] },
  { titleKey: 'roadmap.where', tags: ['WHERE', 'ORDER BY'] },
  { titleKey: 'roadmap.group', tags: ['GROUP BY', '집계함수', 'HAVING'] },
  { titleKey: 'roadmap.join', tags: ['JOIN'] },
  { titleKey: 'roadmap.advanced', tags: ['서브쿼리'] },
];

export default function Learn() {
  const { language, t } = useLanguage();
  const tt = (tag) => translateTag(tag, t);
  const learnTopics = localizeLearnTopics(LEARN_TOPICS, language);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{t('learn.title')}</h2>
        <span className="page-desc">{t('learn.desc')}</span>
      </div>

      <section className="roadmap-section">
        <h3 className="progress-section-title">{t('learn.roadmap.title')}</h3>
        <div className="roadmap-track">
          {ROADMAP.map((step, index) => {
            const related = PROBLEMS.filter((problem) =>
              problem.tags.some((tag) => step.tags.includes(tag))
            );
            return (
              <div key={step.titleKey} className="roadmap-step">
                <span className="roadmap-step-num">{index + 1}</span>
                <div className="roadmap-step-body">
                  <strong>{t(step.titleKey)}</strong>
                  <span>{step.tags.map(tt).join(' → ')}</span>
                  <small>{t('learn.roadmap.problems', { n: related.length })}</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="learn-grid">
        {learnTopics.map((topic) => (
          <Link key={topic.id} to={`/learn/${topic.id}`} className="learn-card">
            <div className="learn-card-title">{topic.title}</div>
            <div className="learn-card-sub">{topic.subtitle}</div>
            <div className="learn-card-desc">{topic.description}</div>
            <div className="learn-card-footer">
              {t('learn.card.footer', { examples: topic.examples.length, problems: topic.relatedProblems.length })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
