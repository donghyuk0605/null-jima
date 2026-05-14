import { useCallback, useMemo, useState } from 'react';
import { getSchema, runQuery, translateSqlError } from '../lib/database';
import { formatSql } from '../lib/sqlFormatter';
import {
  getStoredEditorMode,
  saveStoredEditorMode,
} from '../lib/editorModes';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';

const EDITOR_DRAFT_KEY = 'sqldojo_editor_draft';
const EDITOR_HISTORY_KEY = 'sqldojo_editor_history';

const DEFAULT_SQL = 'SELECT *\nFROM employees\nLIMIT 10;';

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(EDITOR_HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

const saveHistory = (items) => {
  localStorage.setItem(EDITOR_HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
};

export default function Editor() {
  const [query, setQuery] = useState(
    () => localStorage.getItem(EDITOR_DRAFT_KEY) || DEFAULT_SQL
  );
  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [schema, setSchema] = useState(() => getSchema());
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [ddlSuccess, setDdlSuccess] = useState(false);
  const [history, setHistory] = useState(() => loadHistory());

  const schemaForEditor = useMemo(() => {
    const obj = {};
    schema.forEach((tbl) => {
      obj[tbl.name] = tbl.columns.map((col) => col.col);
    });
    return obj;
  }, [schema]);

  const updateQuery = (value) => {
    setQuery(value);
    localStorage.setItem(EDITOR_DRAFT_KEY, value);
  };

  const changeEditorMode = (mode) => {
    setEditorMode(mode);
    saveStoredEditorMode(mode);
  };

  const addHistory = useCallback((sql) => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [
        {
          id: `${Date.now()}`,
          sql: trimmed,
          createdAt: new Date().toISOString(),
        },
        ...prev.filter((item) => item.sql !== trimmed),
      ];
      saveHistory(next);
      return next.slice(0, 8);
    });
  }, []);

  const execute = useCallback(() => {
    const sql = query.trim();
    if (!sql) return;
    setError(null);
    setResults(null);
    setDdlSuccess(false);
    const start = performance.now();
    try {
      const res = runQuery(sql);
      setElapsed(Math.round(performance.now() - start));
      if (res.length === 0) {
        setDdlSuccess(true);
      } else {
        setResults(res);
      }
      setSchema(getSchema());
      addHistory(sql);
    } catch (e) {
      setElapsed(null);
      setError(translateSqlError(e));
    }
  }, [addHistory, query]);

  const clearEditor = () => {
    updateQuery('');
    setResults(null);
    setError(null);
    setElapsed(null);
    setDdlSuccess(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(EDITOR_HISTORY_KEY);
  };

  const effectiveAutocomplete = editorMode !== 'terminal';

  return (
    <div className="page editor-page">
      <div className="page-header">
        <h2 className="page-title">SQL 에디터</h2>
        <span className="page-desc">문제와 분리해서 쿼리를 작성하고 결과를 확인하세요</span>
      </div>

      <div className="editor-page-layout">
        <aside className="editor-page-sidebar">
          {editorMode === 'beginner' ? (
            <SyntaxPicker onPick={updateQuery} />
          ) : (
            <section className="editor-panel">
              <div className="sidebar-label">테이블 스키마</div>
              {schema.map((table) => (
                <div key={table.name} className="schema-tbl">
                  <button
                    className="schema-tbl-name"
                    onClick={() => updateQuery(`SELECT *\nFROM ${table.name}\nLIMIT 10;`)}
                    type="button"
                  >
                    <Icon name="table" className="inline-icon" />
                    {table.name}
                  </button>
                  <div className="schema-cols">
                    {table.columns.map((col) => (
                      <div key={col.col} className="schema-col-row">
                        <span className="col-nm">{col.col}</span>
                        <span className="col-tp">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="editor-panel">
            <div className="editor-panel-head">
              <div className="sidebar-label">실행 기록</div>
              {history.length > 0 && (
                <button className="history-clear" onClick={clearHistory} type="button">
                  지우기
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="editor-empty">아직 실행한 쿼리가 없습니다.</div>
            ) : (
              <div className="editor-history-list">
                {history.map((item) => (
                  <button
                    key={item.id}
                    className="editor-history-item"
                    onClick={() => updateQuery(item.sql)}
                    type="button"
                  >
                    <span>{item.sql.split('\n')[0]}</span>
                    <small>{new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <main className="editor-page-main">
          <div className="editor-card">
            <EditorModeBar mode={editorMode} onModeChange={changeEditorMode} />
            {editorMode === 'beginner' && (
              <div className="editor-helper-strip">
                왼쪽 문법 메뉴에서 골격을 고르고, 테이블/컬럼 이름을 바꿔 실행해보세요.
              </div>
            )}
            {editorMode === 'terminal' && (
              <div className="terminal-titlebar">
                <span>standalone-sql-console</span>
                <span>Ctrl+Enter</span>
              </div>
            )}
            <SqlEditor
              value={query}
              onChange={updateQuery}
              height={editorMode === 'terminal' ? '360px' : '300px'}
              autocomplete={effectiveAutocomplete}
              schemaOverride={schemaForEditor}
              mode={editorMode}
              placeholder="SELECT * FROM employees;"
            />
            <div className="editor-toolbar">
              <button className="btn btn-run" onClick={execute}>
                <Icon name="play" className="btn-icon" />
                실행
              </button>
              <button className="btn btn-ghost-sm" onClick={() => updateQuery(formatSql(query))}>
                <Icon name="format" className="status-icon" />
                포맷
              </button>
              <button className="btn btn-ghost-sm" onClick={clearEditor}>
                초기화
              </button>
              <span className="editor-mode-status">
                {editorMode === 'terminal' ? '고급 터미널' : editorMode === 'beginner' ? '초급 도우미' : '중급 편의성'}
              </span>
            </div>
          </div>

          <div className="result-card">
            {ddlSuccess && !error && (
              <div className="ddl-success-msg">
                <Icon name="success" style={{ width: 16, height: 16 }} />
                명령이 실행되었습니다.
              </div>
            )}
            <ResultTable results={results} error={error} elapsed={elapsed} />
          </div>
        </main>
      </div>
    </div>
  );
}
