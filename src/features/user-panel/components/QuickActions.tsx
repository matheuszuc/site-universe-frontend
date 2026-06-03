import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'

type QuickAction =
  | {
      label: string
      icon: string
      disabled: true
    }
  | {
      label: string
      icon: string
      to: string
      disabled?: false
    }

const quickActions: QuickAction[] = [
  { label: 'Loja', icon: 'bx-store', disabled: true },
  { label: 'Recompensas', icon: 'bx-gift', disabled: true },
  { label: 'Suporte', icon: 'bx-support', disabled: true },
  { label: 'Termos', icon: 'bx-file', to: '/terms' },
  { label: 'Privacidade', icon: 'bx-lock-alt', to: '/privacy' },
]

export default function QuickActions() {
  return (
    <Card className="self-start p-5">
      <p className="panel-card-kicker">Atalhos</p>
      <h2 className="panel-card-title">Acesso rápido</h2>

      <div className="mt-5 grid gap-3">
        {quickActions.map((action) =>
          action.disabled ? (
            <button
              className="panel-action-button opacity-55"
              disabled
              key={action.label}
              type="button"
            >
              <i className={`bx ${action.icon}`} aria-hidden="true" />
              <span>{action.label}</span>
              <small>Integração futura</small>
            </button>
          ) : (
            <Link className="panel-action-button" key={action.label} to={action.to}>
              <i className={`bx ${action.icon}`} aria-hidden="true" />
              <span>{action.label}</span>
              <i className="bx bx-chevron-right ml-auto text-xl" aria-hidden="true" />
            </Link>
          ),
        )}
      </div>
    </Card>
  )
}
