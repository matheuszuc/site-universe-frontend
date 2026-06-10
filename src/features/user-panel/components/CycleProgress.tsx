import Card from '../../../components/ui/Card'
import { useTranslation } from '../../../i18n'

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
  const { t, formatAmount } = useTranslation()
  const progress = Math.min(100, Math.round((currentUp / maxUp) * 100))
  const progressSummary = t.rewards.progressSummary
    .replace('{current}', formatAmount(currentUp))
    .replace('{max}', formatAmount(maxUp))
  const missingLabel = t.rewards.missing.replace('{amount}', formatAmount(missingUp))
  const progressAriaLabel = `${t.rewards.progressTitle}: ${progress}%`

  return (
    <Card className="p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <div>
          <h2 className="panel-card-title">{t.rewards.progressTitle}</h2>
          <strong className="mt-2 block text-2xl text-white">{progressSummary}</strong>
          <p className="mt-3 text-sm leading-relaxed text-white/68">{t.rewards.progressNote}</p>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/[0.08] p-4">
          <p className="text-xs font-black uppercase text-white/60">{t.rewards.nextRank}</p>
          <strong className="mt-1 block text-xl text-white">{nextRankName}</strong>
          <span className="mt-2 block text-sm font-bold text-cyan-100">{missingLabel}</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase text-white/62">
          <span>{t.rewards.progressTitle}</span>
          <span>{progress}%</span>
        </div>
        <div className="cycle-progress-track" aria-label={progressAriaLabel}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Card>
  )
}
