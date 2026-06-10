import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { adminApi } from '../features/admin/services/adminApi'
import type { AdminMeResponse } from '../features/admin/types/adminTypes'
import AdminLayout from '../layouts/AdminLayout'
import { ApiError, getApiErrorMessage } from '../services/api'

export default function AdminDashboard() {
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [adminMe, setAdminMe] = useState<AdminMeResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isForbidden, setIsForbidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadAdmin() {
      setIsLoading(true)
      setErrorMessage(undefined)
      setIsForbidden(false)

      try {
        const response = await adminApi.me()

        if (isMounted) {
          setAdminMe(response)
        }
      } catch (error) {
        if (!isMounted) return

        setAdminMe(null)

        if (error instanceof ApiError && error.status === 401) {
          setUser(null)
          navigate('/login', { replace: true })
          return
        }

        if (error instanceof ApiError && error.status === 403) {
          setIsForbidden(true)
          return
        }

        setErrorMessage(getApiErrorMessage(error))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAdmin()

    return () => {
      isMounted = false
    }
  }, [navigate, setUser])

  return (
    <AdminLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">{t.admin.baseKicker}</p>
          <h1>{t.admin.baseTitle}</h1>
          <p>{t.admin.baseSubtitle}</p>
        </section>

        {isLoading && (
          <div className="panel-state" role="status">
            {t.admin.validating}
          </div>
        )}

        {!isLoading && isForbidden && (
          <div className="panel-state panel-state-error" role="alert">
            {t.admin.accessDenied}
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">
            {errorMessage}
          </div>
        )}

        {!isLoading && adminMe && (
          <section className="grid gap-4 md:grid-cols-2">
            <article className="panel-card">
              <p className="panel-card-kicker">{t.admin.sessionKicker}</p>
              <h2 className="panel-card-title">{t.admin.sessionTitle}</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-cyan-100/80">{t.admin.statusLabel}</dt>
                  <dd className="mt-1 font-semibold text-white">{t.admin.authorized}</dd>
                </div>
                <div>
                  <dt className="text-cyan-100/80">{t.admin.roleLabel}</dt>
                  <dd className="mt-1 font-semibold text-white">{adminMe.role}</dd>
                </div>
              </dl>
            </article>
          </section>
        )}
      </main>
    </AdminLayout>
  )
}
