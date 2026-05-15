import { useState, useRef } from 'react';
import { runQuery } from '../lib/database';
import Icon from './Icon';

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        result.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result.map(s => s.trim());
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function inferType(values) {
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return 'TEXT';
  if (nonEmpty.every(v => /^-?\d+$/.test(v))) return 'INTEGER';
  if (nonEmpty.every(v => /^-?\d*\.?\d+$/.test(v))) return 'REAL';
  return 'TEXT';
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_가-힣]/g, '_').replace(/^[0-9]/, '_$&') || 'table1';
}

export default function CsvImport({ onSuccess, onClose }) {
  const [parsed, setParsed] = useState(null); // { headers, rows, types }
  const [tableName, setTableName] = useState('my_table');
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { setStatus('error'); setStatusMsg('CSV 파일을 파싱할 수 없습니다.'); return; }
      const types = headers.map((_, ci) => inferType(rows.map(r => r[ci] ?? '')));
      setTableName(sanitizeName(file.name.replace(/\.csv$/, '')));
      setParsed({ headers, rows, types });
      setStatus(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) processFile(file);
  };

  const handleImport = () => {
    if (!parsed) return;
    const { headers, rows, types } = parsed;
    const tbl = sanitizeName(tableName) || 'my_table';
    const colDefs = headers.map((h, i) => `"${h.replace(/"/g,'""')}" ${types[i]}`).join(', ');
    try {
      runQuery(`DROP TABLE IF EXISTS "${tbl}";`);
      runQuery(`CREATE TABLE "${tbl}" (${colDefs});`);
      // Insert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const valClauses = batch.map(row => {
          const vals = headers.map((_, ci) => {
            const v = row[ci] ?? '';
            if (v === '' || v.toLowerCase() === 'null') return 'NULL';
            if (types[ci] === 'INTEGER') return parseInt(v, 10);
            if (types[ci] === 'REAL') return parseFloat(v);
            return `'${v.replace(/'/g, "''")}'`;
          });
          return `(${vals.join(', ')})`;
        }).join(',\n');
        if (valClauses) runQuery(`INSERT INTO "${tbl}" VALUES ${valClauses};`);
      }
      setStatus('success');
      setStatusMsg(`"${tbl}" 테이블 생성 완료 (${rows.length}행, ${headers.length}열)`);
      onSuccess();
    } catch (e) {
      setStatus('error');
      setStatusMsg(`오류: ${e.message}`);
    }
  };

  return (
    <div className="csv-import">
      <div className="csv-import-header">
        <span className="csv-import-title">CSV 파일 가져오기</span>
        <button className="csv-close-btn" onClick={onClose}><Icon name="close" style={{width:14,height:14}} /></button>
      </div>

      {!parsed ? (
        <div
          className={`csv-drop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Icon name="table" className="csv-drop-icon" />
          <div className="csv-drop-text">CSV 파일을 드래그하거나 클릭하여 선택</div>
          <div className="csv-drop-sub">UTF-8 인코딩 권장 · 첫 행은 컬럼명으로 사용됩니다</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="csv-preview">
          <div className="csv-table-name-row">
            <label className="csv-label">테이블 이름</label>
            <input
              className="csv-name-input"
              value={tableName}
              onChange={e => setTableName(sanitizeName(e.target.value))}
              placeholder="table_name"
            />
          </div>
          <div className="csv-preview-label">미리보기 (처음 5행)</div>
          <div className="csv-preview-scroll">
            <table className="csv-preview-table">
              <thead>
                <tr>
                  {parsed.headers.map((h, i) => (
                    <th key={i}>
                      {h}
                      <span className="csv-type-badge">{parsed.types[i]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 5).map((row, ri) => (
                  <tr key={ri}>
                    {parsed.headers.map((_, ci) => <td key={ci}>{row[ci] ?? ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="csv-info">{parsed.rows.length}행 · {parsed.headers.length}열</div>
          {status === 'success' && <div className="csv-success">{statusMsg}</div>}
          {status === 'error' && <div className="csv-error">{statusMsg}</div>}
          <div className="csv-actions">
            <button className="btn btn-ghost-sm" onClick={() => { setParsed(null); setStatus(null); }}>다시 선택</button>
            <button className="btn btn-run" onClick={handleImport} disabled={status === 'success'}>
              {status === 'success' ? '완료' : '테이블 생성'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
