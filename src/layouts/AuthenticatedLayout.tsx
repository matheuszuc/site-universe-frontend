import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

type AuthenticatedLayoutProps = {
  children: ReactNode
}

const navItems = [
  { label: 'Painel', to: '/painel', icon: 'bx-grid-alt' },
  { label: 'Loja', to: '#', icon: 'bx-store', disabled: true },
  { label: 'Suporte', to: '#', icon: 'bx-support', disabled: true },
]

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
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
          {/* Logout real será integrado futuramente ao backend. */}
          <Link className="panel-topbar-link" to="/login">
            Sair
          </Link>
        </header>

        {children}
      </div>
    </div>
  )
}
