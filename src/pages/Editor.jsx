import { useCallback, useMemo, useState } from 'react';
import { getSchema, runQuery, translateSqlError, getRowsModified, getTableStats } from '../lib/database';
import { formatSql } from '../lib/sqlFormatter';
import { getStoredEditorMode, saveStoredEditorMode } from '../lib/editorModes';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';

const TABS_KEY = 'sqldojo_tabs';
const ACTIVE_TAB_KEY = 'sqldojo_active_tab';
const EDITOR_HISTORY_KEY = 'sqldojo_editor_history';
const genId = () => `tab_${Date.now()}`;

const DEFAULT_TABS = [
  { id: 'tab_1', name: '쿼리 1', sql: 'SELECT *\nFROM employees\nLIMIT 10;' },
];

function loadTabs() {
  try {
    // migrate old single-draft key
    const old = localStorage.getItem('sqldojo_editor_draft');
    const saved = JSON.parse(localStorage.getItem(TABS_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved;
    if (old) return [{ id: 'tab_1', name: '쿼리 1', sql: old }];
    return DEFAULT_TABS;
  } catch { return DEFAULT_TABS; }
}

function saveTabs(tabs) {
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(EDITOR_HISTORY_KEY)) || []; } catch { return []; }
};

const saveHistory = (items) => localStorage.setItem(EDITOR_HISTORY_KEY, JSON.stringify(items.slice(0, 12)));

export default function Editor() {
  const [tabs, setTabs] = useState(loadTabs);
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);
    const all = loadTabs();
    return all.find(t => t.id === saved) ? saved : all[0]?.id;
  });
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [schema, setSchema] = useState(() => getSchema());
  const [tableStats, setTableStats] = useState(() => getTableStats());
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [ddlSuccess, setDdlSuccess] = useState(false);
  const [rowsModified, setRowsModified] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());
  const [fullscreen, setFullscreen] = useState(false);
  const [explainMode, setExplainMode] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const query = activeTab?.sql || '';

  const updateQuery = useCallback((val) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === activeTabId ? { ...t, sql: val } : t);
      saveTabs(next);
      return next;
    });
  }, [activeTabId]);

  const updateTabs = (next) => { setTabs(next); saveTabs(next); };

  const switchTab = (id) => {
    setActiveTabId(id);
    localStorage.setItem(ACTIVE_TAB_KEY, id);
    setResults(null); setError(null); setElapsed(null); setDdlSuccess(false); setRowsModified(null);
  };

  const addTab = () => {
    const id = genId();
    const n = tabs.length + 1;
    const newTab = { id, name: `쿼리 ${n}`, sql: '' };
    updateTabs([...tabs, newTab]);
    switchTab(id);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const next = tabs.filter(t => t.id !== id);
    updateTabs(next);
    if (activeTabId === id) {
      const newActive = next[Math.max(0, idx - 1)]?.id;
      setActiveTabId(newActive);
      localStorage.setItem(ACTIVE_TAB_KEY, newActive);
    }
  };

  const startRename = (id, name, e) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameVal(name);
  };

  const commitRename = () => {
    if (renameVal.trim()) {
      updateTabs(tabs.map(t => t.id === renamingId ? { ...t, name: renameVal.trim() } : t));
    }
    setRenamingId(null);
  };

  const changeEditorMode = (mode) => { setEditorMode(mode); saveStoredEditorMode(mode); };

  const refreshSchema = () => {
    setSchema(getSchema());
    setTableStats(getTableStats());
  };

  const addHistory = useCallback((sql) => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const next = [{ id: `${Date.now()}`, sql: trimmed, createdAt: new Date().toISOString() }, ...prev.filter(i => i.sql !== trimmed)];
      saveHistory(next);
      return next.slice(0, 12);
    });
  }, []);

  const execute = useCallback(() => {
    const sql = query.trim();
    if (!sql) return;
    setError(null); setResults(null); setDdlSuccess(false); setRowsModified(null);
    const start = performance.now();
    try {
      const targetSql = explainMode && !sql.toUpperCase().startsWith('EXPLAIN')
        ? `EXPLAIN QUERY PLAN ${sql}`
        : sql;
      const res = runQuery(targetSql);
      const modified = getRowsModified();
      setElapsed(Math.round(performance.now() - start));
      if (res.length === 0) {
        setDdlSuccess(true);
        setRowsModified(modified);
      } else {
        setResults(res);
      }
      refreshSchema();
      addHistory(sql);
    } catch (e) {
      setElapsed(null);
      setError(translateSqlError(e));
    }
  }, [addHistory, query, explainMode]);

  const clearEditor = () => {
    updateQuery('');
    setResults(null); setError(null); setElapsed(null); setDdlSuccess(false); setRowsModified(null);
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(EDITOR_HISTORY_KEY); };

  const effectiveAutocomplete = editorMode !== 'terminal';

  const schemaForEditor = useMemo(() => {
    const obj = {};
    schema.forEach(tbl => { obj[tbl.name] = tbl.columns.map(c => c.col); });
    return obj;
  }, [schema]);

  return (
    <div className={`page editor-page ${fullscreen ? 'editor-fullscreen' : ''}`}>
      <div className="page-header">
        <h2 className="page-title">SQL 에디터</h2>
        <span className="page-desc">여러 탭에서 쿼리를 작성하고 결과를 확인하세요</span>
        <button
          className="btn btn-ghost-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setFullscreen(f => !f)}
          title={fullscreen ? '전체화면 해제' : '전체화면'}
        >
          {fullscreen ? '⊠ 축소' : '⊞ 전체화면'}
        </button>
      </div>

      <div className="editor-page-layout">
        <aside className="editor-page-sidebar">
          {editorMode === 'beginner' && <SyntaxPicker onPick={updateQuery} />}

          <section className="editor-panel">
            <div className="sidebar-label">테이블 스키마</div>
            {schema.map(table => (
              <div key={table.name} className="schema-tbl">
                <button
                  className="schema-tbl-name"
                  onClick={() => updateQuery(`SELECT *\nFROM ${table.name}\nLIMIT 10;`)}
                  type="button"
                >
                  <Icon name="table" className="inline-icon" />
                  <span className="schema-tbl-label">{table.name}</span>
                  {tableStats[table.name] && (
                    <span className="schema-row-count">{tableStats[table.name].rowCount}행</span>
                  )}
                </button>
                <div className="schema-cols">
                  {table.columns.map(col => (
                    <div key={col.col} className="schema-col-row">
                      <span className="col-nm">{col.col}</span>
                      <span className="col-tp">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="editor-panel">
            <div className="editor-panel-head">
              <div className="sidebar-label">실행 기록</div>
              {history.length > 0 && (
                <button className="history-clear" onClick={clearHistory} type="button">지우기</button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="editor-empty">아직 실행한 쿼리가 없습니다.</div>
            ) : (
              <div className="editor-history-list">
                {history.map(item => (
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
            {/* Tab bar */}
            <div className="tab-bar">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  className={`editor-tab ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => switchTab(tab.id)}
                >
                  {renamingId === tab.id ? (
                    <input
                      className="tab-rename-input"
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => e.key === 'Enter' && commitRename()}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="tab-name" onDoubleClick={e => startRename(tab.id, tab.name, e)}>
                      {tab.name}
                    </span>
                  )}
                  {tabs.length > 1 && (
                    <button className="tab-close-btn" onClick={e => closeTab(tab.id, e)} type="button">×</button>
                  )}
                </div>
              ))}
              <button className="tab-add-btn" onClick={addTab} type="button" title="새 탭">+</button>
            </div>

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
              onRun={execute}
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
              <button className="btn btn-ghost-sm" onClick={clearEditor}>초기화</button>
              <button
                className={`btn btn-ghost-sm ${explainMode ? 'btn-active' : ''}`}
                onClick={() => setExplainMode(m => !m)}
                title="EXPLAIN QUERY PLAN 모드 토글"
              >
                EXPLAIN {explainMode ? '✓' : ''}
              </button>
              <span className="editor-shortcut-hint">Ctrl+Enter로 실행</span>
            </div>
            <div className="editor-statusbar">
              <span>{activeTab?.name || '쿼리'}</span>
              <span>{editorMode === 'terminal' ? '터미널' : editorMode === 'beginner' ? '도우미' : '편의성'}</span>
              <span>{schema.length} tables</span>
              <span>{results?.[0]?.values?.length ?? 0} rows</span>
              {elapsed != null && <span>{elapsed}ms</span>}
            </div>
          </div>

          <div className="result-card">
            {ddlSuccess && !error && (
              <div className="ddl-success-msg">
                <Icon name="success" style={{ width: 16, height: 16 }} />
                명령이 실행되었습니다.{rowsModified != null && rowsModified > 0 && ` (${rowsModified}행 변경)`}
              </div>
            )}
            <ResultTable results={results} error={error} elapsed={elapsed} rowsModified={rowsModified} />
          </div>
        </main>
      </div>
    </div>
  );
}
