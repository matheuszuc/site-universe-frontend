import type { HTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../utils/classNames'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        'rounded-lg border border-white/30 bg-slate-950/38 shadow-[10px_8px_24px_rgba(255,255,255,0.16)] backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
