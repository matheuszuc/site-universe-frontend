import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { adminApi } from '../features/admin/services/adminApi'
import type { AdminGameDelivery } from '../features/admin/types/adminTypes'
import AdminLayout from '../layouts/AdminLayout'
import { ApiError, getApiErrorMessage } from '../services/api'

export default function AdminGameDeliveries() {
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState<AdminGameDelivery[]>([])
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDeliveries() {
      setIsLoading(true)
      setErrorMessage(undefined)

      try {
        const response = await adminApi.getGameDeliveries()
        if (isMounted) setDeliveries(response.deliveries)
      } catch (error) {
        if (!isMounted) return

        if (error instanceof ApiError && error.status === 401) {
          setUser(null)
          navigate('/login', { replace: true })
          return
        }

        setErrorMessage(getApiErrorMessage(error))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDeliveries()
    return () => { isMounted = false }
  }, [navigate, setUser])

  function formatDate(iso: string | null) {
    if (!iso) return t.admin.noDataLabel
    return new Date(iso).toLocaleDateString()
  }

  return (
    <AdminLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">{t.admin.deliveriesKicker}</p>
          <h1>{t.admin.deliveriesTitle}</h1>
          <p>{t.admin.deliveriesSubtitle}</p>
        </section>

        {isLoading && (
          <div className="panel-state" role="status">{t.admin.deliveriesLoading}</div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">{errorMessage}</div>
        )}

        {!isLoading && !errorMessage && deliveries.length === 0 && (
          <div className="panel-state">{t.admin.deliveriesEmpty}</div>
        )}

        {!isLoading && deliveries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t.admin.nameLabel}</th>
                  <th>{t.admin.typeLabel}</th>
                  <th>{t.admin.deliveryStatusLabel}</th>
                  <th>Rank</th>
                  <th>{t.admin.attemptsLabel}</th>
                  <th>{t.admin.createdAtLabel}</th>
                  <th>{t.admin.deliveredAtLabel}</th>
                  <th>{t.admin.lastErrorLabel}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td>
                      <div className="font-medium text-white">{delivery.userName}</div>
                      <div className="text-xs text-white/60">{delivery.userEmail}</div>
                    </td>
                    <td>{delivery.type}</td>
                    <td>
                      <span className={`admin-badge ${delivery.status === 'delivered' ? 'admin-badge--paid' : delivery.status === 'failed' ? 'admin-badge--error' : 'admin-badge--pending'}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td>{delivery.rewardTierCode ?? t.admin.noDataLabel}</td>
                    <td>{delivery.attempts}</td>
                    <td>{formatDate(delivery.createdAt)}</td>
                    <td>{formatDate(delivery.deliveredAt)}</td>
                    <td className="max-w-xs truncate text-xs text-red-300">
                      {delivery.lastError ?? t.admin.noDataLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminLayout>
  )
}
