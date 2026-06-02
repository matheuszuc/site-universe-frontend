import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Controle visual temporário para montar a área logada.
  // O frontend não protege sozinho área sensível e não deve confiar em localStorage como segurança real.
  // Backend será responsável por autenticação, autorização, saldo, pagamentos e recompensas.
  const isVisuallyAuthenticated = true

  if (!isVisuallyAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
