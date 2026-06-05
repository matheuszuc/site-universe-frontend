import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountSummaryCard from '../features/user-panel/components/AccountSummaryCard'
import ActivityHistory from '../features/user-panel/components/ActivityHistory'
import BalanceCard from '../features/user-panel/components/BalanceCard'
import EmailVerificationCard from '../features/user-panel/components/EmailVerificationCard'
import QuickActions from '../features/user-panel/components/QuickActions'
import { getUserPanelData } from '../features/user-panel/services/userPanelService'
import type { UserPanelData } from '../features/user-panel/types/userPanelTypes'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { useAuth } from '../contexts/AuthContext'
import { ApiError, getApiErrorMessage } from '../services/api'

export default function UserDashboard() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [panelData, setPanelData] = useState<UserPanelData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setErrorMessage(undefined)

      try {
        const data = await getUserPanelData()

        if (!isMounted) {
          return
        }

        setPanelData(data)
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          status: data.user.status,
          emailVerified: data.user.emailVerified,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setPanelData(null)

        if (error instanceof ApiError && error.status === 401) {
          setUser(null)
          navigate('/login', { replace: true })
          return
        }

        setErrorMessage(getApiErrorMessage(error))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [navigate, setUser])

  useEffect(() => {
    let isMounted = true

    async function refreshDashboardAfterPayment() {
      try {
        const data = await getUserPanelData()

        if (!isMounted) {
          return
        }

        setPanelData(data)
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          status: data.user.status,
          emailVerified: data.user.emailVerified,
        })
      } catch {
        // The next explicit dashboard load will show any persistent backend error.
      }
    }

    window.addEventListener('site-universe:payment-updated', refreshDashboardAfterPayment)

    return () => {
      isMounted = false
      window.removeEventListener('site-universe:payment-updated', refreshDashboardAfterPayment)
    }
  }, [setUser])

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

        {isLoading && (
          <div className="panel-state" role="status">
            Carregando painel...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">
            {errorMessage}
          </div>
        )}

        {!isLoading && panelData && (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="grid gap-4 md:grid-cols-2">
              <AccountSummaryCard account={panelData.account} user={panelData.user} />
              <BalanceCard balances={panelData.balances} />
              <div className="md:col-span-2">
                <EmailVerificationCard user={panelData.user} />
              </div>
              <ActivityHistory activities={panelData.activities} orders={panelData.orders} />
            </div>
            <QuickActions />
          </section>
        )}
      </main>
    </AuthenticatedLayout>
  )
}
