import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Login', to: '/login' },
  { label: 'Loja', to: '#loja' },
  { label: 'Escala', to: '#escala' },
  { label: 'Download', to: '#download' },
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
              {item.to.startsWith('#') ? (
                <a href={item.to}>{item.label}</a>
              ) : (
                <NavLink to={item.to}>{item.label}</NavLink>
              )}
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
