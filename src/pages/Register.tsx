import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import FormError from '../components/auth/FormError'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import LoadingButton from '../components/ui/LoadingButton'
import PasswordInput from '../components/ui/PasswordInput'
import { registerSchema } from '../features/auth/schemas/registerSchema'
import { registerUser } from '../features/auth/services/authApi'
import type { RegisterFormValues } from '../features/auth/types/authTypes'

export default function Register() {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string>()
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
    const result = await registerUser(values)
    setMessage(result.message)
    navigate('/verify-email', { state: { email: values.email } })
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title="Registro Universe"
            subtitle="Crie sua conta para começar sua jornada no Site Universe."
          />

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {message && <Alert tone="success">{message}</Alert>}

            <div>
              <label className="auth-label" htmlFor="username">
                Nome de usuário
              </label>
              <Input
                autoComplete="username"
                error={errors.username?.message}
                id="username"
                placeholder="UniversePlayer"
                {...register('username')}
              />
              <FormError id="username-error" message={errors.username?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="email">
                E-mail
              </label>
              <Input
                autoComplete="email"
                error={errors.email?.message}
                id="email"
                placeholder="seuemail@exemplo.com"
                type="email"
                {...register('email')}
              />
              <FormError id="email-error" message={errors.email?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="password">
                Senha
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.password?.message}
                id="password"
                placeholder="Senha segura"
                {...register('password')}
              />
              <FormError id="password-error" message={errors.password?.message} />
            </div>

            <div>
              <label className="auth-label" htmlFor="confirmPassword">
                Confirmar senha
              </label>
              <PasswordInput
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                id="confirmPassword"
                placeholder="Repita a senha"
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
                    Li e aceito os
                  </label>{' '}
                  <Link className="font-bold text-white underline decoration-cyan-200/70 underline-offset-4 hover:text-cyan-100" to="/terms">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link className="font-bold text-white underline decoration-cyan-200/70 underline-offset-4 hover:text-cyan-100" to="/privacy">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>
              <FormError message={errors.terms?.message} />
            </div>

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText="Preparando..." type="submit">
              Registrar
            </LoadingButton>

            <p className="text-center text-sm text-white/75">
              Já tem uma conta?{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/login">
                Entrar
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
