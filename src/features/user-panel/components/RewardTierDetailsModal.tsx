import { useEffect, type MouseEvent } from 'react'
import Button from '../../../components/ui/Button'
import { formatApAmount } from '../../../data/storePackages'
import {
  getRewardTierPublicTitle,
  type RewardItem,
  type RewardTier,
  type RewardTierStatus,
} from '../../../data/rewardTiers'

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

type RewardTierDetailsModalProps = {
  currentUp: number
  isClaiming?: boolean
  onClaim: (tier: RewardTier) => void
  onClose: () => void
  tier: RewardTier
}

function RewardItemCard({ item }: { item: RewardItem }) {
  return (
    <div className="reward-detail-item">
      <div>
        <strong>{item.name}</strong>
        <span>Quantidade: {item.quantity}</span>
        {item.description && <p>{item.description}</p>}
      </div>
    </div>
  )
}

function getRewardSummary(tier: RewardTier) {
  if (tier.items.length > 0) {
    return `${tier.items.length} ${tier.items.length === 1 ? 'item na caixa' : 'itens na caixa'}`
  }

  return 'Caixa de recompensas'
}

function getActionLabel(status: RewardTierStatus, isClaiming: boolean) {
  if (isClaiming) {
    return 'Registrando resgate...'
  }

  if (status === 'locked') {
    return 'Bloqueado'
  }

  if (status === 'claimed' || status === 'delivered') {
    return 'Resgatado'
  }

  if (status === 'delivery_pending') {
    return 'Entrega pendente'
  }

  return 'Resgatar caixa'
}

export default function RewardTierDetailsModal({
  currentUp,
  isClaiming = false,
  onClaim,
  onClose,
  tier,
}: RewardTierDetailsModalProps) {
  const missingUp = Math.max(0, tier.requiredUpTotal - currentUp)
  const canClaim = tier.status === 'eligible'
  const rankTitle = getRewardTierPublicTitle(tier)

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
          aria-label="Fechar detalhes do rank"
          className="panel-modal-close"
          onClick={onClose}
          type="button"
        >
          <i className="bx bx-x" aria-hidden="true" />
        </button>

        <div className="reward-detail-header">
          <div>
            <h2 id="reward-tier-modal-title">Recompensas do {rankTitle}</h2>
          </div>
          <span className={`reward-status-badge ${statusClasses[tier.status]}`}>
            {statusLabels[tier.status]}
          </span>
        </div>

        <div className="reward-detail-meta">
          <div>
            <span>Meta</span>
            <strong>{formatApAmount(tier.requiredUpTotal)} AP</strong>
          </div>
          <div>
            <span>Caixa visual</span>
            <strong>{getRewardSummary(tier)}</strong>
          </div>
        </div>

        {tier.status === 'locked' && (
          <div className="reward-detail-note">
            Faltam {formatApAmount(missingUp)} AP para liberar este rank.
          </div>
        )}

        <section className="reward-detail-section">
          <h3>Itens dentro da caixa</h3>
        </section>

        <div className="reward-detail-items" aria-label="Itens dentro da caixa">
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
            {getActionLabel(tier.status, isClaiming)}
          </Button>
          <Button onClick={onClose} variant="ghost">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
