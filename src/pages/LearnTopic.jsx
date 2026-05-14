import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LEARN_TOPICS } from '../data/learn';
import { PROBLEMS } from '../data/problems';
import { runQuery, translateSqlError } from '../lib/database';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';

export default function LearnTopic() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = LEARN_TOPICS.find((t) => t.id === topicId);

  const [runResults, setRunResults] = useState({});
  const [runErrors, setRunErrors] = useState({});

  if (!topic) return <div className="page"><p>토픽을 찾을 수 없습니다.</p></div>;

  const idx = LEARN_TOPICS.findIndex((t) => t.id === topicId);
  const prev = LEARN_TOPICS[idx - 1];
  const next = LEARN_TOPICS[idx + 1];

  const runExample = (i, sqlStr) => {
    try {
      const res = runQuery(sqlStr.trim());
      setRunResults((prev) => ({ ...prev, [i]: res }));
      setRunErrors((prev) => ({ ...prev, [i]: null }));
    } catch (e) {
      setRunErrors((prev) => ({ ...prev, [i]: translateSqlError(e) }));
      setRunResults((prev) => ({ ...prev, [i]: null }));
    }
  };

  const relatedProblems = PROBLEMS.filter((p) => topic.relatedProblems.includes(p.id));

  return (
    <div className="page topic-page">
      <div className="topic-nav">
        {prev ? <button className="btn btn-ghost-sm" onClick={() => navigate(`/learn/${prev.id}`)}>← {prev.title}</button> : <span />}
        <Link to="/learn" className="btn btn-ghost-sm">목록으로</Link>
        {next ? <button className="btn btn-ghost-sm" onClick={() => navigate(`/learn/${next.id}`)}>→ {next.title}</button> : <span />}
      </div>

      <div className="topic-header">
        <h2 className="topic-title">{topic.title}</h2>
        <p className="topic-subtitle">{topic.subtitle}</p>
        <p className="topic-desc">{topic.description}</p>
      </div>

      {/* 문법 */}
      <section className="topic-section">
        <h3 className="section-title">기본 문법</h3>
        <pre className="syntax-block">{topic.syntax}</pre>
      </section>

      {/* 예제 */}
      <section className="topic-section">
        <h3 className="section-title">예제</h3>
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
                실행
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

      {/* 팁 */}
      <section className="topic-section">
        <h3 className="section-title">알아두면 좋은 것</h3>
        <ul className="tips-list">
          {topic.tips.map((tip, i) => (
            <li key={i} className="tip-item">{tip}</li>
          ))}
        </ul>
      </section>

      {/* 연관 문제 */}
      {relatedProblems.length > 0 && (
        <section className="topic-section">
          <h3 className="section-title">연습 문제</h3>
          <div className="related-problems">
            {relatedProblems.map((p) => (
              <Link key={p.id} to={`/problems/${p.id}`} className="related-problem-card">
                <span className={`badge level-${p.level}`}>{p.level}</span>
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
