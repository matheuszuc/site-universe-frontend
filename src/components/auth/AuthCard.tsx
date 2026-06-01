import type { ReactNode } from 'react'
import Card from '../ui/Card'

type AuthCardProps = {
  children: ReactNode
}

export default function AuthCard({ children }: AuthCardProps) {
  return <Card className="relative z-10 w-full max-w-[460px] px-6 py-7 sm:px-9">{children}</Card>
}
