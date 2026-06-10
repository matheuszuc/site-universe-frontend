import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { supportDiscordUrl } from '../data/siteLinks'
import { getApiErrorMessage } from '../services/api'
import LanguageSwitcher from '../components/LanguageSwitcher'

type AuthenticatedLayoutProps = {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navItems = [
    { label: t.panel.nav.panel, to: '/painel', icon: 'bx-grid-alt' },
    { label: t.panel.nav.store, to: '/painel/loja', icon: 'bx-store' },
    { label: t.panel.nav.rewards, to: '/painel/recompensas', icon: 'bx-gift' },
    { label: t.panel.nav.support, href: supportDiscordUrl, icon: 'bx-support', external: true },
  ]

  async function handleLogout() {
    setIsLoggingOut(true)
    setErrorMessage(undefined)

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="panel-shell">
      <aside className="panel-sidebar" aria-label={t.panel.menuLabel}>
        <Link className="panel-brand" to="/painel">
          <span>GF</span>
          <strong>Universe</strong>
        </Link>

        <nav className="panel-nav">
          {navItems.map((item) =>
            'external' in item ? (
              <a
                className="panel-nav-item"
                href={item.href}
                key={item.label}
                rel="noopener noreferrer"
                target="_blank"
              >
                <i className={`bx ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            ) : (
              <NavLink className="panel-nav-item" key={item.label} to={item.to}>
                <i className={`bx ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <Link className="panel-home-link" to="/">
          <i className="bx bx-left-arrow-alt" aria-hidden="true" />
          {t.panel.homeLink}
        </Link>
      </aside>

      <div className="panel-content-shell">
        <header className="panel-topbar">
          <div>
            <p className="text-xs font-black uppercase text-cyan-100">{t.panel.playerArea}</p>
            <strong className="text-lg text-white">{t.panel.userPanel}</strong>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              className="panel-topbar-link"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? t.panel.loggingOut : t.panel.logout}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200/40 bg-red-200/12 px-4 py-3 text-sm text-red-50" role="alert">
            {errorMessage}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
