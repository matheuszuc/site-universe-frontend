import { Link } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'

export default function NotFound() {
  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <section className="relative z-10 max-w-xl px-6 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.24em] text-cyan-100">404</p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Página não encontrada</h1>
          <p className="mt-4 text-white/75">A rota solicitada não existe neste frontend público.</p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.18)] transition hover:bg-cyan-100"
            to="/"
          >
            Voltar para Home
          </Link>
        </section>
      </main>
    </PublicLayout>
  )
}
