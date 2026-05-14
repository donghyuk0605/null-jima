import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import {
  DB_TYPES,
  getUserSettings,
  resetUserSettings,
  saveUserSettings,
} from '../lib/userSettings';

export default function Settings() {
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setSettings(saveUserSettings(settings));
    setSaved(true);
  };

  const handleReset = () => {
    if (!window.confirm('사용자 설정을 기본값으로 되돌릴까요?')) return;
    setSettings(resetUserSettings());
    setSaved(false);
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h2 className="page-title">사용자 설정</h2>
        <span className="page-desc">학습 환경과 기본 DB 종류를 조정하세요</span>
      </div>

      <form className="settings-layout" onSubmit={handleSubmit}>
        <section className="settings-main">
          <div className="settings-section">
            <div className="settings-section-head">
              <Icon name="settings" className="inline-icon" />
              <h3>기본 정보</h3>
            </div>
            <label className="settings-field">
              표시 이름
              <input
                value={settings.displayName}
                onChange={(event) => updateSetting('displayName', event.target.value)}
                placeholder="커뮤니티에서 사용할 이름"
              />
            </label>
          </div>

          <div className="settings-section">
            <div className="settings-section-head">
              <Icon name="database" className="inline-icon" />
              <h3>DB 종류</h3>
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
                      {db.status}
                    </span>
                  </span>
                  <span className="db-type-desc">{db.description}</span>
                </button>
              ))}
            </div>
            <p className="settings-note">
              현재 쿼리 실행은 SQLite 엔진을 사용합니다. 다른 DB 종류는 문법 학습 기준으로 먼저 제공합니다.
            </p>
          </div>

          <div className="settings-section">
            <div className="settings-section-head">
              <Icon name="keyboard" className="inline-icon" />
              <h3>학습 기능</h3>
            </div>
            <label className="settings-field">
              에디터 글자 크기
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
                작성 중인 SQL 자동 저장
                <small>문제와 자유 연습에서 작성하던 쿼리를 이어서 볼 수 있게 준비합니다.</small>
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
                학습 힌트 표시
                <small>문제 풀이 중 필요한 개념 힌트를 보여주는 옵션입니다.</small>
              </span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(event) => updateSetting('compactMode', event.target.checked)}
              />
              <span>
                압축 보기
                <small>목록과 표의 여백을 줄이는 화면 모드입니다.</small>
              </span>
            </label>
          </div>
        </section>

        <aside className="settings-summary">
          <div className="settings-summary-title">현재 설정</div>
          <div className="settings-summary-row">
            <span>표시 이름</span>
            <strong>{settings.displayName || '익명'}</strong>
          </div>
          <div className="settings-summary-row">
            <span>DB 종류</span>
            <strong>{selectedDb.name}</strong>
          </div>
          <div className="settings-summary-row">
            <span>에디터</span>
            <strong>{settings.editorFontSize}px</strong>
          </div>
          <div className="settings-actions">
            <button className="btn btn-primary" type="submit">저장</button>
            <button className="btn btn-ghost-sm" type="button" onClick={handleReset}>
              초기화
            </button>
          </div>
          {saved && <div className="settings-saved">설정이 저장되었습니다.</div>}
        </aside>
      </form>
    </div>
  );
}
