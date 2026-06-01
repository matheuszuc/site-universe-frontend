import type { InputHTMLAttributes } from 'react'
import { classNames } from '../../utils/classNames'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export default function Input({ className, error, id, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={classNames(
        'min-h-12 w-full rounded-full border bg-white/85 px-5 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-cyan-200 focus:bg-white focus:ring-2 focus:ring-cyan-200/60',
        error ? 'border-red-300 ring-2 ring-red-400/30' : 'border-white/70',
        className,
      )}
      id={id}
      {...props}
    />
  )
}
