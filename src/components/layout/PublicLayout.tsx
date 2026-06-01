import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

type PublicLayoutProps = {
  children: ReactNode
  variant?: 'home' | 'auth' | 'plain'
}

export default function PublicLayout({ children, variant = 'plain' }: PublicLayoutProps) {
  return (
    <div className={variant === 'auth' ? 'auth-page-shell' : 'min-h-screen bg-black text-white'}>
      <Header />
      {children}
      {variant !== 'home' && <Footer />}
    </div>
  )
}
