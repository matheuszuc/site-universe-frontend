import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import Input from './Input'

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export default function PasswordInput({ error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        error={error}
        type={visible ? 'text' : 'password'}
        className="pr-14"
        {...props}
      />
      <button
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-700 transition hover:bg-slate-900/10"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <i className={visible ? 'bx bx-hide text-xl' : 'bx bx-show text-xl'} />
      </button>
    </div>
  )
}
