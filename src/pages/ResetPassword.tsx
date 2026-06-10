import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import FormError from '../components/auth/FormError'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import LoadingButton from '../components/ui/LoadingButton'
import PasswordInput from '../components/ui/PasswordInput'
import { resetPasswordSchema } from '../features/auth/schemas/resetPasswordSchema'
import { authApi } from '../features/auth/services/authApi'
import type { ResetPasswordFormValues } from '../features/auth/types/authTypes'
import { useTranslation } from '../i18n'
import { getApiErrorMessage } from '../services/api'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const token = searchParams.get('token')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setMessage(undefined)
    setErrorMessage(undefined)

    if (!token) {
      setErrorMessage(t.resetPassword.invalidToken)
      return
    }

    try {
      const result = await authApi.resetPassword(token, values.password)
      setMessage(result.message)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title={t.resetPassword.title}
            subtitle={t.resetPassword.subtitle}
          />

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {!token && <Alert tone="error">{t.resetPassword.invalidToken}</Alert>}
            {message && <Alert tone="success">{message}</Alert>}
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

            <div>
              <label className="auth-label" htmlFor="password">
                {t.resetPassword.passwordLabel}
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.password?.message}
                id="password"
                placeholder={t.resetPassword.passwordPlaceholder}
                {...register('password')}
              />
              <FormError id="password-error" message={errors.password?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="confirmPassword">
                {t.resetPassword.confirmLabel}
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                id="confirmPassword"
                placeholder={t.resetPassword.confirmPlaceholder}
                {...register('confirmPassword')}
              />
              <FormError id="confirmPassword-error" message={errors.confirmPassword?.message} />
            </div>

            <LoadingButton
              className="w-full"
              disabled={!token}
              isLoading={isSubmitting}
              loadingText={t.resetPassword.submitting}
              type="submit"
            >
              {t.resetPassword.submit}
            </LoadingButton>

            <p className="text-center text-sm text-white/75">
              <Link className="font-bold text-white hover:text-cyan-100" to="/login">
                {t.resetPassword.backToLogin}
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
