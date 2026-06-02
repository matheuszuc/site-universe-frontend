import Card from '../../../components/ui/Card'
import type { UserActivity } from '../types/userPanelTypes'

type ActivityHistoryProps = {
  activities: UserActivity[]
}

const typeLabels: Record<UserActivity['type'], string> = {
  account: 'Conta',
  transactions: 'Transações futuras',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export default function ActivityHistory({ activities }: ActivityHistoryProps) {
  return (
    <Card className="p-5 md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="panel-card-kicker">Histórico</p>
          <h2 className="panel-card-title">Atividades e transações</h2>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
          Somente leitura
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {activities.map((activity) => (
          <article
            className="rounded-lg border border-white/15 bg-white/[0.06] p-4"
            key={activity.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-cyan-100">{typeLabels[activity.type]}</p>
                <h3 className="mt-1 text-base font-black text-white">{activity.title}</h3>
              </div>
              <time className="text-xs font-semibold text-white/55" dateTime={activity.occurredAt}>
                {dateFormatter.format(new Date(activity.occurredAt))}
              </time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{activity.description}</p>
          </article>
        ))}
      </div>
    </Card>
  )
}
