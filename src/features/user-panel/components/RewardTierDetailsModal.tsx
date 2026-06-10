import { useEffect, type MouseEvent } from 'react'
import Button from '../../../components/ui/Button'
import { useTranslation } from '../../../i18n'
import {
  getRewardTierPublicTitle,
  type RewardItem,
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

type RewardTierDetailsModalProps = {
  currentUp: number
  isClaiming?: boolean
  onClaim: (tier: RewardTier) => void
  onClose: () => void
  tier: RewardTier
}

function RewardItemCard({ item }: { item: RewardItem }) {
  const { t } = useTranslation()
  const displayName = t.rewards.items[item.name] ?? item.name
  const quantityLabel = t.rewards.quantityLabel.replace('{qty}', String(item.quantity))

  return (
    <div className="reward-detail-item">
      <div>
        <strong>{displayName}</strong>
        <span>{quantityLabel}</span>
        {item.description && <p>{item.description}</p>}
      </div>
    </div>
  )
}

export default function RewardTierDetailsModal({
  currentUp,
  isClaiming = false,
  onClaim,
  onClose,
  tier,
}: RewardTierDetailsModalProps) {
  const { t, formatAmount } = useTranslation()
  const missingUp = Math.max(0, tier.requiredUpTotal - currentUp)
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

  function getActionLabel() {
    if (isClaiming) return t.rewards.registeringClaim
    if (tier.status === 'locked') return t.rewards.statusLocked
    if (tier.status === 'claimed' || tier.status === 'delivered') return t.rewards.statusClaimed
    if (tier.status === 'delivery_pending') return t.rewards.statusDeliveryPending
    return t.rewards.claimBox
  }

  const modalTitle = t.rewards.rewardsOf.replace('{rank}', rankTitle)
  const goalLabel = t.rewards.goal.replace('{amount}', formatAmount(tier.requiredUpTotal))
  const missingLabel = t.rewards.missingToUnlock.replace('{amount}', formatAmount(missingUp))

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="panel-modal-backdrop" onMouseDown={handleBackdropClick} role="presentation">
      <div
        aria-labelledby="reward-tier-modal-title"
        aria-modal="true"
        className="panel-modal reward-detail-modal"
        role="dialog"
      >
        <button
          aria-label={t.rewards.closeModalLabel}
          className="panel-modal-close"
          onClick={onClose}
          type="button"
        >
          <i className="bx bx-x" aria-hidden="true" />
        </button>

        <div className="reward-detail-header">
          <div>
            <h2 id="reward-tier-modal-title">{modalTitle}</h2>
          </div>
          <span className={`reward-status-badge ${statusClasses[tier.status]}`}>
            {statusLabels[tier.status]}
          </span>
        </div>

        <div className="reward-detail-meta">
          <div>
            <span>{t.rewards.metaLabel}</span>
            <strong>{goalLabel}</strong>
          </div>
          <div>
            <span>{t.rewards.boxPreview}</span>
            <strong>{getRewardSummary()}</strong>
          </div>
        </div>

        {tier.status === 'locked' && (
          <div className="reward-detail-note">{missingLabel}</div>
        )}

        <section className="reward-detail-section">
          <h3>{t.rewards.itemsInsideBox}</h3>
        </section>

        <div className="reward-detail-items" aria-label={t.rewards.itemsInsideBox}>
          {tier.items.map((item) => (
            <RewardItemCard item={item} key={`${item.name}-${item.quantity}`} />
          ))}
        </div>

        <div className="reward-detail-actions">
          <Button
            disabled={!canClaim || isClaiming}
            onClick={() => onClaim(tier)}
            variant={canClaim ? 'primary' : 'secondary'}
          >
            <i className="bx bx-gift text-xl" aria-hidden="true" />
            {getActionLabel()}
          </Button>
          <Button onClick={onClose} variant="ghost">
            {t.rewards.closeButton}
          </Button>
        </div>
      </div>
    </div>
  )
}
