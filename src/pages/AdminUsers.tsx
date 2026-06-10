import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { adminApi } from '../features/admin/services/adminApi'
import type { AdminUser } from '../features/admin/types/adminTypes'
import AdminLayout from '../layouts/AdminLayout'
import { ApiError, getApiErrorMessage } from '../services/api'

export default function AdminUsers() {
  const { setUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      setIsLoading(true)
      setErrorMessage(undefined)

      try {
        const response = await adminApi.getUsers()
        if (isMounted) setUsers(response.users)
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

    loadUsers()
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
          <p className="panel-hero-kicker">{t.admin.usersKicker}</p>
          <h1>{t.admin.usersTitle}</h1>
          <p>{t.admin.usersSubtitle}</p>
        </section>

        {isLoading && (
          <div className="panel-state" role="status">{t.admin.usersLoading}</div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">{errorMessage}</div>
        )}

        {!isLoading && !errorMessage && users.length === 0 && (
          <div className="panel-state">{t.admin.usersEmpty}</div>
        )}

        {!isLoading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t.admin.nameLabel}</th>
                  <th>{t.admin.emailLabel}</th>
                  <th>{t.admin.roleUserLabel}</th>
                  <th>{t.admin.statusUserLabel}</th>
                  <th>{t.admin.emailVerifiedLabel}</th>
                  <th>{t.admin.createdAtLabel}</th>
                  <th>{t.admin.lastLoginLabel}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-white">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`admin-badge ${user.role === 'ADMIN' ? 'admin-badge--admin' : 'admin-badge--user'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.status}</td>
                    <td>{user.emailVerified ? t.admin.yesLabel : t.admin.noLabel}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLoginAt)}</td>
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
