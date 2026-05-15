import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { language, languages, setLanguage } = useLanguage();

  return (
    <div className={`language-switcher ${className}`} aria-label="언어 선택">
      {languages.map((lang) => (
        <button
          key={lang.id}
          type="button"
          className={`language-btn ${language === lang.id ? 'active' : ''}`}
          onClick={() => setLanguage(lang.id)}
          title={lang.nativeLabel}
          aria-label={lang.nativeLabel}
        >
          <FlagIcon id={lang.id} />
          <span>{lang.id.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

function FlagIcon({ id }) {
  if (id === 'ja') {
    return (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden="true">
        <rect width="24" height="16" rx="2" fill="#fff" />
        <circle cx="12" cy="8" r="4.1" fill="#bc002d" />
      </svg>
    );
  }

  return (
    <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden="true">
      <rect width="24" height="16" rx="2" fill="#fff" />
      <g transform="translate(12 8) rotate(-28)">
        <path d="M0-4a4 4 0 1 1 0 8 2 2 0 1 0 0-4 2 2 0 1 1 0-4z" fill="#cd2e3a" />
        <path d="M0-4a4 4 0 1 0 0 8 2 2 0 1 1 0-4 2 2 0 1 0 0-4z" fill="#0047a0" />
      </g>
      <g stroke="#111" strokeWidth="1.1" strokeLinecap="round">
        <path d="M4.2 3.2h3.2M4.2 5h3.2M4.2 6.8h3.2" />
        <path d="M16.6 3.2h3.2M16.6 6.8h3.2" />
        <path d="M4.2 10h3.2M4.2 12.8h3.2" />
        <path d="M16.6 10h3.2M16.6 11.4h3.2M16.6 12.8h3.2" />
      </g>
    </svg>
  );
}
