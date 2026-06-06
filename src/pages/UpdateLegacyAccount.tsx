import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import PublicLayout from '../components/layout/PublicLayout'
import Alert from '../components/ui/Alert'
import Input from '../components/ui/Input'
import LoadingButton from '../components/ui/LoadingButton'
import PasswordInput from '../components/ui/PasswordInput'
import {
  completeAccountMigration,
  getAccountMigrationStatus,
  startAccountMigration,
} from '../features/account-migration/services/accountMigrationApi'
import { ApiError, getApiErrorMessage } from '../services/api'

type Step = 'credentials' | 'complete' | 'done'

const gameLoginPattern = /^[A-Za-z0-9]+$/

const passwordRules = [
  {
    label: 'Mínimo 8 caracteres',
    test: (value: string) => value.length >= 8,
  },
  {
    label: 'Letra maiúscula',
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: 'Letra minúscula',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: 'Número',
    test: (value: string) => /\d/.test(value),
  },
  {
    label: 'Caractere especial',
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
]

export default function UpdateLegacyAccount() {
  const [step, setStep] = useState<Step>('credentials')
  const [gameLogin, setGameLogin] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const passwordChecks = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, valid: rule.test(newPassword) })),
    [newPassword],
  )
  const passwordIsStrong = passwordChecks.every((rule) => rule.valid)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  useEffect(() => {
    let isMounted = true

    async function loadStatus() {
      try {
        const status = await getAccountMigrationStatus()

        if (!isMounted) {
          return
        }

        if (status.status === 'verified') {
          setGameLogin(status.gameLogin)
          setStep('complete')
        }
      } catch {
        if (isMounted) {
          setStep('credentials')
        }
      } finally {
        if (isMounted) {
          setIsCheckingStatus(false)
        }
      }
    }

    loadStatus()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(undefined)
    setSuccessMessage(undefined)

    const normalizedGameLogin = gameLogin.trim()

    if (!gameLoginPattern.test(normalizedGameLogin)) {
      setErrorMessage('Use apenas letras e números no usuário do jogo.')
      return
    }

    setIsLoading(true)

    try {
      const result = await startAccountMigration({
        gameLogin: normalizedGameLogin,
        currentPassword,
      })
      setGameLogin(result.gameLogin)
      setCurrentPassword('')
      setStep('complete')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        setErrorMessage('Usuário ou senha inválidos.')
      } else if (error instanceof ApiError && error.code === 'ACCOUNT_ALREADY_MIGRATED') {
        setErrorMessage('Esta conta já foi atualizada. Acesse o site normalmente ou use a recuperação de senha.')
      } else {
        setErrorMessage(getApiErrorMessage(error))
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(undefined)
    setSuccessMessage(undefined)

    if (!passwordIsStrong || !passwordsMatch) {
      setErrorMessage('Revise os requisitos da nova senha antes de continuar.')
      return
    }

    setIsLoading(true)

    try {
      const result = await completeAccountMigration({
        email,
        newPassword,
        confirmPassword,
      })
      setNewPassword('')
      setConfirmPassword('')
      setSuccessMessage(result.message)
      setStep('done')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout variant="auth">
      <main className="auth-main">
        <AuthCard>
          {isCheckingStatus ? (
            <div className="panel-state" role="status">
              Carregando...
            </div>
          ) : (
            <>
              {step === 'credentials' && (
                <>
                  <AuthHeader
                    title="Atualizar conta antiga"
                    subtitle="Use seu login e senha atuais do jogo para atualizar sua conta e adicionar um e-mail."
                  />

                  <form className="space-y-4" onSubmit={handleStart} noValidate>
                    {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

                    <div>
                      <label className="auth-label" htmlFor="gameLogin">
                        Usuário do jogo
                      </label>
                      <Input
                        autoComplete="username"
                        id="gameLogin"
                        inputMode="text"
                        maxLength={60}
                        onChange={(event) => setGameLogin(event.target.value)}
                        pattern="[A-Za-z0-9]+"
                        placeholder="usuario123"
                        value={gameLogin}
                      />
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="currentPassword">
                        Senha atual
                      </label>
                      <PasswordInput
                        autoComplete="current-password"
                        id="currentPassword"
                        maxLength={128}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Senha atual do jogo"
                        value={currentPassword}
                      />
                    </div>

                    <div className="legacy-security-note">
                      Nunca compartilhe sua senha fora do site oficial.
                    </div>

                    <LoadingButton
                      className="w-full"
                      disabled={!gameLogin.trim() || !currentPassword}
                      isLoading={isLoading}
                      loadingText="Validando..."
                      type="submit"
                    >
                      Continuar
                    </LoadingButton>
                  </form>
                </>
              )}

              {step === 'complete' && (
                <>
                  <AuthHeader
                    title="Finalizar atualização da conta"
                    subtitle="Adicione um e-mail e defina uma senha segura para sua conta no Site Universe."
                  />

                  <form className="space-y-4" onSubmit={handleComplete} noValidate>
                    {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

                    <div className="legacy-account-found">
                      Conta encontrada: <strong>{gameLogin}</strong>
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="migrationEmail">
                        E-mail
                      </label>
                      <Input
                        autoComplete="email"
                        id="migrationEmail"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="seuemail@exemplo.com"
                        type="email"
                        value={email}
                      />
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="newPassword">
                        Nova senha
                      </label>
                      <PasswordInput
                        autoComplete="new-password"
                        id="newPassword"
                        maxLength={64}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Senha segura"
                        value={newPassword}
                      />
                    </div>

                    <div className="password-checklist" aria-label="Requisitos da senha">
                      {passwordChecks.map((rule) => (
                        <span className={rule.valid ? 'valid' : ''} key={rule.label}>
                          <i className={rule.valid ? 'bx bx-check' : 'bx bx-x'} aria-hidden="true" />
                          {rule.label}
                        </span>
                      ))}
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="confirmPassword">
                        Confirmar nova senha
                      </label>
                      <PasswordInput
                        autoComplete="new-password"
                        id="confirmPassword"
                        maxLength={64}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repita a senha"
                        value={confirmPassword}
                      />
                    </div>

                    {confirmPassword && !passwordsMatch && (
                      <Alert tone="error">As senhas precisam ser iguais.</Alert>
                    )}

                    <LoadingButton
                      className="w-full"
                      disabled={!email || !passwordIsStrong || !passwordsMatch}
                      isLoading={isLoading}
                      loadingText="Atualizando..."
                      type="submit"
                    >
                      Atualizar conta
                    </LoadingButton>
                  </form>
                </>
              )}

              {step === 'done' && (
                <>
                  <AuthHeader
                    title="Conta em atualização"
                    subtitle="Enviamos um link de verificação para seu e-mail."
                  />
                  {successMessage && <Alert tone="success">{successMessage}</Alert>}
                  <p className="mt-4 text-sm leading-relaxed text-white/75">
                    Verifique seu e-mail para concluir a ativação no Site Universe. Em ambiente de
                    desenvolvimento, o link pode aparecer no console do backend.
                  </p>
                  <Link className="mt-5 inline-flex font-bold text-white hover:text-cyan-100" to="/login">
                    Ir para o login
                  </Link>
                </>
              )}
            </>
          )}
        </AuthCard>
      </main>
    </PublicLayout>
  )
}
