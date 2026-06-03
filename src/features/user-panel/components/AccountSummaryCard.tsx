import Card from '../../../components/ui/Card'
import type { UserPanelData } from '../types/userPanelTypes'
import StatusBadge from './StatusBadge'

type AccountSummaryCardProps = {
  user: UserPanelData['user']
  account: UserPanelData['account']
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatOptionalDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Ainda não registrado'
}

export default function AccountSummaryCard({ user, account }: AccountSummaryCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="panel-card-kicker">Conta</p>
          <h2 className="panel-card-title">{user.name}</h2>
        </div>
        <StatusBadge status={user.accountStatus} />
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="text-white/55">E-mail</dt>
          <dd className="mt-1 font-semibold text-white">{user.email}</dd>
        </div>
        <div>
          <dt className="text-white/55">Perfil</dt>
          <dd className="mt-1 font-semibold text-white">{user.role}</dd>
        </div>
        <div>
          <dt className="text-white/55">Status da conta</dt>
          <dd className="mt-2">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/75">
              {account.statusLabel}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-white/55">Criada em</dt>
          <dd className="mt-1 font-semibold text-white">
            {dateFormatter.format(new Date(account.createdAt))}
          </dd>
        </div>
        <div>
          <dt className="text-white/55">Último login</dt>
          <dd className="mt-1 font-semibold text-white">{formatOptionalDate(user.lastLoginAt)}</dd>
        </div>
      </dl>
    </Card>
  )
}
