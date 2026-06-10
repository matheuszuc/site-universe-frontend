import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import FormError from '../components/auth/FormError'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import LoadingButton from '../components/ui/LoadingButton'
import { forgotPasswordSchema } from '../features/auth/schemas/forgotPasswordSchema'
import { authApi } from '../features/auth/services/authApi'
import type { ForgotPasswordFormValues } from '../features/auth/types/authTypes'
import { useTranslation } from '../i18n'
import { getApiErrorMessage } from '../services/api'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [message, setMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setMessage(undefined)
    setErrorMessage(undefined)

    try {
      const result = await authApi.forgotPassword(values.email)
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
            title={t.forgotPassword.title}
            subtitle={t.forgotPassword.subtitle}
          />

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {message && <Alert tone="success">{message}</Alert>}
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

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

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText={t.forgotPassword.submitting} type="submit">
              {t.forgotPassword.submit}
            </LoadingButton>

            <p className="text-center text-sm text-white/75">
              {t.forgotPassword.rememberPassword}{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/login">
                {t.forgotPassword.backToLogin}
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
