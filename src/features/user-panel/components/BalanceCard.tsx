import Card from '../../../components/ui/Card'
import type { UserPanelData } from '../types/userPanelTypes'

type BalanceCardProps = {
  balance: UserPanelData['balance']
}

const currencyFormatter = new Intl.NumberFormat('pt-BR')
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card className="p-5">
      <p className="panel-card-kicker">Saldo UP</p>
      <div className="mt-3 flex items-end gap-2">
        <strong className="text-4xl font-black text-white">{currencyFormatter.format(balance.upAmount)}</strong>
        <span className="pb-1 text-sm font-bold text-cyan-100">UP</span>
      </div>
      <p className="mt-2 text-xs text-white/55">
        Atualizado em {dateFormatter.format(new Date(balance.updatedAt))}
      </p>
      <div className="mt-5 rounded-lg border border-amber-200/35 bg-amber-200/10 p-3 text-sm leading-relaxed text-amber-50">
        Saldo exibido apenas como informação. O saldo real será sempre validado pelo backend.
      </div>
    </Card>
  )
}
