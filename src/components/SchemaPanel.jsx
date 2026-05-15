import Icon from './Icon';
import { useLanguage } from '../contexts/LanguageContext';

export default function SchemaPanel({ schema }) {
  const { t } = useLanguage();
  return (
    <div className="schema-panel">
      <div className="schema-title">{t('schema.title')}</div>
      {schema.map((table) => (
        <div key={table.name} className="schema-table">
          <div className="schema-table-name">
            <Icon name="table" className="schema-table-icon" />
            {table.name}
          </div>
          <div className="schema-columns">
            {table.columns.map((col) => (
              <div key={col.col} className="schema-col">
                <span className="col-name">{col.col}</span>
                <span className="col-type">{col.type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
