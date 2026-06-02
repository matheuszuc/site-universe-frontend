import { useEffect, useState } from 'react'
import AccountSummaryCard from '../features/user-panel/components/AccountSummaryCard'
import ActivityHistory from '../features/user-panel/components/ActivityHistory'
import BalanceCard from '../features/user-panel/components/BalanceCard'
import EmailVerificationCard from '../features/user-panel/components/EmailVerificationCard'
import QuickActions from '../features/user-panel/components/QuickActions'
import { getUserPanelData } from '../features/user-panel/services/userPanelService'
import type { UserPanelData } from '../features/user-panel/types/userPanelTypes'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'

export default function UserDashboard() {
  const [panelData, setPanelData] = useState<UserPanelData>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let isMounted = true

    async function loadPanelData() {
      try {
        const data = await getUserPanelData()

        if (isMounted) {
          setPanelData(data)
        }
      } catch {
        if (isMounted) {
          setError('Não foi possível carregar os dados do painel.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPanelData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AuthenticatedLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">Site Universe</p>
          <h1>Painel do jogador</h1>
          <p>
            Acompanhe dados de conta, status de e-mail, saldo informativo e atividades em um
            painel preparado para integração futura com backend.
          </p>
        </section>

        {isLoading && (
          <div className="panel-state" role="status">
            Carregando painel...
          </div>
        )}

        {error && (
          <div className="panel-state panel-state-error" role="alert">
            {error}
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
