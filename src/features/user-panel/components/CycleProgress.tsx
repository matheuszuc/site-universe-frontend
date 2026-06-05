import Card from '../../../components/ui/Card'
import { formatApAmount } from '../../../data/storePackages'

type CycleProgressProps = {
  currentUp: number
  maxUp: number
  nextRankName: string
  missingUp: number
}

export default function CycleProgress({
  currentUp,
  maxUp,
  nextRankName,
  missingUp,
}: CycleProgressProps) {
  const progress = Math.min(100, Math.round((currentUp / maxUp) * 100))

  return (
    <Card className="p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <div>
          <h2 className="panel-card-title">Progresso da escala</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/68">
            Acumule AP comprando pacotes na loja. Ao atingir a meta de cada rank, uma caixa de
            recompensas será liberada. Ao concluir o Rank 6, a escala reinicia em um novo ciclo.
          </p>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/[0.08] p-4">
          <p className="text-xs font-black uppercase text-white/60">Próximo rank</p>
          <strong className="mt-1 block text-xl text-white">{nextRankName}</strong>
          <span className="mt-2 block text-sm font-bold text-cyan-100">
            Faltam {formatApAmount(missingUp)} AP
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-white/62">
          <span>Progresso da escala</span>
          <span>{progress}%</span>
        </div>
        <div className="cycle-progress-track" aria-label={`Progresso da escala: ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

    </Card>
  )
}
