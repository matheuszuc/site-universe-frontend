import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import LoadingButton from '../components/ui/LoadingButton'
import { authApi } from '../features/auth/services/authApi'
import type { AuthApiResult } from '../features/auth/types/authTypes'
import { getApiErrorMessage } from '../services/api'

type VerifyEmailState = {
  email?: string
  mode?: 'sent'
}

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error'

const verificationRequestsByToken = new Map<string, Promise<AuthApiResult>>()

export default function VerifyEmail() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { email } = (location.state ?? {}) as VerifyEmailState
  const token = searchParams.get('token')?.trim() ?? ''
  const activeTokenRef = useRef<string | null>(null)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [isConfirmingCode, setIsConfirmingCode] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    token ? 'loading' : 'idle',
  )

  useEffect(() => {
    activeTokenRef.current = token || null
    setMessage(undefined)
    setErrorMessage(undefined)

    if (!token) {
      setVerificationStatus('idle')
      setMessage('Enviamos um código de confirmação para seu e-mail. Confirme para liberar sua conta.')
      return
    }

    setVerificationStatus('loading')

    let isCurrentEffect = true
    let verificationRequest = verificationRequestsByToken.get(token)

    if (!verificationRequest) {
      verificationRequest = authApi.verifyEmail(token)
      verificationRequestsByToken.set(token, verificationRequest)
    }

    verificationRequest
      .then(() => {
        if (!isCurrentEffect || activeTokenRef.current !== token) {
          return
        }

        setVerificationStatus('success')
        setMessage('E-mail verificado com sucesso.')
      })
      .catch(() => {
        if (!isCurrentEffect || activeTokenRef.current !== token) {
          return
        }

        setVerificationStatus('error')
        setErrorMessage('Token inválido ou expirado.')
      })
      .finally(() => {
        if (verificationRequestsByToken.get(token) === verificationRequest) {
          verificationRequestsByToken.delete(token)
        }
      })

    return () => {
      isCurrentEffect = false
    }
  }, [token])

  useEffect(() => {
    if (cooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (!email) {
      setErrorMessage('Informe o e-mail para reenviar a verificação.')
      return
    }

    setIsSending(true)
    setMessage(undefined)
    setErrorMessage(undefined)

    try {
      const result = await authApi.resendVerification(email)
      setMessage(result.message)
      setCooldown(60)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  async function handleConfirmCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email) {
      setErrorMessage('Informe o e-mail para confirmar o código.')
      return
    }

    if (!/^\d{6,8}$/.test(code.trim())) {
      setErrorMessage('Informe o código de confirmação recebido por e-mail.')
      return
    }

    setIsConfirmingCode(true)
    setMessage(undefined)
    setErrorMessage(undefined)

    try {
      const result = await authApi.verifyEmailCode(email, code.trim())
      setVerificationStatus('success')
      setMessage(result.message)
    } catch (error) {
      setVerificationStatus('error')
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsConfirmingCode(false)
    }
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title="Verifique seu e-mail"
            subtitle="Use o link de verificação enviado para concluir sua conta."
          />

          <div className="space-y-5">
            {verificationStatus === 'loading' && <Alert>Validando token de verificação...</Alert>}

            {message && <Alert tone="success">{message}</Alert>}
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

            {verificationStatus !== 'success' && (
              <form className="space-y-3" onSubmit={handleConfirmCode}>
                <div>
                  <label className="auth-label" htmlFor="verification-code">
                    Código de confirmação
                  </label>
                  <input
                    autoComplete="one-time-code"
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center text-lg font-black tracking-[0.24em] text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200"
                    disabled={!email || isConfirmingCode}
                    id="verification-code"
                    inputMode="numeric"
                    maxLength={8}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="000000"
                    value={code}
                  />
                </div>

                <LoadingButton
                  className="w-full"
                  disabled={!email || isConfirmingCode}
                  isLoading={isConfirmingCode}
                  loadingText="Confirmando..."
                  type="submit"
                >
                  Confirmar e-mail
                </LoadingButton>
              </form>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/60 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20" to="/login">
                Voltar ao login
              </Link>
              {verificationStatus !== 'success' && (
                <LoadingButton
                  className="w-full"
                  disabled={cooldown > 0 || !email}
                  isLoading={isSending}
                  loadingText="Reenviando..."
                  onClick={handleResend}
                  type="button"
                >
                  {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar e-mail'}
                </LoadingButton>
              )}
            </div>
          </div>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
