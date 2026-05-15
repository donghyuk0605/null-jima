import { useState } from 'react';
import { SQL_SNIPPET_GROUPS } from '../lib/editorModes';
import Icon from './Icon';

export default function SyntaxPicker({ onPick, compact = false }) {
  const [openGroup, setOpenGroup] = useState(SQL_SNIPPET_GROUPS[0]?.group ?? null);

  return (
    <div className={`syntax-picker ${compact ? 'compact' : ''}`}>
      <div className="sidebar-label">문법 선택</div>
      {SQL_SNIPPET_GROUPS.map((group) => (
        <div key={group.group} className="syntax-group">
          <button
            className="syntax-group-header"
            onClick={() => setOpenGroup((prev) => (prev === group.group ? null : group.group))}
            type="button"
          >
            <span>{group.group}</span>
            <span className="ex-group-chevron"><Icon name={openGroup === group.group ? 'chevron-down' : 'chevron-right'} style={{width:12,height:12}} /></span>
          </button>
          {openGroup === group.group && (
            <div className="syntax-items">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className="syntax-item"
                  onClick={() => onPick(item.sql)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
