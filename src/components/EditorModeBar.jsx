import { EDITOR_MODES } from '../lib/editorModes';
import { useLanguage } from '../contexts/LanguageContext';

export default function EditorModeBar({ mode, onModeChange }) {
  const { t } = useLanguage();
  return (
    <div className="editor-mode-bar" role="group" aria-label={t('editor.mode.label')}>
      {EDITOR_MODES.map((item) => (
        <button
          key={item.id}
          className={`editor-mode-btn ${mode === item.id ? 'active' : ''}`}
          onClick={() => onModeChange(item.id)}
          title={t(item.descKey)}
          type="button"
        >
          <span>{t(item.labelKey)}</span>
          <strong>{t(item.titleKey)}</strong>
        </button>
      ))}
    </div>
  );
}
