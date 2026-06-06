import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'

type AdminLayoutProps = {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      <aside className="panel-sidebar" aria-label="Menu administrativo do site">
        <Link className="panel-brand" to="/admin">
          <span>SU</span>
          <strong>Admin</strong>
        </Link>

        <nav className="panel-nav">
          <Link className="panel-nav-item" to="/admin">
            <i className="bx bx-shield-quarter" aria-hidden="true" />
            <span>Base Admin</span>
          </Link>
        </nav>

        <Link className="panel-home-link" to="/painel">
          <i className="bx bx-left-arrow-alt" aria-hidden="true" />
          Painel do jogador
        </Link>
      </aside>

      <div className="panel-content-shell">
        <header className="panel-topbar">
          <div>
            <p className="text-xs font-black uppercase text-cyan-100">Administração do site</p>
            <strong className="text-lg text-white">Painel Admin</strong>
          </div>
          <button
            className="panel-topbar-link"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
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
