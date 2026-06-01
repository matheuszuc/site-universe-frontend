import type { ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

type AlertProps = {
  children: ReactNode
  tone?: 'info' | 'success' | 'error'
}

const tones = {
  info: 'border-cyan-200/40 bg-cyan-200/12 text-cyan-50',
  success: 'border-emerald-200/40 bg-emerald-200/12 text-emerald-50',
  error: 'border-red-200/40 bg-red-200/12 text-red-50',
}

export default function Alert({ children, tone = 'info' }: AlertProps) {
  return (
    <div
      className={classNames(
        'rounded-lg border px-4 py-3 text-sm leading-relaxed',
        tones[tone],
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
