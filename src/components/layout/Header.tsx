import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../i18n'
import { supportDiscordUrl } from '../../data/siteLinks'
import LanguageSwitcher from '../LanguageSwitcher'

const publicNavItems = (t: ReturnType<typeof useTranslation>['t']) => [
  { label: t.nav.home, to: '/' },
  { label: t.nav.download, to: '/download' },
]

export default function Header() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { t } = useTranslation()
  const showGuestLinks = !isLoading && !isAuthenticated

  return (
    <header className="site-header">
      <Link to="/" className="logo" aria-label="Ir para a página inicial">
        Grand Fantasia Universe
      </Link>

      <nav aria-label="Menu principal">
        <ul>
          {publicNavItems(t).map((item) => (
            <li key={item.label}>
              <NavLink to={item.to}>{item.label}</NavLink>
            </li>
          ))}
          {showGuestLinks && (
            <>
              <li>
                <NavLink to="/login">{t.nav.login}</NavLink>
              </li>
              <li>
                <NavLink to="/register">{t.nav.register}</NavLink>
              </li>
            </>
          )}
          {!isLoading && isAuthenticated && (
            <li>
              <NavLink className="header-user-link" to="/painel">
                {user?.name || t.nav.dashboard}
              </NavLink>
            </li>
          )}
          <li>
            <a href={supportDiscordUrl} target="_blank" rel="noopener noreferrer">
              {t.nav.discord}
            </a>
          </li>
          <li>
            <LanguageSwitcher />
          </li>
        </ul>
      </nav>
    </header>
  )
}
