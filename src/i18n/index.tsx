import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import ptBR, { type Translations } from './locales/pt-BR'
import enUS from './locales/en-US'
import es from './locales/es'
import fr from './locales/fr'

export type Language = 'pt-BR' | 'en-US' | 'es' | 'fr'

export type { Translations }

const locales: Record<Language, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  es,
  fr,
}

export const LANGUAGE_OPTIONS: { value: Language; label: string; short: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)', short: 'PT' },
  { value: 'en-US', label: 'English', short: 'EN' },
  { value: 'es', label: 'Español', short: 'ES' },
  { value: 'fr', label: 'Français', short: 'FR' },
]

const STORAGE_KEY = 'su_lang'
const DEFAULT_LANG: Language = 'pt-BR'

function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved && saved in locales) return saved
  } catch {
    // ignore
  }
  return DEFAULT_LANG
}

type I18nContextValue = {
  lang: Language
  t: Translations
  setLanguage: (lang: Language) => void
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(loadLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLang(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(
    () => ({
      lang,
      t: locales[lang],
      setLanguage,
    }),
    [lang, setLanguage],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
