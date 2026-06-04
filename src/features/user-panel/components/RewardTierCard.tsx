import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { formatApAmount } from '../../../data/storePackages'
import type { RewardTier, RewardTierStatus } from '../../../data/rewardTiers'

const statusLabels: Record<RewardTierStatus, string> = {
  locked: 'Bloqueado',
  eligible: 'Liberado',
  claimed: 'Resgatado',
  delivery_pending: 'Entrega pendente',
  delivered: 'Entregue',
}

const statusClasses: Record<RewardTierStatus, string> = {
  locked: 'border-white/15 bg-white/[0.08] text-white/60',
  eligible: 'border-cyan-200/45 bg-cyan-200/12 text-cyan-50',
  claimed: 'border-emerald-200/45 bg-emerald-200/12 text-emerald-50',
  delivery_pending: 'border-amber-200/45 bg-amber-200/12 text-amber-50',
  delivered: 'border-emerald-200/45 bg-emerald-200/12 text-emerald-50',
}

type RewardTierCardProps = {
  tier: RewardTier
  onOpen: (tier: RewardTier) => void
}

function getRewardSummary(tier: RewardTier) {
  if (tier.items.length > 0) {
    return `${tier.items.length} ${tier.items.length === 1 ? 'item na caixa' : 'itens na caixa'}`
  }

  return 'Caixa de recompensas'
}

function getClaimLabel(status: RewardTierStatus) {
  if (status === 'eligible') {
    return 'Resgatar caixa'
  }

  if (status === 'claimed' || status === 'delivered') {
    return 'Resgatado'
  }

  if (status === 'delivery_pending') {
    return 'Entrega pendente'
  }

  return 'Bloqueado'
}

export default function RewardTierCard({ tier, onOpen }: RewardTierCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="panel-card-kicker">{tier.name}</p>
          <h2 className="panel-card-title">{formatApAmount(tier.requiredUpTotal)} AP</h2>
        </div>
        <span className={`reward-status-badge ${statusClasses[tier.status]}`}>
          {statusLabels[tier.status]}
        </span>
      </div>

      <div className="reward-item-slot mt-5">
        <i className="bx bx-gift text-3xl" aria-hidden="true" />
        <span>{getRewardSummary(tier)}</span>
      </div>

      <Button className="mt-5 w-full" onClick={() => onOpen(tier)} variant="secondary">
        <i className="bx bx-detail text-xl" aria-hidden="true" />
        Ver recompensas
      </Button>

      <Button className="mt-3 w-full" disabled variant={tier.status === 'eligible' ? 'primary' : 'secondary'}>
        <i className="bx bx-package text-xl" aria-hidden="true" />
        {getClaimLabel(tier.status)}
      </Button>
    </Card>
  )
}
