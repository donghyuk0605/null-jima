import { EDITOR_MODES } from '../lib/editorModes';

export default function EditorModeBar({ mode, onModeChange }) {
  return (
    <div className="editor-mode-bar" role="group" aria-label="에디터 모드">
      {EDITOR_MODES.map((item) => (
        <button
          key={item.id}
          className={`editor-mode-btn ${mode === item.id ? 'active' : ''}`}
          onClick={() => onModeChange(item.id)}
          title={item.description}
          type="button"
        >
          <span>{item.label}</span>
          <strong>{item.title}</strong>
        </button>
      ))}
    </div>
  );
}
