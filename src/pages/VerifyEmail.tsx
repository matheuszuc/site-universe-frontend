import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import LoadingButton from '../components/ui/LoadingButton'
import { resendVerificationEmail } from '../features/auth/services/authApi'

type VerifyEmailState = {
  email?: string
}

export default function VerifyEmail() {
  const location = useLocation()
  const { email } = (location.state ?? {}) as VerifyEmailState
  const [cooldown, setCooldown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (cooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    setIsSending(true)
    const result = await resendVerificationEmail(email)
    setMessage(result.message)
    setCooldown(60)
    setIsSending(false)
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title="Verifique seu e-mail"
            subtitle="Enviamos um link de verificação para o e-mail informado."
          />

          <div className="space-y-5">
            <Alert>
              {email
                ? `Confira a caixa de entrada de ${email}.`
                : 'Confira a caixa de entrada do e-mail usado no cadastro.'}
            </Alert>

            {message && <Alert tone="success">{message}</Alert>}

            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/60 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20" to="/login">
                Voltar ao login
              </Link>
              <LoadingButton
                className="w-full"
                disabled={cooldown > 0}
                isLoading={isSending}
                loadingText="Reenviando..."
                onClick={handleResend}
                type="button"
              >
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar e-mail'}
              </LoadingButton>
            </div>
          </div>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
