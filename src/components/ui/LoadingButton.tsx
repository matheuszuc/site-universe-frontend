import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Button from './Button'

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  isLoading?: boolean
  loadingText?: string
}

export default function LoadingButton({
  children,
  disabled,
  isLoading = false,
  loadingText = 'Enviando...',
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
