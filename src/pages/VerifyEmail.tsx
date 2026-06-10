import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import LoadingButton from '../components/ui/LoadingButton'
import { authApi } from '../features/auth/services/authApi'
import type { AuthApiResult } from '../features/auth/types/authTypes'
import { useTranslation } from '../i18n'
import { getApiErrorMessage } from '../services/api'

type VerifyEmailState = {
  email?: string
  mode?: 'sent'
}

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error'

const verificationRequestsByToken = new Map<string, Promise<AuthApiResult>>()

export default function VerifyEmail() {
  const { t } = useTranslation()
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
      setMessage(t.verifyEmail.codeSent)
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
        setMessage(t.verifyEmail.emailSuccess)
      })
      .catch(() => {
        if (!isCurrentEffect || activeTokenRef.current !== token) {
          return
        }

        setVerificationStatus('error')
        setErrorMessage(t.verifyEmail.tokenInvalid)
      })
      .finally(() => {
        if (verificationRequestsByToken.get(token) === verificationRequest) {
          verificationRequestsByToken.delete(token)
        }
      })

    return () => {
      isCurrentEffect = false
    }
  }, [token, t.verifyEmail.codeSent, t.verifyEmail.emailSuccess, t.verifyEmail.tokenInvalid])

  useEffect(() => {
    if (cooldown <= 0) return undefined

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (!email) {
      setErrorMessage(t.verifyEmail.noEmail)
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
      setErrorMessage(t.verifyEmail.noEmailCode)
      return
    }

    if (!/^\d{6,8}$/.test(code.trim())) {
      setErrorMessage(t.verifyEmail.codeInvalid)
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
            title={t.verifyEmail.title}
            subtitle={t.verifyEmail.subtitle}
          />

          <div className="space-y-5">
            {verificationStatus === 'loading' && <Alert>{t.verifyEmail.loading}</Alert>}

            {message && <Alert tone="success">{message}</Alert>}
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

            {verificationStatus !== 'success' && (
              <form className="space-y-3" onSubmit={handleConfirmCode}>
                <div>
                  <label className="auth-label" htmlFor="verification-code">
                    {t.verifyEmail.codeLabel}
                  </label>
                  <input
                    autoComplete="one-time-code"
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center text-lg font-black tracking-[0.24em] text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200"
                    disabled={!email || isConfirmingCode}
                    id="verification-code"
                    inputMode="numeric"
                    maxLength={8}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder={t.verifyEmail.codePlaceholder}
                    value={code}
                  />
                </div>

                <LoadingButton
                  className="w-full"
                  disabled={!email || isConfirmingCode}
                  isLoading={isConfirmingCode}
                  loadingText={t.verifyEmail.submitting}
                  type="submit"
                >
                  {t.verifyEmail.submit}
                </LoadingButton>
              </form>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/60 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20" to="/login">
                {t.verifyEmail.backToLogin}
              </Link>
              {verificationStatus !== 'success' && (
                <LoadingButton
                  className="w-full"
                  disabled={cooldown > 0 || !email}
                  isLoading={isSending}
                  loadingText={t.verifyEmail.resending}
                  onClick={handleResend}
                  type="button"
                >
                  {cooldown > 0 ? `${t.verifyEmail.resendIn} ${cooldown}s` : t.verifyEmail.resend}
                </LoadingButton>
              )}
            </div>
          </div>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
