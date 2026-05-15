import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DB_TYPES,
  getUserSettings,
  resetUserSettings,
  saveUserSettings,
  saveUserSettingsWithSync,
} from '../lib/userSettings';

export default function Settings() {
  const { user } = useAuth();
  const { language, languages, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState(() => getUserSettings());
  const [saved, setSaved] = useState(false);

  const selectedDb = useMemo(
    () => DB_TYPES.find((db) => db.id === settings.dbType) ?? DB_TYPES[0],
    [settings.dbType]
  );

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const updateLanguage = (value) => {
    updateSetting('language', value);
    setLanguage(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const toSave = { ...settings, language };
    const savedSettings = user?.uid
      ? await saveUserSettingsWithSync(toSave, user.uid)
      : saveUserSettings(toSave);
    setSettings(savedSettings);
    setLanguage(savedSettings.language);
    setSaved(true);
  };

  const handleReset = async () => {
    if (!window.confirm(t('settings.resetConfirm'))) return;
    const reset = resetUserSettings();
    if (user?.uid) await saveUserSettingsWithSync(reset, user.uid).catch(() => {});
    setSettings(reset);
    setLanguage(reset.language);
    setSaved(false);
  };

  const dbStatusLabel = (db) => {
    if (!db.available) return t('db.status.soon');
    if (db.id === 'sqlite') return t('db.status.available');
    return t('db.status.reference');
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h2 className="page-title">{t('settings.title')}</h2>
        <span className="page-desc">{t('settings.desc')}</span>
      </div>

      <form className="settings-layout" onSubmit={handleSubmit}>
        <section className="settings-main">
          <div className="settings-section">
            <div className="settings-section-head">
              <Icon name="settings" className="inline-icon" />
              <h3>{t('settings.basic')}</h3>
            </div>
            <label className="settings-field">
              {t('settings.displayName')}
              <input
                value={settings.displayName}
                onChange={(event) => updateSetting('displayName', event.target.value)}
                placeholder={t('settings.displayNamePlaceholder')}
              />
            </label>
            <label className="settings-field">
              {t('settings.language')}
              <select
                value={language}
                onChange={(event) => updateLanguage(event.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.nativeLabel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="settings-section">
            <div className="settings-section-head">
              <Icon name="database" className="inline-icon" />
              <h3>{t('settings.dbType')}</h3>
            </div>
            <div className="db-type-grid">
              {DB_TYPES.map((db) => (
                <button
                  key={db.id}
                  type="button"
                  className={`db-type-card ${settings.dbType === db.id ? 'selected' : ''}`}
                  disabled={!db.available}
                  onClick={() => db.available && updateSetting('dbType', db.id)}
                >
                  <span className="db-type-card-top">
                    <span className="db-type-name">{db.name}</span>
                    <span className={`db-type-status ${db.available ? 'available' : 'soon'}`}>
                      {dbStatusLabel(db)}
                    </span>
                  </span>
                  <span className="db-type-desc">{t(`db.${db.id}.desc`)}</span>
                </button>
              ))}
            </div>
            <p className="settings-note">{t('settings.dbNote')}</p>
          </div>

          <div className="settings-section">
            <div className="settings-section-head">
              <Icon name="keyboard" className="inline-icon" />
              <h3>{t('settings.learning')}</h3>
            </div>
            <label className="settings-field">
              {t('settings.editorFontSize')}
              <input
                type="number"
                min="11"
                max="18"
                value={settings.editorFontSize}
                onChange={(event) =>
                  updateSetting('editorFontSize', Number(event.target.value))
                }
              />
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.autoSaveSql}
                onChange={(event) => updateSetting('autoSaveSql', event.target.checked)}
              />
              <span>
                {t('settings.autoSave')}
                <small>{t('settings.autoSaveHelp')}</small>
              </span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.showLearningHints}
                onChange={(event) =>
                  updateSetting('showLearningHints', event.target.checked)
                }
              />
              <span>
                {t('settings.hints')}
                <small>{t('settings.hintsHelp')}</small>
              </span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(event) => updateSetting('compactMode', event.target.checked)}
              />
              <span>
                {t('settings.compact')}
                <small>{t('settings.compactHelp')}</small>
              </span>
            </label>
          </div>
        </section>

        <aside className="settings-summary">
          <div className="settings-summary-title">{t('settings.summary')}</div>
          <div className="settings-summary-row">
            <span>{t('settings.displayName')}</span>
            <strong>{settings.displayName || t('settings.anonymous')}</strong>
          </div>
          <div className="settings-summary-row">
            <span>{t('settings.language')}</span>
            <strong>{languages.find((lang) => lang.id === language)?.nativeLabel}</strong>
          </div>
          <div className="settings-summary-row">
            <span>{t('settings.dbType')}</span>
            <strong>{selectedDb.name}</strong>
          </div>
          <div className="settings-summary-row">
            <span>{t('settings.editor')}</span>
            <strong>{settings.editorFontSize}px</strong>
          </div>
          <div className="settings-actions">
            <button className="btn btn-primary" type="submit">{t('settings.save')}</button>
            <button className="btn btn-ghost-sm" type="button" onClick={handleReset}>
              {t('settings.reset')}
            </button>
          </div>
          {saved && <div className="settings-saved">{t('settings.saved')}</div>}
        </aside>
      </form>
    </div>
  );
}
