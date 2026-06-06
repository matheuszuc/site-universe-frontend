import Card from '../../../components/ui/Card'
import { formatApAmount } from '../../../data/storePackages'
import type { ApBalanceSummary } from '../types/userPanelTypes'

type BalanceCardProps = {
  balances: ApBalanceSummary
}

export default function BalanceCard({ balances }: BalanceCardProps) {
  return (
    <Card className="p-5">
      <p className="panel-card-kicker">Saldo AP</p>
      <div className="mt-3">
        <strong className="text-3xl font-black text-white">
          {formatApAmount(balances.availableAp)} AP
        </strong>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Saldo disponível confirmado pelo servidor.
      </p>
    </Card>
  )
}
