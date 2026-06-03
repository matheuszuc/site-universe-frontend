import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { formatUpAmount } from '../../../data/storePackages'
import type { RewardTier, RewardTierStatus } from '../../../data/rewardTiers'

const statusLabels: Record<RewardTierStatus, string> = {
  locked: 'Bloqueado',
  available: 'Liberado',
  claimed: 'Resgatado',
}

const statusClasses: Record<RewardTierStatus, string> = {
  locked: 'border-white/15 bg-white/[0.08] text-white/60',
  available: 'border-cyan-200/45 bg-cyan-200/12 text-cyan-50',
  claimed: 'border-emerald-200/45 bg-emerald-200/12 text-emerald-50',
}

type RewardTierCardProps = {
  tier: RewardTier
}

export default function RewardTierCard({ tier }: RewardTierCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="panel-card-kicker">{tier.name}</p>
          <h2 className="panel-card-title">{formatUpAmount(tier.requiredUp)} UP</h2>
        </div>
        <span className={`reward-status-badge ${statusClasses[tier.status]}`}>
          {statusLabels[tier.status]}
        </span>
      </div>

      <div className="reward-item-slot mt-5">
        <i className="bx bx-gift text-3xl" aria-hidden="true" />
        <span>Aqui vai o item</span>
      </div>

      <Button className="mt-5 w-full" disabled variant={tier.status === 'available' ? 'primary' : 'secondary'}>
        <i className="bx bx-lock-alt text-xl" aria-hidden="true" />
        Resgate em breve
      </Button>
    </Card>
  )
}
