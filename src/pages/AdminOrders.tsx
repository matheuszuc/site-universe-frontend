import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { adminApi } from '../features/admin/services/adminApi'
import type { AdminOrder } from '../features/admin/types/adminTypes'
import AdminLayout from '../layouts/AdminLayout'
import { ApiError, getApiErrorMessage } from '../services/api'
import { formatCurrencyFromCents } from '../data/storePackages'

export default function AdminOrders() {
  const { setUser } = useAuth()
  const { t, formatAmount } = useTranslation()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      setIsLoading(true)
      setErrorMessage(undefined)

      try {
        const response = await adminApi.getOrders()
        if (isMounted) setOrders(response.orders)
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

    loadOrders()
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
          <p className="panel-hero-kicker">{t.admin.ordersKicker}</p>
          <h1>{t.admin.ordersTitle}</h1>
          <p>{t.admin.ordersSubtitle}</p>
        </section>

        {isLoading && (
          <div className="panel-state" role="status">{t.admin.ordersLoading}</div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">{errorMessage}</div>
        )}

        {!isLoading && !errorMessage && orders.length === 0 && (
          <div className="panel-state">{t.admin.ordersEmpty}</div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t.admin.orderNumberLabel}</th>
                  <th>{t.admin.nameLabel}</th>
                  <th>{t.admin.packageLabel}</th>
                  <th>Unicoin</th>
                  <th>{t.admin.amountLabel}</th>
                  <th>{t.admin.orderStatusLabel}</th>
                  <th>{t.admin.createdAtLabel}</th>
                  <th>{t.admin.paidAtLabel}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs text-white">{order.orderNumber}</td>
                    <td>{order.userName}</td>
                    <td>{order.packageName}</td>
                    <td>{formatAmount(order.rewardAmount)}</td>
                    <td>{formatCurrencyFromCents(order.amountCents, order.currency)}</td>
                    <td>
                      <span className={`admin-badge ${order.status === 'paid' || order.status === 'fulfilled' ? 'admin-badge--paid' : 'admin-badge--pending'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatDate(order.paidAt)}</td>
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
