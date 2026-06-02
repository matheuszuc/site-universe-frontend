import Card from '../../../components/ui/Card'
import type { UserPanelData } from '../types/userPanelTypes'
import StatusBadge from './StatusBadge'

type AccountSummaryCardProps = {
  user: UserPanelData['user']
}

export default function AccountSummaryCard({ user }: AccountSummaryCardProps) {
  const accountStatusText = {
    active: 'Conta ativa',
    pending_verification: 'Aguardando verificação',
    restricted: 'Conta com restrição',
  }[user.accountStatus]

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="panel-card-kicker">Conta</p>
          <h2 className="panel-card-title">{user.username}</h2>
        </div>
        <StatusBadge status={user.accountStatus} />
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="text-white/55">E-mail</dt>
          <dd className="mt-1 font-semibold text-white">{user.email}</dd>
        </div>
        <div>
          <dt className="text-white/55">Status da conta</dt>
          <dd className="mt-2">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/75">
              {accountStatusText}
            </span>
          </dd>
        </div>
      </dl>
    </Card>
  )
}
