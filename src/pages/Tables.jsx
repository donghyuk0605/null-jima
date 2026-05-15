import { useState } from 'react';
import { getSchema, runQuery } from '../lib/database';
import Icon from '../components/Icon';
import ResultTable from '../components/ResultTable';
import ERDiagram from '../components/ERDiagram';
import { useLanguage } from '../contexts/LanguageContext';

const RELATIONS = [
  'employees.department_id  →  departments.id',
  'orders.employee_id  →  employees.id',
  'orders.product_id   →  products.id',
];

const getTablePreview = (tbl) => {
  if (!tbl) return null;
  try {
    return runQuery(`SELECT * FROM ${tbl.name} LIMIT 5`);
  } catch {
    return null;
  }
};

export default function Tables() {
  const { t } = useLanguage();
  const [showER, setShowER] = useState(false);
  const [schema] = useState(() => getSchema());
  const [selected, setSelected] = useState(() => {
    const s = getSchema();
    return s[0] || null;
  });
  const [preview, setPreview] = useState(() => getTablePreview(getSchema()[0]));

  const selectTable = (tbl) => {
    setSelected(tbl);
    setPreview(getTablePreview(tbl));
  };

  return (
    <div className="page">
      {showER && <ERDiagram onClose={() => setShowER(false)} />}
      <div className="page-header">
        <h2 className="page-title">{t('tables.title')}</h2>
        <span className="page-desc">{t('tables.desc')}</span>
        <button className="btn btn-ghost-sm" onClick={() => setShowER(s => !s)}>{t('tables.er')}</button>
      </div>

      <div className="tables-layout">
        {/* 테이블 목록 */}
        <aside className="tables-sidebar">
          <div className="sidebar-label">{t('tables.sidebar.label')}</div>
          {schema.map((tbl) => (
            <button
              key={tbl.name}
              className={`table-btn ${selected?.name === tbl.name ? 'selected' : ''}`}
              onClick={() => selectTable(tbl)}
            >
              <Icon name="table" className="inline-icon" />
              {tbl.name}
            </button>
          ))}

          <div className="sidebar-label" style={{ marginTop: 20 }}>{t('tables.relations.label')}</div>
          <div className="relations">
            {RELATIONS.map((r, i) => (
              <div key={i} className="relation-row">{r}</div>
            ))}
          </div>
        </aside>

        {/* 테이블 상세 */}
        <div className="tables-main">
          <section className="erd-section">
            <div className="preview-label">{t('tables.erd.label')}</div>
            <div className="erd-canvas">
              <div className="erd-node erd-departments">
                <strong>departments</strong>
                <span>id PK</span>
                <span>name</span>
              </div>
              <div className="erd-node erd-employees">
                <strong>employees</strong>
                <span>id PK</span>
                <span>department_id FK</span>
              </div>
              <div className="erd-node erd-orders">
                <strong>orders</strong>
                <span>id PK</span>
                <span>employee_id FK</span>
                <span>product_id FK</span>
              </div>
              <div className="erd-node erd-products">
                <strong>products</strong>
                <span>id PK</span>
                <span>name</span>
              </div>
              <svg className="erd-lines" viewBox="0 0 620 220" aria-hidden="true">
                <path d="M150 72 C220 72 230 72 300 72" />
                <path d="M390 112 C430 132 455 132 495 112" />
                <path d="M390 152 C430 176 455 176 495 176" />
              </svg>
            </div>
          </section>

          {selected && (
            <>
              <h3 className="table-detail-title">
                <Icon name="table" className="table-detail-icon" />
                {selected.name}
              </h3>

              <div className="column-table-wrap">
                <table className="column-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('tables.col.name')}</th>
                      <th>{t('tables.col.type')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.columns.map((col, i) => (
                      <tr key={col.col}>
                        <td className="col-idx">{i + 1}</td>
                        <td className="col-nm-cell">{col.col}</td>
                        <td><span className="col-tp-badge">{col.type || 'TEXT'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="preview-label">{t('tables.sample.limit')}</div>
              <ResultTable results={preview} error={null} elapsed={null} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
