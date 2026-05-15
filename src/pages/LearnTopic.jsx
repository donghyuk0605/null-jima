import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LEARN_TOPICS } from '../data/learn';
import { PROBLEMS } from '../data/problems';
import { runQuery, translateSqlError } from '../lib/database';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeLearnTopic, localizeProblems, translateLevel } from '../lib/localizedContent';

export default function LearnTopic() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const rawTopic = LEARN_TOPICS.find((tp) => tp.id === topicId);
  const topic = rawTopic ? localizeLearnTopic(rawTopic, language) : null;

  const [runResults, setRunResults] = useState({});
  const [runErrors, setRunErrors] = useState({});

  if (!topic) return <div className="page"><p>{t('learn.topic.notFound')}</p></div>;

  const idx = LEARN_TOPICS.findIndex((tp) => tp.id === topicId);
  const prev = LEARN_TOPICS[idx - 1] ? localizeLearnTopic(LEARN_TOPICS[idx - 1], language) : null;
  const next = LEARN_TOPICS[idx + 1] ? localizeLearnTopic(LEARN_TOPICS[idx + 1], language) : null;

  const runExample = (i, sqlStr) => {
    try {
      const res = runQuery(sqlStr.trim());
      setRunResults((prev) => ({ ...prev, [i]: res }));
      setRunErrors((prev) => ({ ...prev, [i]: null }));
    } catch (e) {
      setRunErrors((prev) => ({ ...prev, [i]: translateSqlError(e, t) }));
      setRunResults((prev) => ({ ...prev, [i]: null }));
    }
  };

  const relatedProblems = localizeProblems(PROBLEMS.filter((p) => topic.relatedProblems.includes(p.id)), language);

  return (
    <div className="page topic-page">
      <div className="topic-nav">
        {prev ? <button className="btn btn-ghost-sm" onClick={() => navigate(`/learn/${prev.id}`)}>← {prev.title}</button> : <span />}
        <Link to="/learn" className="btn btn-ghost-sm">{t('learn.back')}</Link>
        {next ? <button className="btn btn-ghost-sm" onClick={() => navigate(`/learn/${next.id}`)}>→ {next.title}</button> : <span />}
      </div>

      <div className="topic-header">
        <h2 className="topic-title">{topic.title}</h2>
        <p className="topic-subtitle">{topic.subtitle}</p>
        <p className="topic-desc">{topic.description}</p>
      </div>

      <section className="topic-section">
        <h3 className="section-title">{t('learn.syntax.title')}</h3>
        <pre className="syntax-block">{topic.syntax}</pre>
      </section>

      <section className="topic-section">
        <h3 className="section-title">{t('learn.examples.title')}</h3>
        {topic.examples.map((ex, i) => (
          <div key={i} className="example-block">
            <div className="example-header">
              <span className="example-num">{i + 1}</span>
              <span className="example-title">{ex.title}</span>
            </div>
            <p className="example-desc">{ex.desc}</p>
            <div className="example-editor">
              <SqlEditor
                value={ex.sql}
                height="auto"
                readOnly={true}
                autocomplete={false}
              />
              <button className="btn btn-run-sm" onClick={() => runExample(i, ex.sql)}>
                <Icon name="play" className="btn-icon" />
                {t('learn.run')}
              </button>
            </div>
            {(runResults[i] || runErrors[i]) && (
              <div className="example-result">
                <ResultTable results={runResults[i]} error={runErrors[i]} elapsed={null} />
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="topic-section">
        <h3 className="section-title">{t('learn.tips.title')}</h3>
        <ul className="tips-list">
          {topic.tips.map((tip, i) => (
            <li key={i} className="tip-item">{tip}</li>
          ))}
        </ul>
      </section>

      {relatedProblems.length > 0 && (
        <section className="topic-section">
          <h3 className="section-title">{t('learn.practice.title')}</h3>
          <div className="related-problems">
            {relatedProblems.map((p) => (
              <Link key={p.id} to={`/problems/${p.id}`} className="related-problem-card">
                <span className={`badge level-${p.level}`}>{translateLevel(p.level, t)}</span>
                <span className="rp-title">{p.title}</span>
                <span className="rp-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
