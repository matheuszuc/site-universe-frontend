import { classNames } from '../../../utils/classNames'
import type { AccountStatus } from '../types/userPanelTypes'

type BadgeStatus = AccountStatus | 'verified' | 'unverified'

type StatusBadgeProps = {
  status: BadgeStatus
}

const labels: Record<BadgeStatus, string> = {
  active: 'Ativa',
  pending_verification: 'Pendente',
  restricted: 'Restrita',
  verified: 'Verificado',
  unverified: 'Não verificado',
}

const styles: Record<BadgeStatus, string> = {
  active: 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50',
  pending_verification: 'border-amber-300/50 bg-amber-300/15 text-amber-50',
  restricted: 'border-red-300/50 bg-red-300/15 text-red-50',
  verified: 'border-emerald-300/50 bg-emerald-300/15 text-emerald-50',
  unverified: 'border-amber-300/50 bg-amber-300/15 text-amber-50',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex min-h-7 items-center justify-center rounded-full border px-3 text-xs font-black uppercase',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  )
}
