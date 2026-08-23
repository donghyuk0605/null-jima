import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSchema, runQuery, translateSqlError, getRowsModified, getTableStats, resetWorkspaceDatabase } from '../lib/database';
import { formatSql } from '../lib/sqlFormatter';
import { getStoredEditorMode, saveStoredEditorMode } from '../lib/editorModes';
import EditorModeBar from '../components/EditorModeBar';
import SyntaxPicker from '../components/SyntaxPicker';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import SqlEditor from '../components/SqlEditor';
import { getSavedQueries, saveQuery, deleteSavedQuery } from '../lib/savedQueries';
import { useLanguage } from '../contexts/LanguageContext';
import { sanitizeJapaneseText } from '../lib/localizedContent';
import { saveUserSettings, useUserSettings } from '../lib/userSettings';
import { splitSqlStatements } from '../lib/sqlStatements';

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
  const { language, t } = useLanguage();
  const settings = useUserSettings();
  const safeText = (value) => (language === 'ja' ? sanitizeJapaneseText(value) : value);
  const locale = language === 'ja' ? 'ja-JP' : 'ko-KR';
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
  const [schemaFilter, setSchemaFilter] = useState('');
  const [expandedTables, setExpandedTables] = useState(() => new Set(getSchema().slice(0, 2).map((table) => table.name)));

  // Feature 1: selection tracking
  const [selection, setSelection] = useState('');

  // Feature 3: font size
  const [fontSize, setFontSize] = useState(() => settings.editorFontSize || 13);

  // Feature 4: sidebar collapse
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(max-width: 760px)').matches
  );

  // Feature 5: shortcut modal
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Persist font size
  useEffect(() => {
    localStorage.setItem('sqldojo_fontsize', String(fontSize));
    if (settings.editorFontSize !== fontSize) {
      saveUserSettings({ ...settings, editorFontSize: fontSize });
    }
  }, [fontSize, settings]);

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
      if (settings.autoSaveSql) saveTabs(next);
      return next;
    });
  }, [activeTabId, settings.autoSaveSql]);

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
      const stmts = splitSqlStatements(sql);
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

  const resetWorkspace = async () => {
    if (!window.confirm(t('editor.database.resetConfirm'))) return;
    await resetWorkspaceDatabase();
    refreshSchema();
    setTabs(prev => prev.map(tab => ({ ...tab, results: null, error: null, multiResults: null })));
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem(EDITOR_HISTORY_KEY); };

  const effectiveAutocomplete = editorMode !== 'terminal';

  const schemaForEditor = useMemo(() => {
    const obj = {};
    schema.forEach(tbl => { obj[tbl.name] = tbl.columns.map(c => c.col); });
    return obj;
  }, [schema]);

  const filteredSchema = useMemo(() => {
    const keyword = schemaFilter.trim().toLowerCase();
    if (!keyword) return schema;
    return schema.filter((table) => (
      table.name.toLowerCase().includes(keyword)
      || table.columns.some((column) => column.col.toLowerCase().includes(keyword))
    ));
  }, [schema, schemaFilter]);

  const toggleTable = (tableName) => {
    setExpandedTables((current) => {
      const next = new Set(current);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  };

  const openTableQuery = (tableName) => {
    updateQuery(`SELECT *\nFROM ${tableName}\nLIMIT 10;`);
    if (window.matchMedia('(max-width: 760px)').matches) setSidebarOpen(false);
  };

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
      <div className="page-header editor-studio-header">
        <div className="editor-header-copy">
          <span className="editor-eyebrow"><span className="editor-runtime-dot" />{t('editor.eyebrow')}</span>
          <div className="editor-title-row">
            <h2 className="page-title">{t('editor.title')}</h2>
            <span className="editor-version">BETA</span>
          </div>
          <p className="page-desc">{t('editor.desc')}</p>
          <div className="editor-runtime-badges">
            <span><Icon name="bolt" />{t('editor.runtime.browser')}</span>
            <span><Icon name="database" />{t('editor.runtime.dataset', { n: schema.length })}</span>
            <span><Icon name="save" />{t('editor.runtime.autosave')}</span>
          </div>
        </div>
        <div className="editor-header-actions">
          <button
            className={`btn btn-ghost-sm editor-data-toggle${sidebarOpen ? ' active' : ''}`}
            onClick={() => setSidebarOpen((open) => !open)}
            aria-pressed={sidebarOpen}
          >
            <Icon name="database" />
            {sidebarOpen ? t('editor.sidebar.hide') : t('editor.sidebar.show')}
          </button>
          <button
            className="btn btn-ghost-sm"
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? t('editor.fullscreen.off') : t('editor.fullscreen.on')}
          >
            {fullscreen ? <><Icon name="minimize" /> {t('editor.fullscreen.off')}</> : <><Icon name="maximize" /> {t('editor.fullscreen.on')}</>}
          </button>
        </div>
      </div>

      <div className={`editor-page-layout ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
        <aside className="editor-page-sidebar">
          {editorMode === 'beginner' && <SyntaxPicker onPick={updateQuery} />}

          <section className="editor-panel editor-schema-panel">
            <div className="editor-sidebar-heading">
              <div>
                <span>DATASET</span>
                <strong>{t('editor.schema')}</strong>
              </div>
              <em>{schema.length}</em>
            </div>
            <label className="schema-search">
              <Icon name="search" />
              <input
                type="search"
                value={schemaFilter}
                onChange={(event) => setSchemaFilter(event.target.value)}
                placeholder={t('editor.schema.search')}
                aria-label={t('editor.schema.search')}
              />
            </label>
            <div className="schema-table-list">
              {filteredSchema.map((table) => {
                const expanded = expandedTables.has(table.name);
                return (
                  <div key={table.name} className={`schema-tbl${expanded ? ' expanded' : ''}`}>
                    <div className="schema-tbl-head">
                      <button className="schema-tbl-name" onClick={() => toggleTable(table.name)} type="button" aria-expanded={expanded}>
                        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} className="schema-chevron" />
                        <Icon name="table" className="inline-icon" />
                        <span className="schema-tbl-label">{table.name}</span>
                        {tableStats[table.name] && (
                          <span className="schema-row-count">{tableStats[table.name].rowCount}</span>
                        )}
                      </button>
                      <button className="schema-open-query" onClick={() => openTableQuery(table.name)} type="button" title={t('editor.schema.open', { table: table.name })} aria-label={t('editor.schema.open', { table: table.name })}>
                        <Icon name="play" />
                      </button>
                    </div>
                    {expanded && (
                      <div className="schema-cols">
                        {table.columns.map(col => (
                          <button key={col.col} className="schema-col-row" type="button" onClick={() => updateQuery(`${query}${query && !query.endsWith(' ') ? ' ' : ''}${col.col}`)}>
                            <span className="col-nm">{col.col}</span>
                            <span className="col-tp">{col.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredSchema.length === 0 && <div className="editor-empty schema-empty">{t('editor.schema.empty')}</div>}
            </div>
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
                    <span>{safeText(item.sql.split('\n')[0])}</span>
                    <small>{new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</small>
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
                  <div key={item.id} className="editor-history-item editor-saved-item">
                    <button className="editor-saved-load" onClick={() => updateQuery(item.sql)} type="button">
                      <span>{safeText(item.name)}</span>
                      <small>{new Date(item.createdAt).toLocaleDateString(locale, { month: '2-digit', day: '2-digit' })}</small>
                    </button>
                    <button
                      className="editor-saved-delete"
                      onClick={e => handleDeleteSavedQuery(item.id, e)}
                      title={t('common.delete')}
                      aria-label={t('common.delete')}
                      type="button"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
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
                      {safeText(tab.name)}
                      {tab.error
                        ? <Icon name="error" className="tab-status-err" />
                        : (tab.results || tab.ddlSuccess)
                          ? <Icon name="success" className="tab-status-ok" />
                          : null}
                    </span>
                  )}
                  {tabs.length > 1 && (
                    <button className="tab-close-btn" onClick={e => closeTab(tab.id, e)} type="button"><Icon name="close" style={{width:10,height:10}} /></button>
                  )}
                </div>
              ))}
              <button className="tab-add-btn" onClick={addTab} type="button" title={t('editor.tab.new')} aria-label={t('editor.tab.new')}>
                <Icon name="plus" />
              </button>
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
              <div className="editor-toolbar-run">
                <button className="btn btn-run" onClick={execute}>
                  <Icon name="play" className="btn-icon" />
                  {t('editor.run')}
                </button>
                {selection.trim() ? (
                  <span className="editor-shortcut-hint selection-hint">{t('editor.selection.hint')}</span>
                ) : (
                  <span className="editor-shortcut-hint"><kbd>Ctrl</kbd><kbd>Enter</kbd></span>
                )}
              </div>
              <div className="editor-toolbar-tools">
                <button className="btn btn-ghost-sm" onClick={() => updateQuery(formatSql(query))}>
                  <Icon name="format" className="status-icon" />
                  {t('editor.format')}
                </button>
                <button className="btn btn-ghost-sm" onClick={handleSaveQuery} title={t('editor.save')}><Icon name="save" className="status-icon" />{t('editor.save')}</button>
                <button
                  className={`btn btn-ghost-sm ${explainMode ? 'btn-active' : ''}`}
                  onClick={() => setExplainMode(m => !m)}
                  title={t('editor.explain.toggle')}
                >
                  EXPLAIN {explainMode && <Icon name="success" className="status-icon" />}
                </button>
                <button className="btn btn-ghost-sm" onClick={clearEditor}>{t('editor.clear')}</button>
                <button className="btn btn-ghost-sm editor-reset-btn" onClick={resetWorkspace}>{t('editor.database.reset')}</button>
                <div className="font-size-ctrl">
                  <button className="font-sz-btn" onClick={() => setFontSize(s => Math.max(11, s - 1))} aria-label="Decrease editor font size"><span>A</span><Icon name="minus" /></button>
                  <span className="font-sz-val">{fontSize}px</span>
                  <button className="font-sz-btn" onClick={() => setFontSize(s => Math.min(22, s + 1))} aria-label="Increase editor font size"><span>A</span><Icon name="plus" /></button>
                </div>
                <button className="btn btn-ghost-sm editor-help-btn" onClick={() => setShowShortcuts(o => !o)} title={t('editor.shortcut.title')} aria-label={t('editor.shortcut.title')}>
                  <Icon name="help" className="status-icon" />
                </button>
              </div>
            </div>
            <div className="editor-statusbar">
              <span>{safeText(activeTab?.name)}</span>
              <span>{t(`editor.mode.${editorMode}`)}</span>
              <span>{t('editor.status.tables', { n: schema.length })}</span>
              <span>{t('editor.status.rows', { n: results?.[0]?.values?.length ?? 0 })}</span>
              {elapsed != null && <span>{elapsed}ms</span>}
            </div>
          </div>

          <section className={`editor-result-workbench${error ? ' has-error' : ''}${results ? ' has-results' : ''}`}>
            <div className="editor-result-head">
              <div>
                <span>RESULT</span>
                <strong>{error ? t('editor.result.error') : results ? t('editor.result.ready') : t('editor.result.empty')}</strong>
              </div>
              <div className="editor-result-metrics">
                {elapsed != null && <span>{elapsed}ms</span>}
                <span>{t('editor.status.rows', { n: results?.[0]?.values?.length ?? 0 })}</span>
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
          </section>
        </main>
      </div>

      {/* Feature 5: shortcut modal */}
      {showShortcuts && (
        <div className="shortcut-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-dialog-title" onClick={e => e.stopPropagation()}>
            <div className="shortcut-modal-header">
              <h3 id="shortcut-dialog-title">{t('editor.shortcut.title')}</h3>
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
