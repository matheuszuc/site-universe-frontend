import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type ReCAPTCHA from 'react-google-recaptcha'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import FormError from '../components/auth/FormError'
import { RecaptchaWidget, isRecaptchaRequired } from '../components/auth/RecaptchaWidget'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import LoadingButton from '../components/ui/LoadingButton'
import PasswordInput from '../components/ui/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { loginSchema } from '../features/auth/schemas/loginSchema'
import { authApi } from '../features/auth/services/authApi'
import type { LoginFormValues } from '../features/auth/types/authTypes'
import { ApiError, getApiErrorMessage } from '../services/api'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export default function Login() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [resendMessage, setResendMessage] = useState<string>()
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>()
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(undefined)
    setResendMessage(undefined)
    setUnverifiedEmail(undefined)
    setVerificationCode('')

    if (isRecaptchaRequired() && !recaptchaToken) {
      setErrorMessage(t.auth.recaptchaRequired)
      return
    }

    try {
      await login({ ...values, recaptchaToken: recaptchaToken ?? undefined })
      const redirectTo = ((location.state as LoginLocationState | null)?.from?.pathname) ?? '/painel'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email)
      }

      setErrorMessage(getApiErrorMessage(error))
      recaptchaRef.current?.reset()
      setRecaptchaToken(null)
    }
  }

  async function handleVerifyCode() {
    if (!unverifiedEmail) {
      return
    }

    const code = verificationCode.trim()

    if (!/^\d{6,8}$/.test(code)) {
      setResendMessage(undefined)
      setErrorMessage(t.login.verifyCodeError)
      return
    }

    setIsVerifyingCode(true)
    setResendMessage(undefined)
    setErrorMessage(undefined)

    try {
      await authApi.verifyEmailCode(unverifiedEmail, code)
      // E-mail confirmed: hide the verification area and let the user sign in again.
      setUnverifiedEmail(undefined)
      setVerificationCode('')
      setResendMessage(t.login.verifyCodeSuccess)
    } catch {
      setErrorMessage(t.login.verifyCodeError)
    } finally {
      setIsVerifyingCode(false)
    }
  }

  async function handleResendVerification() {
    // Block parallel requests and clicks during the cooldown window so rapid
    // clicking can never fire more than one request.
    if (!unverifiedEmail || isResendingVerification || resendCooldown > 0) {
      return
    }

    setIsResendingVerification(true)
    setResendMessage(undefined)
    setErrorMessage(undefined)

    try {
      await authApi.resendVerification(unverifiedEmail)
      setResendMessage(t.login.resendSuccess)
      setResendCooldown(60)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title={t.login.title}
            subtitle={t.login.subtitle}
          />

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
            {resendMessage && <Alert tone="success">{resendMessage}</Alert>}

            <div>
              <label className="auth-label" htmlFor="email">
                {t.auth.email}
              </label>
              <Input
                autoComplete="email"
                error={errors.email?.message}
                id="email"
                placeholder={t.auth.emailPlaceholder}
                type="email"
                {...register('email')}
              />
              <FormError id="email-error" message={errors.email?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="password">
                {t.auth.password}
              </label>
              <PasswordInput
                autoComplete="current-password"
                error={errors.password?.message}
                id="password"
                placeholder={t.auth.passwordPlaceholder}
                {...register('password')}
              />
              <FormError id="password-error" message={errors.password?.message} />
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link className="font-semibold text-cyan-100 hover:text-white" to="/forgot-password">
                {t.login.forgotPassword}
              </Link>
            </div>

            <RecaptchaWidget ref={recaptchaRef} onVerify={setRecaptchaToken} />

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText={t.login.submitting} type="submit">
              {t.login.submit}
            </LoadingButton>

            {unverifiedEmail && (
              <div className="space-y-3 rounded-lg border border-white/20 bg-white/5 p-4">
                <p className="text-sm text-white/85">{t.login.verifyCodeInstruction}</p>

                <div>
                  <label className="auth-label" htmlFor="login-verification-code">
                    {t.login.verifyCodeLabel}
                  </label>
                  <input
                    autoComplete="one-time-code"
                    className="min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center text-lg font-black tracking-[0.24em] text-white outline-none transition placeholder:text-white/35 focus:border-cyan-200"
                    disabled={isVerifyingCode}
                    id="login-verification-code"
                    inputMode="numeric"
                    maxLength={8}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="000000"
                    value={verificationCode}
                  />
                </div>

                <LoadingButton
                  className="w-full"
                  disabled={isVerifyingCode || !verificationCode.trim()}
                  isLoading={isVerifyingCode}
                  loadingText={t.login.verifyCodeSubmitting}
                  onClick={handleVerifyCode}
                  type="button"
                >
                  {t.login.verifyCodeButton}
                </LoadingButton>

                <LoadingButton
                  className="w-full"
                  disabled={isResendingVerification || resendCooldown > 0}
                  isLoading={isResendingVerification}
                  loadingText={t.login.resending}
                  onClick={handleResendVerification}
                  type="button"
                >
                  {resendCooldown > 0
                    ? `${t.login.resendIn} ${resendCooldown}s`
                    : t.login.resendEmail}
                </LoadingButton>
              </div>
            )}

            <p className="text-center text-sm text-white/75">
              {t.login.noAccount}{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/register">
                {t.login.signUp}
              </Link>
            </p>

            <p className="text-center text-sm text-white/75">
              {t.login.oldAccount}{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/atualizar-conta">
                {t.login.updateAccount}
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
