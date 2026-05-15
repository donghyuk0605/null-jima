import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSchema, runQuery, translateSqlError, getRowsModified, getTableStats } from '../lib/database';
import { formatSql } from '../lib/sqlFormatter';
import { getStoredEditorMode, saveStoredEditorMode } from '../lib/editorModes';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import { getSavedQueries, saveQuery, deleteSavedQuery } from '../lib/savedQueries';
import { useLanguage } from '../contexts/LanguageContext';

const TABS_KEY = 'sqldojo_tabs';
const ACTIVE_TAB_KEY = 'sqldojo_active_tab';
const EDITOR_HISTORY_KEY = 'sqldojo_editor_history';
const genId = () => `tab_${Date.now()}`;

function makeDefaultTabs(name1) {
  return [{ id: 'tab_1', name: name1, sql: 'SELECT *\nFROM employees\nLIMIT 10;', results: null, error: null, elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: null }];
}

function loadTabs(name1) {
  try {
    const old = localStorage.getItem('sqldojo_editor_draft');
    const saved = JSON.parse(localStorage.getItem(TABS_KEY));
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map(tab => ({
        id: tab.id,
        name: tab.name,
        sql: tab.sql,
        results: null,
        error: null,
        elapsed: null,
        ddlSuccess: false,
        rowsModified: null,
        multiResults: null,
      }));
    }
    if (old) return [{ id: 'tab_1', name: name1, sql: old, results: null, error: null, elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: null }];
    return makeDefaultTabs(name1);
  } catch { return makeDefaultTabs(name1); }
}

function saveTabs(tabs) {
  // Only persist id, name, sql — not result state
  localStorage.setItem(TABS_KEY, JSON.stringify(tabs.map(({ id, name, sql }) => ({ id, name, sql }))));
}

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(EDITOR_HISTORY_KEY)) || []; } catch { return []; }
};

const saveHistory = (items) => localStorage.setItem(EDITOR_HISTORY_KEY, JSON.stringify(items.slice(0, 12)));

export default function Editor() {
  const { t } = useLanguage();
  const [tabs, setTabs] = useState(() => loadTabs(t('editor.newTab', { n: 1 })));
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);
    const all = loadTabs(t('editor.newTab', { n: 1 }));
    return all.find(tab => tab.id === saved) ? saved : all[0]?.id;
  });
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const [editorMode, setEditorMode] = useState(() => getStoredEditorMode());
  const [schema, setSchema] = useState(() => getSchema());
  const [tableStats, setTableStats] = useState(() => getTableStats());
  const [history, setHistory] = useState(() => loadHistory());
  const [fullscreen, setFullscreen] = useState(false);
  const [explainMode, setExplainMode] = useState(false);

  // Feature 1: selection tracking
  const [selection, setSelection] = useState('');

  // Feature 3: font size
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('sqldojo_fontsize')) || 14);

  // Feature 4: sidebar collapse
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Feature 5: shortcut modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Persist font size
  useEffect(() => {
    localStorage.setItem('sqldojo_fontsize', String(fontSize));
  }, [fontSize]);

  // Feature 5: keyboard listener for ? and Escape
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
        return;
      }
      if (e.key === '?' && tag !== 'input' && tag !== 'textarea') {
        setShowShortcuts(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showShortcuts]);

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
    // Feature 2: don't clear results — each tab holds its own
  };

  const addTab = () => {
    const id = genId();
    const n = tabs.length + 1;
    const newTab = { id, name: t('editor.newTab', { n }), sql: '', results: null, error: null, elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: null };
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
    // Feature 1: run selection if non-empty, otherwise full query
    const sql = (selection.trim() || query).trim();
    if (!sql) return;
    // Clear current tab result before running
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: null, error: null, elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: null } : t));
    const start = performance.now();
    try {
      const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
      const allResults = [];
      for (const stmt of stmts) {
        const targetSql = explainMode && !stmt.toUpperCase().startsWith('EXPLAIN')
          ? `EXPLAIN QUERY PLAN ${stmt}`
          : stmt;
        try {
          const res = runQuery(targetSql);
          const modified = getRowsModified();
          const stmtElapsed = Math.round(performance.now() - start);
          if (res.length === 0) {
            allResults.push({ sql: stmt, results: null, error: null, elapsed: stmtElapsed, ddlSuccess: true, rowsModified: modified });
          } else {
            allResults.push({ sql: stmt, results: res, error: null, elapsed: stmtElapsed, ddlSuccess: false, rowsModified: modified });
          }
        } catch (e) {
          allResults.push({ sql: stmt, results: null, error: translateSqlError(e, t), elapsed: null, ddlSuccess: false, rowsModified: null });
          break; // stop on first error
        }
      }
      const elapsed = Math.round(performance.now() - start);
      const first = allResults[0] || {};
      const hasError = allResults.find(r => r.error);
      if (hasError) {
        const errEntry = allResults.find(r => r.error);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: null, error: errEntry.error, elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: allResults } : t));
      } else {
        setTabs(prev => prev.map(t => t.id === activeTabId ? {
          ...t,
          results: first.results,
          error: null,
          elapsed,
          ddlSuccess: first.ddlSuccess,
          rowsModified: first.rowsModified,
          multiResults: allResults,
        } : t));
      }
      refreshSchema();
      addHistory(sql);
    } catch (e) {
      setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, results: null, error: translateSqlError(e, t), elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: null } : tab));
    }
  }, [addHistory, query, selection, explainMode, activeTabId, t]);

  const clearEditor = () => {
    updateQuery('');
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: null, error: null, elapsed: null, ddlSuccess: false, rowsModified: null, multiResults: null } : t));
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(EDITOR_HISTORY_KEY); };

  const effectiveAutocomplete = editorMode !== 'terminal';

  const schemaForEditor = useMemo(() => {
    const obj = {};
    schema.forEach(tbl => { obj[tbl.name] = tbl.columns.map(c => c.col); });
    return obj;
  }, [schema]);

  // Saved queries state
  const [savedQueries, setSavedQueries] = useState(() => getSavedQueries());

  const handleSaveQuery = () => {
    const name = window.prompt(t('editor.saved.prompt'), activeTab?.name);
    if (!name || !name.trim()) return;
    const sql = (selection.trim() || query).trim();
    if (!sql) return;
    setSavedQueries(saveQuery(name, sql));
  };

  const handleDeleteSavedQuery = (id, e) => {
    e.stopPropagation();
    setSavedQueries(deleteSavedQuery(id));
  };

  // Derived result state from active tab (Feature 2)
  const results = activeTab?.results ?? null;
  const error = activeTab?.error ?? null;
  const elapsed = activeTab?.elapsed ?? null;
  const ddlSuccess = activeTab?.ddlSuccess ?? false;
  const rowsModified = activeTab?.rowsModified ?? null;
  const multiResults = activeTab?.multiResults ?? null;

  return (
    <div className={`page editor-page ${fullscreen ? 'editor-fullscreen' : ''}`}>
      <div className="page-header">
        <h2 className="page-title">{t('editor.title')}</h2>
        <span className="page-desc">{t('editor.desc')}</span>
        <button
          className="btn btn-ghost-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setFullscreen(f => !f)}
          title={fullscreen ? t('editor.fullscreen.off') : t('editor.fullscreen.on')}
        >
          {fullscreen ? <><Icon name="minimize" style={{width:14,height:14}} /> {t('editor.fullscreen.off')}</> : <><Icon name="maximize" style={{width:14,height:14}} /> {t('editor.fullscreen.on')}</>}
        </button>
      </div>

      <div className={`editor-page-layout ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
        <aside className="editor-page-sidebar">
          {/* Feature 4: sidebar toggle button */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? t('editor.sidebar.hide') : t('editor.sidebar.show')}
          >
            <Icon name={sidebarOpen ? 'chevron-left' : 'chevron-right'} style={{width:14,height:14}} />
          </button>

          {editorMode === 'beginner' && <SyntaxPicker onPick={updateQuery} />}

          <section className="editor-panel">
            <div className="sidebar-label">{t('editor.schema')}</div>
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
                    <span className="schema-row-count">{t('editor.status.rows', { n: tableStats[table.name].rowCount })}</span>
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
              <div className="sidebar-label">{t('editor.history')}</div>
              {history.length > 0 && (
                <button className="history-clear" onClick={clearHistory} type="button">{t('editor.history.clear')}</button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="editor-empty">{t('editor.history.empty')}</div>
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
          <section className="editor-panel">
            <div className="editor-panel-head">
              <div className="sidebar-label">{t('editor.saved')}</div>
            </div>
            {savedQueries.length === 0 ? (
              <div className="editor-empty">{t('editor.saved.empty')}</div>
            ) : (
              <div className="editor-history-list">
                {savedQueries.map(item => (
                  <button
                    key={item.id}
                    className="editor-history-item"
                    onClick={() => updateQuery(item.sql)}
                    type="button"
                  >
                    <span>{item.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <small>{new Date(item.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</small>
                      <span
                        style={{ cursor: 'pointer', color: 'var(--err, #dc2626)', fontSize: '12px', lineHeight: 1 }}
                        onClick={e => handleDeleteSavedQuery(item.id, e)}
                        title={t('common.delete')}
                      >×</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        {/* Feature 4: toggle button when sidebar is closed */}
        {!sidebarOpen && (
          <button
            className="sidebar-toggle-btn"
            style={{ alignSelf: 'flex-start', marginTop: '8px', marginRight: '4px' }}
            onClick={() => setSidebarOpen(o => !o)}
            title={t('editor.sidebar.show')}
          >
            <Icon name="chevron-right" style={{width:14,height:14}} />
          </button>
        )}

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
                      {tab.error
                        ? <span className="tab-status-err">✗</span>
                        : (tab.results || tab.ddlSuccess)
                          ? <span className="tab-status-ok">✓</span>
                          : null}
                    </span>
                  )}
                  {tabs.length > 1 && (
                    <button className="tab-close-btn" onClick={e => closeTab(tab.id, e)} type="button"><Icon name="close" style={{width:10,height:10}} /></button>
                  )}
                </div>
              ))}
              <button className="tab-add-btn" onClick={addTab} type="button" title={t('editor.tab.new')}>+</button>
            </div>

            <EditorModeBar mode={editorMode} onModeChange={changeEditorMode} />
            {editorMode === 'beginner' && (
              <div className="editor-helper-strip">
                {t('editor.helper.comfort')}
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
              onSelectionChange={setSelection}
              fontSize={fontSize}
            />
            <div className="editor-toolbar">
              <button className="btn btn-run" onClick={execute}>
                <Icon name="play" className="btn-icon" />
                {t('editor.run')}
              </button>
              <button className="btn btn-ghost-sm" onClick={() => updateQuery(formatSql(query))}>
                <Icon name="format" className="status-icon" />
                {t('editor.format')}
              </button>
              <button className="btn btn-ghost-sm" onClick={clearEditor}>{t('editor.clear')}</button>
              <button className="btn btn-ghost-sm" onClick={handleSaveQuery} title={t('editor.save')}>{t('editor.save')}</button>
              <button
                className={`btn btn-ghost-sm ${explainMode ? 'btn-active' : ''}`}
                onClick={() => setExplainMode(m => !m)}
                title={t('editor.explain.toggle')}
              >
                EXPLAIN {explainMode ? '✓' : ''}
              </button>

              {/* Feature 3: font size controls */}
              <div className="font-size-ctrl">
                <button className="font-sz-btn" onClick={() => setFontSize(s => Math.max(11, s - 1))}>A-</button>
                <span className="font-sz-val">{fontSize}px</span>
                <button className="font-sz-btn" onClick={() => setFontSize(s => Math.min(22, s + 1))}>A+</button>
              </div>

              {/* Feature 5: shortcut help button */}
              <button
                className="btn btn-ghost-sm"
                onClick={() => setShowShortcuts(o => !o)}
                title={t('editor.shortcut.title')}
              >
                ?
              </button>

              {/* Feature 1: selection hint */}
              {selection.trim() ? (
                <span className="editor-shortcut-hint selection-hint">{t('editor.selection.hint')}</span>
              ) : (
                <span className="editor-shortcut-hint">{t('editor.hint.ctrlEnter')}</span>
              )}
            </div>
            <div className="editor-statusbar">
              <span>{activeTab?.name}</span>
              <span>{t(`editor.mode.${editorMode}`)}</span>
              <span>{t('editor.status.tables', { n: schema.length })}</span>
              <span>{t('editor.status.rows', { n: results?.[0]?.values?.length ?? 0 })}</span>
              {elapsed != null && <span>{elapsed}ms</span>}
            </div>
          </div>

          <div className="result-card">
            {multiResults && multiResults.length > 1 ? (
              multiResults.map((entry, idx) => (
                <div key={idx} className="result-multi-card">
                  <div className="result-multi-header">
                    [{idx + 1}] {entry.sql.length > 80 ? entry.sql.slice(0, 80) + '…' : entry.sql}
                  </div>
                  {entry.ddlSuccess && !entry.error && (
                    <div className="ddl-success-msg">
                      <Icon name="success" style={{ width: 16, height: 16 }} />
                      {t('editor.ddl.success')}{entry.rowsModified != null && entry.rowsModified > 0 && t('editor.ddl.modified', { n: entry.rowsModified })}
                    </div>
                  )}
                  <ResultTable results={entry.results} error={entry.error} elapsed={entry.elapsed} rowsModified={entry.rowsModified} />
                </div>
              ))
            ) : (
              <>
                {ddlSuccess && !error && (
                  <div className="ddl-success-msg">
                    <Icon name="success" style={{ width: 16, height: 16 }} />
                    {t('editor.ddl.success')}{rowsModified != null && rowsModified > 0 && t('editor.ddl.modified', { n: rowsModified })}
                  </div>
                )}
                <ResultTable results={results} error={error} elapsed={elapsed} rowsModified={rowsModified} />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Feature 5: shortcut modal */}
      {showShortcuts && (
        <div className="shortcut-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcut-modal" onClick={e => e.stopPropagation()}>
            <div className="shortcut-modal-header">
              <h3>{t('editor.shortcut.title')}</h3>
              <button onClick={() => setShowShortcuts(false)}><Icon name="close" style={{width:14,height:14}} /></button>
            </div>
            <div className="shortcut-list">
              {[
                ['Ctrl+Enter / Cmd+Enter', t('editor.shortcut.run')],
                [t('editor.shortcut.runSel.key'), t('editor.shortcut.runSel')],
                ['Ctrl+Z', t('editor.shortcut.undo')],
                [t('editor.shortcut.format.key'), t('editor.shortcut.format')],
                ['?', t('editor.shortcut.help')],
                ['Esc', t('editor.shortcut.close')],
              ].map(([key, desc]) => (
                <div key={key} className="shortcut-row">
                  <kbd className="shortcut-key">{key}</kbd>
                  <span className="shortcut-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
