import Card from '../../../components/ui/Card'
import { formatApAmount } from '../../../data/storePackages'
import type { UserActivity, UserOrderSummary } from '../types/userPanelTypes'

type ActivityHistoryProps = {
  activities: UserActivity[]
  orders: UserOrderSummary[]
}

const typeLabels: Record<UserActivity['type'], string> = {
  ACCOUNT_CREATED: 'Conta',
  EMAIL_VERIFIED: 'E-mail',
  PASSWORD_RESET_SUCCESS: 'Segurança',
}

const descriptions: Record<UserActivity['type'], string> = {
  ACCOUNT_CREATED: 'Registro seguro da criação da conta.',
  EMAIL_VERIFIED: 'Confirmação de e-mail registrada com sucesso.',
  PASSWORD_RESET_SUCCESS: 'Senha redefinida com sucesso pelo fluxo de recuperação.',
}

const orderStatusLabels: Record<string, string> = {
  pending_payment: 'Aguardando pagamento Pix',
  paid: 'Pago',
  fulfilled: 'Pago',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  failed: 'Falhou',
  refunded: 'Estornado',
  chargeback: 'Contestação',
}

const orderStatusClasses: Record<string, string> = {
  pending_payment: 'border-amber-200/35 bg-amber-200/10 text-amber-50',
  paid: 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50',
  fulfilled: 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50',
  cancelled: 'border-white/15 bg-white/10 text-white/60',
  expired: 'border-white/15 bg-white/10 text-white/60',
  failed: 'border-red-200/35 bg-red-200/10 text-red-50',
  refunded: 'border-cyan-200/35 bg-cyan-200/10 text-cyan-50',
  chargeback: 'border-red-200/35 bg-red-200/10 text-red-50',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function getOrderStatusLabel(status: string) {
  return orderStatusLabels[status] ?? status
}

function getOrderStatusClass(status: string) {
  return orderStatusClasses[status] ?? 'border-white/15 bg-white/10 text-white/65'
}

export default function ActivityHistory({ activities, orders }: ActivityHistoryProps) {
  return (
    <Card className="p-5 md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="panel-card-kicker">Histórico</p>
          <h2 className="panel-card-title">Pedidos e atividades</h2>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
          Somente leitura
        </span>
      </div>

      <section className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase text-white/80">Compras de Unicoin</h3>
          <span className="text-xs font-semibold text-white/50">Últimos pedidos</span>
        </div>

        <div className="mt-3 grid gap-3">
          {orders.length === 0 && (
            <div className="rounded-lg border border-white/15 bg-white/[0.06] p-4 text-sm leading-relaxed text-white/70">
              Você ainda não possui pedidos.
            </div>
          )}

          {orders.map((order) => (
            <article
              className="rounded-lg border border-white/15 bg-white/[0.06] p-4"
              key={order.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-cyan-100">
                    {order.orderNumber}
                  </p>
                  <h4 className="mt-1 text-base font-black text-white">
                    Compra de {formatApAmount(order.apAmount)} Unicoin
                  </h4>
                  <p className="mt-1 text-sm text-white/65">{order.packageName}</p>
                </div>
                <span
                  className={`inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-black uppercase ${getOrderStatusClass(
                    order.status,
                  )}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/70">
                <span>{order.formattedPrice}</span>
                <span>Criado em {dateFormatter.format(new Date(order.createdAt))}</span>
                {order.paidAt && (
                  <span>Pago em {dateFormatter.format(new Date(order.paidAt))}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-black uppercase text-white/80">Conta</h3>
        <div className="mt-3 grid gap-3">
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
                  <h4 className="mt-1 text-base font-black text-white">{activity.label}</h4>
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
      </section>
    </Card>
  )
}
