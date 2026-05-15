import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Icon from './Icon';
import ResultChart from './ResultChart';

const PAGE_SIZE = 100;

function toNum(v) {
  if (v === null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function dl(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(columns, values) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.join(','), ...values.map(r => r.map(esc).join(','))].join('\n');
  dl(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), 'result.csv');
}

function exportJson(columns, values) {
  const data = values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
  dl(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'result.json');
}

function exportSqlInsert(columns, values) {
  const fmtVal = v => v === null ? 'NULL' : typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`;
  const lines = values.map(row => `INSERT INTO result_table (${columns.join(', ')}) VALUES (${row.map(fmtVal).join(', ')});`);
  dl(new Blob([lines.join('\n')], { type: 'text/plain' }), 'result.sql');
}

export default function ResultTable({ results, error, elapsed, rowsModified }) {
  if (error) {
    return (
      <div className="result-error">
        <Icon name="error" className="result-status-icon" />
        <span>{error}</span>
      </div>
    );
  }

  if (!results) {
    if (rowsModified != null && rowsModified > 0) {
      return (
        <div className="result-info">
          <Icon name="success" className="result-status-icon" />
          <span><strong>{rowsModified}행</strong> 변경됨</span>
          {elapsed != null && <span className="elapsed"> · {elapsed}ms</span>}
        </div>
      );
    }
    return <div className="result-empty">쿼리를 실행하면 결과가 여기에 표시됩니다.</div>;
  }

  if (results.length === 0) {
    return (
      <div className="result-info">
        <Icon name="success" className="result-status-icon" />
        <span>실행 완료{rowsModified != null && rowsModified > 0 ? ` — ${rowsModified}행 변경됨` : ' — 반환된 행 없음'}</span>
        {elapsed != null && <span className="elapsed"> ({elapsed}ms)</span>}
      </div>
    );
  }

  return <ResultGrid result={results[0]} elapsed={elapsed} />;
}

function ResultGrid({ result, elapsed }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const copyCell = useCallback((val, key) => {
    navigator.clipboard.writeText(String(val ?? '')).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 800);
  }, []);

  const { columns, values } = result;

  const filtered = useMemo(() => {
    if (!filter.trim()) return values;
    const q = filter.toLowerCase();
    return values.filter(row => row.some(cell => String(cell ?? '').toLowerCase().includes(q)));
  }, [values, filter]);

  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const an = toNum(av), bn = toNum(bv);
      const cmp = an !== null && bn !== null ? an - bn : String(av).localeCompare(String(bv), 'ko');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const colStats = useMemo(() => columns.map((_, ci) => {
    const vals = values.map(r => r[ci]);
    const nulls = vals.filter(v => v === null).length;
    const uniq = new Set(vals.map(v => String(v ?? 'NULL'))).size;
    const nums = vals.filter(v => v !== null).map(toNum).filter(n => n !== null);
    return { nulls, uniq, ...(nums.length ? { min: Math.min(...nums), max: Math.max(...nums), avg: nums.reduce((a, b) => a + b, 0) / nums.length } : {}) };
  }), [columns, values]);

  const handleSort = (ci) => {
    if (sortCol === ci) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir('asc'); }
    } else { setSortCol(ci); setSortDir('asc'); }
    setPage(0);
  };

  const copyTsv = () => {
    const tsv = [columns.join('\t'), ...sorted.map(r => r.map(v => v ?? '').join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv).catch(() => {});
    setExportOpen(false);
  };

  return (
    <div className="result-wrap">
      <div className="result-meta">
        <div className="result-meta-left">
          <span className="result-count">
            {filter ? `${filtered.length} / ${values.length}행` : `${values.length}행`}
          </span>
          {elapsed != null && <span className="elapsed"> · {elapsed}ms</span>}
          <span className="col-count"> · {columns.length}열</span>
        </div>
        <div className="result-actions">
          <input
            className="result-filter-input"
            placeholder="결과 필터..."
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
          />
          <button
            className={`result-action-btn ${showStats ? 'active' : ''}`}
            onClick={() => setShowStats(s => !s)}
            title="컬럼 통계 보기"
          >
            통계
          </button>
          <button
            className={`result-action-btn ${showChart ? 'active' : ''}`}
            onClick={() => setShowChart(s => !s)}
            title="차트 보기"
          >
            차트
          </button>
          <div className="export-menu-wrap" ref={exportRef}>
            <button className="result-action-btn" onClick={() => setExportOpen(o => !o)}>
              내보내기 ▾
            </button>
            {exportOpen && (
              <div className="export-menu">
                <button onClick={copyTsv}>클립보드 복사 (TSV)</button>
                <button onClick={() => { exportCsv(columns, sorted); setExportOpen(false); }}>CSV 다운로드</button>
                <button onClick={() => { exportJson(columns, sorted); setExportOpen(false); }}>JSON 다운로드</button>
                <button onClick={() => { exportSqlInsert(columns, sorted); setExportOpen(false); }}>SQL INSERT 다운로드</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showStats && (
        <div className="col-stats-bar">
          {columns.map((col, i) => (
            <div key={col} className="col-stat-item">
              <div className="col-stat-name">{col}</div>
              <div className="col-stat-vals">
                <span title="NULL 개수">NULL {colStats[i].nulls}</span>
                <span title="고유값 수">고유 {colStats[i].uniq}</span>
                {colStats[i].min !== undefined && (
                  <>
                    <span title="최솟값">↓{colStats[i].min}</span>
                    <span title="최댓값">↑{colStats[i].max}</span>
                    <span title="평균">≈{colStats[i].avg.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showChart && <ResultChart columns={columns} values={values} />}

      <div className="table-scroll">
        <table className="result-table">
          <thead>
            <tr>
              <th className="row-num-th">#</th>
              {columns.map((col, i) => (
                <th
                  key={col}
                  className={`col-th sortable ${sortCol === i ? (sortDir === 'asc' ? 'sort-asc' : 'sort-desc') : ''}`}
                  onClick={() => handleSort(i)}
                  title="클릭하여 정렬"
                >
                  <span className="col-th-text">{col}</span>
                  <span className="sort-icon">
                    {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, ri) => (
              <tr key={ri}>
                <td className="row-num-td">{page * PAGE_SIZE + ri + 1}</td>
                {row.map((cell, ci) => {
                  const key = `${ri}-${ci}`;
                  return (
                    <td
                      key={ci}
                      className={`${cell === null ? 'null-cell' : 'data-cell'} ${copiedKey === key ? 'cell-copied' : ''}`}
                      onClick={() => cell !== null && copyCell(cell, key)}
                      title={cell !== null ? '클릭하여 복사' : 'NULL'}
                    >
                      {cell === null
                        ? <span className="null-val">NULL</span>
                        : <span>{String(cell)}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="result-pagination">
          <button className="page-btn" onClick={() => setPage(0)} disabled={page === 0}><Icon name="skip-first" style={{width:14,height:14}} /></button>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><Icon name="prev" style={{width:14,height:14}} /></button>
          <span className="page-info">{page + 1} / {totalPages} 페이지 ({sorted.length}행)</span>
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><Icon name="next" style={{width:14,height:14}} /></button>
          <button className="page-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}><Icon name="skip-last" style={{width:14,height:14}} /></button>
        </div>
      )}
    </div>
  );
}
