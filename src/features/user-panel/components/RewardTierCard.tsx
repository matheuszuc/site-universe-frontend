import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { useTranslation } from '../../../i18n'
import {
  getRewardTierPublicTitle,
  type RewardTier,
  type RewardTierStatus,
} from '../../../data/rewardTiers'

const statusClasses: Record<RewardTierStatus, string> = {
  locked: 'border-white/15 bg-white/[0.08] text-white/60',
  eligible: 'border-cyan-200/45 bg-cyan-200/12 text-cyan-50',
  claimed: 'border-emerald-200/45 bg-emerald-200/12 text-emerald-50',
  delivery_pending: 'border-amber-200/45 bg-amber-200/12 text-amber-50',
  delivered: 'border-emerald-200/45 bg-emerald-200/12 text-emerald-50',
}

type RewardTierCardProps = {
  isClaiming?: boolean
  onClaim: (tier: RewardTier) => void
  tier: RewardTier
  onOpen: (tier: RewardTier) => void
}

export default function RewardTierCard({
  isClaiming = false,
  onClaim,
  onOpen,
  tier,
}: RewardTierCardProps) {
  const { t, formatAmount } = useTranslation()
  const canClaim = tier.status === 'eligible'
  const rankTitle = getRewardTierPublicTitle(tier)

  const statusLabels: Record<RewardTierStatus, string> = {
    locked: t.rewards.statusLocked,
    eligible: t.rewards.statusEligible,
    claimed: t.rewards.statusClaimed,
    delivery_pending: t.rewards.statusDeliveryPending,
    delivered: t.rewards.statusDelivered,
  }

  function getRewardSummary() {
    if (tier.items.length > 0) {
      return tier.items.length === 1
        ? t.rewards.itemInBox.replace('{count}', String(tier.items.length))
        : t.rewards.itemsInBox.replace('{count}', String(tier.items.length))
    }
    return t.rewards.rewardBox
  }

  function getClaimLabel() {
    if (isClaiming) return t.rewards.claiming
    if (tier.status === 'eligible') return t.rewards.claimBox
    if (tier.status === 'claimed' || tier.status === 'delivered') return t.rewards.statusClaimed
    if (tier.status === 'delivery_pending') return t.rewards.statusDeliveryPending
    return t.rewards.statusLocked
  }

  const goalLabel = t.rewards.goal.replace('{amount}', formatAmount(tier.requiredUpTotal))

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="panel-card-title">{rankTitle}</h2>
          <p className="mt-1 text-sm font-bold text-white/60">{goalLabel}</p>
        </div>
        <span className={`reward-status-badge ${statusClasses[tier.status]}`}>
          {statusLabels[tier.status]}
        </span>
      </div>

      <div className="reward-item-slot mt-5">
        <i className="bx bx-gift text-3xl" aria-hidden="true" />
        <span>{getRewardSummary()}</span>
      </div>

      <Button className="mt-5 w-full" onClick={() => onOpen(tier)} variant="secondary">
        <i className="bx bx-detail text-xl" aria-hidden="true" />
        {t.rewards.viewRewards}
      </Button>

      <Button
        className="mt-3 w-full"
        disabled={!canClaim || isClaiming}
        onClick={() => onClaim(tier)}
        variant={canClaim ? 'primary' : 'secondary'}
      >
        <i className="bx bx-package text-xl" aria-hidden="true" />
        {getClaimLabel()}
      </Button>
    </Card>
  )
}
