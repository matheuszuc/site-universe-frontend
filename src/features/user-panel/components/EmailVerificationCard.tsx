import { useState } from 'react'
import Card from '../../../components/ui/Card'
import LoadingButton from '../../../components/ui/LoadingButton'
import { authApi } from '../../auth/services/authApi'
import { getApiErrorMessage } from '../../../services/api'
import type { UserPanelData } from '../types/userPanelTypes'
import StatusBadge from './StatusBadge'

type EmailVerificationCardProps = {
  user: UserPanelData['user']
}

export default function EmailVerificationCard({ user }: EmailVerificationCardProps) {
  const [message, setMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isSending, setIsSending] = useState(false)

  async function handleResend() {
    setIsSending(true)
    setMessage(undefined)
    setErrorMessage(undefined)

    try {
      const result = await authApi.resendVerification(user.email)
      setMessage(result.message)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="panel-card-kicker">E-mail</p>
          <h2 className="panel-card-title">Verificação</h2>
        </div>
        <StatusBadge status={user.emailVerified ? 'verified' : 'unverified'} />
      </div>

      {user.emailVerified ? (
        <p className="mt-5 text-sm leading-relaxed text-white/70">
          Seu e-mail está verificado.
        </p>
      ) : (
        <div className="mt-5 rounded-lg border border-amber-200/35 bg-amber-200/10 p-4 text-sm leading-relaxed text-amber-50">
          Seu e-mail ainda não foi verificado.
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-lg border border-emerald-200/35 bg-emerald-200/10 p-3 text-sm text-emerald-50" role="status">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200/35 bg-red-200/10 p-3 text-sm text-red-50" role="alert">
          {errorMessage}
        </div>
      )}

      {!user.emailVerified && (
        <LoadingButton
          className="mt-4 min-h-10 px-4 py-2"
          isLoading={isSending}
          loadingText="Reenviando..."
          onClick={handleResend}
          type="button"
        >
          Reenviar verificação
        </LoadingButton>
      )}
    </Card>
  )
}
