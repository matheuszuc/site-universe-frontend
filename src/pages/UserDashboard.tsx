import AccountSummaryCard from '../features/user-panel/components/AccountSummaryCard'
import ActivityHistory from '../features/user-panel/components/ActivityHistory'
import BalanceCard from '../features/user-panel/components/BalanceCard'
import EmailVerificationCard from '../features/user-panel/components/EmailVerificationCard'
import QuickActions from '../features/user-panel/components/QuickActions'
import { userPanelMock } from '../features/user-panel/mocks/userPanelMock'
import type { AccountStatus, UserPanelData } from '../features/user-panel/types/userPanelTypes'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { useAuth } from '../contexts/AuthContext'
import type { AuthUser } from '../features/auth/types/authTypes'

function getAccountStatus(user: AuthUser): AccountStatus {
  if (!user.emailVerified || user.status === 'pending_verification') {
    return 'pending_verification'
  }

  if (user.status !== 'active') {
    return 'restricted'
  }

  return 'active'
}

function buildPanelData(user: AuthUser): UserPanelData {
  return {
    ...userPanelMock,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      accountStatus: getAccountStatus(user),
      emailVerified: user.emailVerified,
    },
  }
}

export default function UserDashboard() {
  const { user } = useAuth()
  const panelData = user ? buildPanelData(user) : null

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">Site Universe</p>
          <h1>Painel do jogador</h1>
          <p>
            Acompanhe os dados reais da sua conta, o status de verificação do e-mail e atalhos
            informativos da área do jogador.
          </p>
        </section>

        {!panelData && (
          <div className="panel-state" role="status">
            Carregando painel...
          </div>
        )}

        {panelData && (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="grid gap-4 md:grid-cols-2">
              <AccountSummaryCard user={panelData.user} />
              <BalanceCard balance={panelData.balance} />
              <div className="md:col-span-2">
                <EmailVerificationCard user={panelData.user} />
              </div>
              <ActivityHistory activities={panelData.activities} />
            </div>
            <QuickActions />
          </section>
        )}
      </main>
    </AuthenticatedLayout>
  )
}
