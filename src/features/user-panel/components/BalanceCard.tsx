import Card from '../../../components/ui/Card'

export default function BalanceCard() {
  return (
    <Card className="p-5">
      <p className="panel-card-kicker">Saldo AP</p>
      <div className="mt-3">
        <strong className="text-3xl font-black text-white">Em breve</strong>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Indisponível até existir integração real de saldo no backend.
      </p>
      <div className="mt-5 rounded-lg border border-amber-200/35 bg-amber-200/10 p-3 text-sm leading-relaxed text-amber-50">
        Nenhum valor de saldo é exibido ou calculado pelo frontend.
      </div>
    </Card>
  )
}
