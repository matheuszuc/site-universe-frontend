import { useRef, useState } from 'react'
import { LANGUAGE_OPTIONS, useTranslation, type Language } from '../i18n'

type LanguageSwitcherProps = {
  className?: string
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { lang, t, setLanguage } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = LANGUAGE_OPTIONS.find((o) => o.value === lang)!

  function handleSelect(value: Language) {
    setLanguage(value)
    setOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') setOpen(false)
  }

  return (
    <div
      className={`lang-switcher ${className}`}
      onKeyDown={handleKeyDown}
      ref={containerRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.languageSwitcher.label}: ${current.label}`}
        className="lang-switcher-btn"
        onClick={() => setOpen((v) => !v)}
        title={`${t.languageSwitcher.label}: ${current.label}`}
        type="button"
      >
        <span aria-hidden="true" className="lang-short">{current.short}</span>
        <i className="bx bx-globe" aria-hidden="true" />
      </button>

      {open && (
        <ul
          aria-label={t.languageSwitcher.label}
          className="lang-dropdown"
          role="listbox"
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === lang}>
              <button
                className={`lang-option ${option.value === lang ? 'lang-option--active' : ''}`}
                onClick={() => handleSelect(option.value)}
                type="button"
              >
                <span className="lang-short">{option.short}</span>
                <span>{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
