import Card from '../../../components/ui/Card'
import type { UserActivity } from '../types/userPanelTypes'

type ActivityHistoryProps = {
  activities: UserActivity[]
}

const typeLabels: Record<UserActivity['type'], string> = {
  ACCOUNT_CREATED: 'Conta',
  EMAIL_VERIFIED: 'E-mail',
  PASSWORD_RESET_SUCCESS: 'Segurança',
}

const descriptions: Record<UserActivity['type'], string> = {
  ACCOUNT_CREATED: 'Registro seguro da criação da conta no backend.',
  EMAIL_VERIFIED: 'Confirmação de e-mail registrada no backend.',
  PASSWORD_RESET_SUCCESS: 'Senha redefinida com sucesso pelo fluxo de recuperação.',
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
          <h2 className="panel-card-title">Atividades da conta</h2>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
          Somente leitura
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {activities.length === 0 && (
          <div className="rounded-lg border border-white/15 bg-white/[0.06] p-4 text-sm leading-relaxed text-white/70">
            Nenhuma atividade segura disponível para exibição no momento.
          </div>
        )}

        {activities.map((activity, index) => (
          <article
            className="rounded-lg border border-white/15 bg-white/[0.06] p-4"
            key={`${activity.type}-${activity.createdAt}-${index}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-cyan-100">
                  {typeLabels[activity.type]}
                </p>
                <h3 className="mt-1 text-base font-black text-white">{activity.label}</h3>
              </div>
              <time className="text-xs font-semibold text-white/55" dateTime={activity.createdAt}>
                {dateFormatter.format(new Date(activity.createdAt))}
              </time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {descriptions[activity.type]}
            </p>
          </article>
        ))}
      </div>
    </Card>
  )
}
