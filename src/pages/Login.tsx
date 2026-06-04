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
import { loginSchema } from '../features/auth/schemas/loginSchema'
import type { LoginFormValues } from '../features/auth/types/authTypes'
import { getApiErrorMessage } from '../services/api'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export default function Login() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string>()
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

    try {
      await login(values)
      const redirectTo = ((location.state as LoginLocationState | null)?.from?.pathname) ?? '/painel'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          <AuthHeader
            title="Universe Login"
            subtitle="Entre com seu e-mail e senha para acessar sua conta."
          />

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

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
                autoComplete="current-password"
                error={errors.password?.message}
                id="password"
                placeholder="Sua senha"
                {...register('password')}
              />
              <FormError id="password-error" message={errors.password?.message} />
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link className="font-semibold text-cyan-100 hover:text-white" to="/forgot-password">
                Esqueci a senha
              </Link>
            </div>

            <LoadingButton className="w-full" isLoading={isSubmitting} loadingText="Entrando..." type="submit">
              Login
            </LoadingButton>

            <p className="text-center text-sm text-white/75">
              Não tem uma conta?{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/register">
                Cadastre-se
              </Link>
            </p>

            <p className="text-center text-sm text-white/75">
              Tem uma conta antiga?{' '}
              <Link className="font-bold text-white hover:text-cyan-100" to="/atualizar-conta">
                Atualizar conta
              </Link>
            </p>
          </form>
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
