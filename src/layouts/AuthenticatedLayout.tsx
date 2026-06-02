import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'

type AuthenticatedLayoutProps = {
  children: ReactNode
}

const navItems = [
  { label: 'Painel', to: '/painel', icon: 'bx-grid-alt' },
  { label: 'Loja', to: '#', icon: 'bx-store', disabled: true },
  { label: 'Suporte', to: '#', icon: 'bx-support', disabled: true },
]

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
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
      <aside className="panel-sidebar" aria-label="Menu da área logada">
        <Link className="panel-brand" to="/painel">
          <span>GF</span>
          <strong>Universe</strong>
        </Link>

        <nav className="panel-nav">
          {navItems.map((item) =>
            item.disabled ? (
              <button className="panel-nav-item" disabled key={item.label} type="button">
                <i className={`bx ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
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
          Home
        </Link>
      </aside>

      <div className="panel-content-shell">
        <header className="panel-topbar">
          <div>
            <p className="text-xs font-black uppercase text-cyan-100">Área do jogador</p>
            <strong className="text-lg text-white">Painel do Usuário</strong>
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
          <div className="mx-4 mt-4 rounded-lg border border-red-200/40 bg-red-200/12 px-4 py-3 text-sm text-red-50" role="alert">
            {errorMessage}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
