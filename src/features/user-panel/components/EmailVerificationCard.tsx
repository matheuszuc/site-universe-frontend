import Card from '../../../components/ui/Card'
import type { UserPanelData } from '../types/userPanelTypes'
import StatusBadge from './StatusBadge'

type EmailVerificationCardProps = {
  user: UserPanelData['user']
}

export default function EmailVerificationCard({ user }: EmailVerificationCardProps) {
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
          Seu e-mail consta como verificado nos dados recebidos pelo painel.
        </p>
      ) : (
        <div className="mt-5 rounded-lg border border-amber-200/35 bg-amber-200/10 p-4 text-sm leading-relaxed text-amber-50">
          Este e-mail ainda aparece como não verificado. O reenvio de confirmação será conectado
          futuramente ao backend.
        </div>
      )}

      {!user.emailVerified && (
        <button
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 px-4 text-sm font-bold text-white/55"
          type="button"
          disabled
        >
          Reenvio em breve
        </button>
      )}
    </Card>
  )
}
