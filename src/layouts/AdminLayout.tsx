import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { getApiErrorMessage } from '../services/api'
import LanguageSwitcher from '../components/LanguageSwitcher'

type AdminLayoutProps = {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navItems = [
    { label: t.admin.baseLink, to: '/admin', icon: 'bx-shield-quarter', exact: true },
    { label: t.admin.usersLink, to: '/admin/users', icon: 'bx-group' },
    { label: t.admin.ordersLink, to: '/admin/orders', icon: 'bx-receipt' },
    { label: t.admin.gameDeliveriesLink, to: '/admin/game-deliveries', icon: 'bx-package' },
    { label: t.admin.auditLogsLink, to: '/admin/audit-logs', icon: 'bx-history' },
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
      <aside className="panel-sidebar" aria-label={t.admin.menuLabel}>
        <Link className="panel-brand" to="/admin">
          <span>{t.admin.brandShort}</span>
          <strong>{t.admin.brandTitle}</strong>
        </Link>

        <nav className="panel-nav">
          {navItems.map((item) => (
            <NavLink
              className="panel-nav-item"
              end={item.exact}
              key={item.to}
              to={item.to}
            >
              <i className={`bx ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <Link className="panel-home-link" to="/painel">
          <i className="bx bx-left-arrow-alt" aria-hidden="true" />
          {t.admin.playerPanelLink}
        </Link>
      </aside>

      <div className="panel-content-shell">
        <header className="panel-topbar">
          <div>
            <p className="text-xs font-black uppercase text-cyan-100">{t.admin.administrationLabel}</p>
            <strong className="text-lg text-white">{t.admin.panelTitle}</strong>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              className="panel-topbar-link"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? t.admin.signingOut : t.admin.signOut}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div
            className="mx-4 mt-4 rounded-lg border border-red-200/40 bg-red-200/12 px-4 py-3 text-sm text-red-50"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
