import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supportDiscordUrl } from '../../data/siteLinks'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Download', to: '/download' },
]

export default function Header() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const showGuestLinks = !isLoading && !isAuthenticated

  return (
    <header className="site-header">
      <Link to="/" className="logo" aria-label="Ir para a página inicial">
        Grand Fantasia Universe
      </Link>

      <nav aria-label="Menu principal">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <NavLink to={item.to}>{item.label}</NavLink>
            </li>
          ))}
          {showGuestLinks && (
            <>
              <li>
                <NavLink to="/login">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register">Registro</NavLink>
              </li>
            </>
          )}
          {!isLoading && isAuthenticated && (
            <li>
              <NavLink className="header-user-link" to="/painel">
                {user?.name || 'Painel'}
              </NavLink>
            </li>
          )}
          <li>
            <a href={supportDiscordUrl} target="_blank" rel="noopener noreferrer">
              Discord
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
