import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/70 px-6 py-5 text-sm text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p>Grand Fantasia Universe. Uma nova jornada começa aqui.</p>
        <nav className="flex flex-wrap justify-center gap-4" aria-label="Links legais">
          <Link className="font-semibold hover:text-white" to="/terms">
            Termos de Uso
          </Link>
          <Link className="font-semibold hover:text-white" to="/privacy">
            Política de Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  )
}
