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
import { resetPassword } from '../features/auth/services/authApi'
import type { ResetPasswordFormValues } from '../features/auth/types/authTypes'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState<string>()
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
    const result = await resetPassword(values, token)
    setMessage(result.message)
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title="Redefinir senha"
            subtitle="Crie uma nova senha segura para sua conta."
          />

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {message && <Alert tone="success">{message}</Alert>}

            <div>
              <label className="auth-label" htmlFor="password">
                Nova senha
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.password?.message}
                id="password"
                placeholder="Nova senha"
                {...register('password')}
              />
              <FormError id="password-error" message={errors.password?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="confirmPassword">
                Confirmar nova senha
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                id="confirmPassword"
                placeholder="Repita a nova senha"
                {...register('confirmPassword')}
              />
              <FormError id="confirmPassword-error" message={errors.confirmPassword?.message} />
            </div>

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText="Preparando..." type="submit">
              Redefinir senha
            </LoadingButton>

            <p className="text-center text-sm text-white/75">
              <Link className="font-bold text-white hover:text-cyan-100" to="/login">
                Voltar ao login
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
