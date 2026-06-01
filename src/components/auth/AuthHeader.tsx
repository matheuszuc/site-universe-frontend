type AuthHeaderProps = {
  title: string
  subtitle?: string
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <header className="mb-7 text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
        Site Universe
      </p>
      <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-white/75">{subtitle}</p>}
    </header>
  )
}
