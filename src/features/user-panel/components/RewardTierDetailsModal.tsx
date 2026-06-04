import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Button from '../../../components/ui/Button'
import { formatUpAmount } from '../../../data/storePackages'
import type {
  RewardItem,
  RewardOption,
  RewardTier,
  RewardTierStatus,
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
  onClose: () => void
  tier: RewardTier
}

function RewardItemCard({ item }: { item: RewardItem }) {
  return (
    <div className="reward-detail-item">
      <span className="reward-detail-item-icon" aria-hidden="true">
        <i className="bx bx-cube" />
      </span>
      <div>
        <strong>{item.name}</strong>
        <span>x{item.quantity}</span>
        {item.description && <p>{item.description}</p>}
      </div>
    </div>
  )
}

function RewardOptionCard({
  isSelected,
  onSelect,
  option,
}: {
  isSelected: boolean
  onSelect: (option: RewardOption) => void
  option: RewardOption
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={`reward-option-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(option)}
      type="button"
    >
      <span className="reward-option-check" aria-hidden="true">
        <i className={isSelected ? 'bx bx-check' : 'bx bx-radio-circle'} />
      </span>
      <span>
        <strong>{option.name}</strong>
        {option.description && <small>{option.description}</small>}
      </span>
    </button>
  )
}

export default function RewardTierDetailsModal({
  currentUp,
  onClose,
  tier,
}: RewardTierDetailsModalProps) {
  const [selectedOptionCode, setSelectedOptionCode] = useState<string>()
  const selectedOption = useMemo(
    () => tier.options?.find((option) => option.code === selectedOptionCode),
    [selectedOptionCode, tier.options],
  )
  const hasOptions = Boolean(tier.options?.length)
  const visibleItems = selectedOption?.items ?? tier.items ?? []
  const missingUp = Math.max(0, tier.requiredUpTotal - currentUp)
  const canConfirmMock = tier.status === 'eligible' && (!hasOptions || Boolean(selectedOption))

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

  function getActionLabel() {
    if (tier.status === 'locked') {
      return 'Bloqueado'
    }

    if (tier.status === 'claimed' || tier.status === 'delivered') {
      return 'Resgatado'
    }

    if (tier.status === 'delivery_pending') {
      return 'Entrega pendente'
    }

    return hasOptions ? 'Confirmar resgate em breve' : 'Resgate em breve'
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
            <p className="panel-card-kicker">Detalhes do rank</p>
            <h2 id="reward-tier-modal-title">{tier.name}</h2>
            <p>{tier.description}</p>
          </div>
          <span className={`reward-status-badge ${statusClasses[tier.status]}`}>
            {statusLabels[tier.status]}
          </span>
        </div>

        <div className="reward-detail-meta">
          <div>
            <span>Meta necessária</span>
            <strong>{formatUpAmount(tier.requiredUpTotal)} UP</strong>
          </div>
          <div>
            <span>UP acumulado</span>
            <strong>{formatUpAmount(currentUp)} UP</strong>
          </div>
        </div>

        {tier.status === 'locked' && (
          <div className="reward-detail-note">
            Faltam {formatUpAmount(missingUp)} UP para liberar este rank.
          </div>
        )}

        {hasOptions ? (
          <section className="reward-detail-section">
            <h3>Escolha uma opção de recompensa</h3>
            <div className="reward-option-grid">
              {tier.options?.map((option) => (
                <RewardOptionCard
                  isSelected={option.code === selectedOptionCode}
                  key={option.code}
                  onSelect={(nextOption) => setSelectedOptionCode(nextOption.code)}
                  option={option}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="reward-detail-section">
            <h3>Recompensas deste rank</h3>
          </section>
        )}

        {hasOptions && !selectedOption ? (
          <div className="reward-detail-empty">
            Selecione uma opção para visualizar o conjunto de recompensas.
          </div>
        ) : (
          <div className="reward-detail-items" aria-label="Lista de recompensas">
            {visibleItems.map((item) => (
              <RewardItemCard item={item} key={`${item.name}-${item.quantity}`} />
            ))}
          </div>
        )}

        <div className="reward-detail-actions">
          <Button disabled={!canConfirmMock} variant={canConfirmMock ? 'primary' : 'secondary'}>
            <i className="bx bx-gift text-xl" aria-hidden="true" />
            {getActionLabel()}
          </Button>
          <Button onClick={onClose} variant="ghost">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
