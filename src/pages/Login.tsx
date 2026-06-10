import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import FormError from '../components/auth/FormError'
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

    try {
      await login(values)
      const redirectTo = ((location.state as LoginLocationState | null)?.from?.pathname) ?? '/painel'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email)
      }

      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) {
      return
    }

    setIsResendingVerification(true)
    setResendMessage(undefined)

    try {
      const result = await authApi.resendVerification(unverifiedEmail)
      setResendMessage(result.message)
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

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText={t.login.submitting} type="submit">
              {t.login.submit}
            </LoadingButton>

            {unverifiedEmail && (
              <LoadingButton
                className="w-full"
                isLoading={isResendingVerification}
                loadingText={t.login.resending}
                onClick={handleResendVerification}
                type="button"
              >
                {t.login.resendEmail}
              </LoadingButton>
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
