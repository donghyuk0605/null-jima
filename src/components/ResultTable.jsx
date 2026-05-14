import Icon from './Icon';

export default function ResultTable({ results, error, elapsed }) {
  if (error) {
    return (
      <div className="result-error">
        <Icon name="error" className="result-status-icon" />
        <span>{error}</span>
      </div>
    );
  }
  if (!results) return <div className="result-empty">쿼리를 실행하면 결과가 여기에 표시됩니다.</div>;
  if (results.length === 0) {
    return (
      <div className="result-info">
        <Icon name="success" className="result-status-icon" />
        <span>실행 완료 — 반환된 행 없음</span>
        {elapsed != null && <span className="elapsed"> ({elapsed}ms)</span>}
      </div>
    );
  }

  return (
    <div className="result-wrap">
      <div className="result-meta">
        {results[0].values.length}행 반환
        {elapsed != null && <span className="elapsed"> · {elapsed}ms</span>}
      </div>
      <div className="table-scroll">
        <table className="result-table">
          <thead>
            <tr>{results[0].columns.map((col) => <th key={col}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {results[0].values.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell === null ? <span className="null-val">NULL</span> : String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
