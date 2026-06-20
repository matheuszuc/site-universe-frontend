import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import FormError from '../components/auth/FormError'
import { executeRecaptcha, isRecaptchaRequired } from '../components/auth/recaptchaV3'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import LoadingButton from '../components/ui/LoadingButton'
import PasswordInput from '../components/ui/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { registerSchema } from '../features/auth/schemas/registerSchema'
import type { RegisterFormValues } from '../features/auth/types/authTypes'
import { getApiErrorMessage } from '../services/api'

export default function Register() {
  const { register: registerAccount } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setErrorMessage(undefined)

    let recaptchaToken: string | undefined
    if (isRecaptchaRequired()) {
      try {
        recaptchaToken = await executeRecaptcha('register')
      } catch {
        setErrorMessage(t.auth.recaptchaRequired)
        return
      }
    }

    try {
      await registerAccount({ ...values, recaptchaToken })
      navigate('/verify-email', { state: { email: values.email, mode: 'sent' } })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title={t.register.title}
            subtitle={t.register.subtitle}
          />

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

            <div>
              <label className="auth-label" htmlFor="username">
                {t.register.usernameLabel}
              </label>
              <Input
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                error={errors.username?.message}
                id="username"
                placeholder={t.register.usernamePlaceholder}
                {...register('username')}
              />
              <FormError id="username-error" message={errors.username?.message} />
            </div>

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
                autoComplete="new-password"
                error={errors.password?.message}
                id="password"
                placeholder={t.auth.passwordPlaceholder}
                {...register('password')}
              />
              <FormError id="password-error" message={errors.password?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="confirmPassword">
                {t.register.confirmPasswordLabel}
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                id="confirmPassword"
                placeholder={t.register.confirmPasswordPlaceholder}
                {...register('confirmPassword')}
              />
              <FormError id="confirmPassword-error" message={errors.confirmPassword?.message} />
            </div>

            <div>
              <div className="flex items-start gap-3 rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white/85">
                <input
                  aria-describedby="terms-description"
                  className="mt-1 h-4 w-4 rounded border-white/60 accent-cyan-200"
                  id="terms"
                  type="checkbox"
                  {...register('terms')}
                />
                <p className="m-0" id="terms-description">
                  <label className="cursor-pointer" htmlFor="terms">
                    {t.register.terms1}
                  </label>{' '}
                  <Link className="font-bold text-white underline decoration-cyan-200/70 underline-offset-4 hover:text-cyan-100" to="/terms">
                    {t.register.termsLink}
                  </Link>{' '}
                  {t.register.terms2}{' '}
                  <Link className="font-bold text-white underline decoration-cyan-200/70 underline-offset-4 hover:text-cyan-100" to="/privacy">
                    {t.register.privacyLink}
                  </Link>
                  .
                </p>
              </div>
              <FormError message={errors.terms?.message} />
            </div>

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText={t.register.submitting} type="submit">
              {t.register.submit}
            </LoadingButton>

            <p className="text-center text-sm text-white/75">
              {t.register.hasAccount}{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/login">
                {t.register.signIn}
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
