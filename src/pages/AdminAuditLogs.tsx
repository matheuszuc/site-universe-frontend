import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { adminApi } from '../features/admin/services/adminApi'
import type { AdminAuditLog } from '../features/admin/types/adminTypes'
import AdminLayout from '../layouts/AdminLayout'
import { ApiError, getApiErrorMessage } from '../services/api'

export default function AdminAuditLogs() {
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadLogs() {
      setIsLoading(true)
      setErrorMessage(undefined)

      try {
        const response = await adminApi.getAuditLogs()
        if (isMounted) setLogs(response.logs)
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

    loadLogs()
    return () => { isMounted = false }
  }, [navigate, setUser])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString()
  }

  return (
    <AdminLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">{t.admin.auditKicker}</p>
          <h1>{t.admin.auditTitle}</h1>
          <p>{t.admin.auditSubtitle}</p>
        </section>

        {isLoading && (
          <div className="panel-state" role="status">{t.admin.auditLoading}</div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">{errorMessage}</div>
        )}

        {!isLoading && !errorMessage && logs.length === 0 && (
          <div className="panel-state">{t.admin.auditEmpty}</div>
        )}

        {!isLoading && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t.admin.eventTypeLabel}</th>
                  <th>{t.admin.actorLabel}</th>
                  <th>{t.admin.successLabel}</th>
                  <th>{t.admin.reasonLabel}</th>
                  <th>{t.admin.userLabel}</th>
                  <th>{t.admin.orderLabel}</th>
                  <th>{t.admin.createdAtLabel}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-white">{log.eventType}</td>
                    <td>{log.actorType}</td>
                    <td>
                      <span className={`admin-badge ${log.success ? 'admin-badge--paid' : 'admin-badge--error'}`}>
                        {log.success ? t.admin.yesLabel : t.admin.noLabel}
                      </span>
                    </td>
                    <td className="max-w-xs truncate text-xs">
                      {log.reason ?? t.admin.noDataLabel}
                    </td>
                    <td className="text-xs" title={log.userId ?? undefined}>
                      {log.userName || log.userEmail ? (
                        <div className="flex flex-col">
                          {log.userName && <span className="text-white">{log.userName}</span>}
                          {log.userEmail && <span className="text-white/60">{log.userEmail}</span>}
                        </div>
                      ) : log.userId ? (
                        <span className="font-mono">{log.userId.slice(0, 8) + '...'}</span>
                      ) : (
                        t.admin.noDataLabel
                      )}
                    </td>
                    <td className="font-mono text-xs">
                      {log.orderId ? log.orderId.slice(0, 8) + '...' : t.admin.noDataLabel}
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
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
