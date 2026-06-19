import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import AuthHeader from '../components/auth/AuthHeader'
import { executeRecaptcha, isRecaptchaRequired } from '../components/auth/recaptchaV3'
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
import { useTranslation } from '../i18n'
import { ApiError, getApiErrorMessage } from '../services/api'

type Step = 'credentials' | 'complete' | 'done'

const gameLoginPattern = /^[A-Za-z0-9]+$/

// GF-compatible: only lowercase a-z and digits 0-9, min 10 chars
const GF_PASSWORD_REGEX = /^[a-z0-9]{10,64}$/

function getPasswordRules(t: ReturnType<typeof useTranslation>['t']) {
  return [
    {
      label: t.migration.passwordRuleMin,
      test: (value: string) => value.length >= 10,
    },
    {
      label: t.migration.passwordRuleLower,
      test: (value: string) => /^[a-z0-9]*$/.test(value) && /[a-z]/.test(value),
    },
    {
      label: t.migration.passwordRuleDigits,
      test: (value: string) => /\d/.test(value),
    },
    {
      label: t.migration.passwordRuleNoSequence,
      test: (value: string) => GF_PASSWORD_REGEX.test(value),
    },
  ]
}

export default function UpdateLegacyAccount() {
  const { t } = useTranslation()
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
  const [migrationDisabled, setMigrationDisabled] = useState(false)
  const passwordRules = useMemo(() => getPasswordRules(t), [t])
  const passwordChecks = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, valid: rule.test(newPassword) })),
    [newPassword, passwordRules],
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
      } catch (error) {
        if (isMounted) {
          // Migration turned off by env flag: show a friendly notice instead of the form.
          if (error instanceof ApiError && error.code === 'MIGRATION_DISABLED') {
            setMigrationDisabled(true)
          } else {
            // Any other (transient) failure: fall back to the start form so the
            // page is never stuck and the user can still begin a migration.
            setStep('credentials')
          }
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
      setErrorMessage(t.migration.gameLoginInvalid)
      return
    }

    let recaptchaToken: string | undefined
    if (isRecaptchaRequired()) {
      try {
        recaptchaToken = await executeRecaptcha('migrate_account')
      } catch {
        setErrorMessage(t.auth.recaptchaRequired)
        return
      }
    }

    setIsLoading(true)

    try {
      const result = await startAccountMigration({
        gameLogin: normalizedGameLogin,
        currentPassword,
        recaptchaToken,
      })
      setGameLogin(result.gameLogin)
      setCurrentPassword('')
      setStep('complete')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
        setErrorMessage(t.migration.invalidCredentials)
      } else if (error instanceof ApiError && error.code === 'ACCOUNT_ALREADY_MIGRATED') {
        setErrorMessage(t.migration.alreadyMigrated)
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

    if (!passwordIsStrong) {
      setErrorMessage(t.migration.weakPassword)
      return
    }

    if (!passwordsMatch) {
      setErrorMessage(t.migration.passwordsNotMatch)
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
              {t.migration.loading}
            </div>
          ) : migrationDisabled ? (
            <>
              <AuthHeader title={t.migration.title} subtitle={t.migration.unavailable} />
              <Alert tone="error">{t.migration.unavailable}</Alert>
              <Link className="mt-5 inline-flex font-bold text-white hover:text-cyan-100" to="/login">
                {t.migration.goToLogin}
              </Link>
            </>
          ) : (
            <>
              {step === 'credentials' && (
                <>
                  <AuthHeader
                    title={t.migration.title}
                    subtitle={t.migration.subtitle}
                  />

                  <form className="space-y-4" onSubmit={handleStart} noValidate>
                    {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

                    <div>
                      <label className="auth-label" htmlFor="gameLogin">
                        {t.migration.gameLoginLabel}
                      </label>
                      <Input
                        autoComplete="username"
                        id="gameLogin"
                        inputMode="text"
                        maxLength={60}
                        onChange={(event) => setGameLogin(event.target.value)}
                        pattern="[A-Za-z0-9]+"
                        placeholder={t.migration.gameLoginPlaceholder}
                        value={gameLogin}
                      />
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="currentPassword">
                        {t.migration.currentPasswordLabel}
                      </label>
                      <PasswordInput
                        autoComplete="current-password"
                        id="currentPassword"
                        maxLength={128}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder={t.migration.currentPasswordPlaceholder}
                        value={currentPassword}
                      />
                    </div>

                    <div className="legacy-security-note">
                      {t.migration.securityNote}
                    </div>

                    <LoadingButton
                      className="w-full"
                      disabled={!gameLogin.trim() || !currentPassword}
                      isLoading={isLoading}
                      loadingText={t.migration.submitting}
                      type="submit"
                    >
                      {t.migration.submit}
                    </LoadingButton>
                  </form>
                </>
              )}

              {step === 'complete' && (
                <>
                  <AuthHeader
                    title={t.migration.step2Title}
                    subtitle={t.migration.step2Subtitle}
                  />

                  <form className="space-y-4" onSubmit={handleComplete} noValidate>
                    {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

                    <div className="legacy-account-found">
                      {t.migration.accountFound} <strong>{gameLogin}</strong>
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="migrationEmail">
                        {t.migration.emailLabel}
                      </label>
                      <Input
                        autoComplete="email"
                        id="migrationEmail"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t.migration.emailPlaceholder}
                        type="email"
                        value={email}
                      />
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="newPassword">
                        {t.migration.newPasswordLabel}
                      </label>
                      <PasswordInput
                        autoComplete="new-password"
                        id="newPassword"
                        maxLength={64}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder={t.migration.newPasswordPlaceholder}
                        value={newPassword}
                      />
                    </div>

                    <div className="password-checklist" aria-label={t.migration.passwordRequirementsTitle}>
                      {passwordChecks.map((rule) => (
                        <span className={rule.valid ? 'valid' : ''} key={rule.label}>
                          <i className={rule.valid ? 'bx bx-check' : 'bx bx-x'} aria-hidden="true" />
                          {rule.label}
                        </span>
                      ))}
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="confirmMigrationPassword">
                        {t.migration.confirmPasswordLabel}
                      </label>
                      <PasswordInput
                        autoComplete="new-password"
                        id="confirmMigrationPassword"
                        maxLength={64}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder={t.migration.confirmPasswordPlaceholder}
                        value={confirmPassword}
                      />
                    </div>

                    {confirmPassword && !passwordsMatch && (
                      <Alert tone="error">{t.migration.passwordsNotMatch}</Alert>
                    )}

                    <LoadingButton
                      className="w-full"
                      disabled={!email || !passwordIsStrong || !passwordsMatch}
                      isLoading={isLoading}
                      loadingText={t.migration.finishing}
                      type="submit"
                    >
                      {t.migration.finish}
                    </LoadingButton>
                  </form>
                </>
              )}

              {step === 'done' && (
                <>
                  <AuthHeader
                    title={t.migration.doneTitle}
                    subtitle={t.migration.doneSubtitle}
                  />
                  {successMessage && <Alert tone="success">{successMessage}</Alert>}
                  <Link className="mt-5 inline-flex font-bold text-white hover:text-cyan-100" to="/login">
                    {t.migration.goToLogin}
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
