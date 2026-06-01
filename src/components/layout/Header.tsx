import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Login', to: '/login' },
  { label: 'Registro', to: '/register' },
]

export default function Header() {
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
          <li>
            <a href="https://discord.gg/jWeYzgqw" target="_blank" rel="noreferrer">
              Discord
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
