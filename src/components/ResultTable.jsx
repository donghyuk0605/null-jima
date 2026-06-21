import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Icon from './Icon';
import ResultChart from './ResultChart';
import { useLanguage } from '../contexts/LanguageContext';
import { sanitizeJapaneseText } from '../lib/localizedContent';

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
  const { t } = useLanguage();

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
          <span>{t('result.rows.modified', { n: rowsModified })}</span>
          {elapsed != null && <span className="elapsed"> · {elapsed}ms</span>}
        </div>
      );
    }
    return <div className="result-empty">{t('result.empty')}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="result-info">
        <Icon name="success" className="result-status-icon" />
        <span>{t('result.done')}{rowsModified != null && rowsModified > 0 ? t('result.modified', { n: rowsModified }) : t('result.no.rows')}</span>
        {elapsed != null && <span className="elapsed"> ({elapsed}ms)</span>}
      </div>
    );
  }

  return <ResultGrid result={results[0]} elapsed={elapsed} />;
}

function ResultGrid({ result, elapsed }) {
  const { language, t } = useLanguage();
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
  const displayColumns = language === 'ja' ? sanitizeJapaneseText(columns) : columns;
  const displayValues = language === 'ja' ? sanitizeJapaneseText(values) : values;

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
            {filter ? t('result.filtered', { filtered: filtered.length, total: values.length }) : t('result.rows', { n: values.length })}
          </span>
          {elapsed != null && <span className="elapsed"> · {elapsed}ms</span>}
          <span className="col-count"> · {t('result.cols', { n: columns.length })}</span>
        </div>
        <div className="result-actions">
          <input
            className="result-filter-input"
            placeholder={t('result.filter.placeholder')}
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
          />
          <button
            className={`result-action-btn ${showStats ? 'active' : ''}`}
            onClick={() => setShowStats(s => !s)}
            title={t('result.stat.uniq')}
          >
            {t('result.stats.btn')}
          </button>
          <button
            className={`result-action-btn ${showChart ? 'active' : ''}`}
            onClick={() => setShowChart(s => !s)}
            title={t('result.chart.btn')}
          >
            {t('result.chart.btn')}
          </button>
          <div className="export-menu-wrap" ref={exportRef}>
            <button className="result-action-btn" onClick={() => setExportOpen(o => !o)}>
              {t('result.export.btn')}
            </button>
            {exportOpen && (
              <div className="export-menu">
                <button onClick={copyTsv}>{t('result.copy.tsv')}</button>
                <button onClick={() => { exportCsv(columns, sorted); setExportOpen(false); }}>{t('result.download.csv')}</button>
                <button onClick={() => { exportJson(columns, sorted); setExportOpen(false); }}>{t('result.download.json')}</button>
                <button onClick={() => { exportSqlInsert(columns, sorted); setExportOpen(false); }}>{t('result.download.sql')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showStats && (
        <div className="col-stats-bar">
          {displayColumns.map((col, i) => (
            <div key={col} className="col-stat-item">
              <div className="col-stat-name">{col}</div>
              <div className="col-stat-vals">
                <span title={t('result.stat.null')}>{t('result.stat.null.label', { n: colStats[i].nulls })}</span>
                <span title={t('result.stat.uniq')}>{t('result.stat.uniq.label', { n: colStats[i].uniq })}</span>
                {colStats[i].min !== undefined && (
                  <>
                    <span title={t('result.stat.min')}>↓{colStats[i].min}</span>
                    <span title={t('result.stat.max')}>↑{colStats[i].max}</span>
                    <span title={t('result.stat.avg')}>≈{colStats[i].avg.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showChart && <ResultChart columns={displayColumns} values={displayValues} />}

      <div className="table-scroll">
        <table className="result-table">
          <thead>
            <tr>
              <th className="row-num-th">#</th>
              {displayColumns.map((col, i) => (
                <th
                  key={col}
                  className={`col-th sortable ${sortCol === i ? (sortDir === 'asc' ? 'sort-asc' : 'sort-desc') : ''}`}
                  onClick={() => handleSort(i)}
                  title={t('result.sort')}
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
            {pageData.map((row, ri) => {
              const displayRow = language === 'ja' ? sanitizeJapaneseText(row) : row;
              return (
              <tr key={ri}>
                <td className="row-num-td">{page * PAGE_SIZE + ri + 1}</td>
                {displayRow.map((cell, ci) => {
                  const key = `${ri}-${ci}`;
                  return (
                    <td
                      key={ci}
                      className={`${cell === null ? 'null-cell' : 'data-cell'} ${copiedKey === key ? 'cell-copied' : ''}`}
                      onClick={() => cell !== null && copyCell(cell, key)}
                      title={cell !== null ? t('result.copy.cell') : 'NULL'}
                    >
                      {cell === null
                        ? <span className="null-val">NULL</span>
                        : <span>{String(cell)}</span>}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="result-pagination">
          <button className="page-btn" onClick={() => setPage(0)} disabled={page === 0}><Icon name="skip-first" style={{width:14,height:14}} /></button>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}><Icon name="prev" style={{width:14,height:14}} /></button>
          <span className="page-info">{t('result.page.info', { page: page + 1, total: totalPages, rows: sorted.length })}</span>
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><Icon name="next" style={{width:14,height:14}} /></button>
          <button className="page-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}><Icon name="skip-last" style={{width:14,height:14}} /></button>
        </div>
      )}
    </div>
  );
}
