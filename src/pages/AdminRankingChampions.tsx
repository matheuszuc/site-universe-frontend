import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../i18n'
import { adminApi } from '../features/admin/services/adminApi'
import type { AdminChampion } from '../features/admin/types/adminTypes'
import AdminLayout from '../layouts/AdminLayout'
import { ApiError, getApiErrorMessage } from '../services/api'

// Periodo padrao: mes anterior ao atual (mesma regra do backend).
function previousMonthPeriod() {
  const now = new Date()
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { month: previous.getMonth() + 1, year: previous.getFullYear() }
}

export default function AdminRankingChampions() {
  const { setUser } = useAuth()
  const { t, lang } = useTranslation()
  const navigate = useNavigate()

  const initialPeriod = previousMonthPeriod()
  const [month, setMonth] = useState(initialPeriod.month)
  const [year, setYear] = useState(initialPeriod.year)
  const [period, setPeriod] = useState(initialPeriod)
  const [champions, setChampions] = useState<AdminChampion[]>([])
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(lang, { month: 'long' })
    return Array.from({ length: 12 }, (_, index) =>
      formatter.format(new Date(2020, index, 1)),
    )
  }, [lang])

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, index) => current - index)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadChampions() {
      setIsLoading(true)
      setErrorMessage(undefined)

      try {
        const response = await adminApi.getChampions(period.month, period.year)
        if (isMounted) setChampions(response.champions)
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

    loadChampions()
    return () => {
      isMounted = false
    }
  }, [navigate, setUser, period])

  function handleView() {
    setPeriod({ month, year })
  }

  const a = t.admin

  return (
    <AdminLayout>
      <main className="panel-main">
        <section className="panel-hero">
          <p className="panel-hero-kicker">{a.championsKicker}</p>
          <h1>{a.championsTitle}</h1>
          <p>{a.championsSubtitle}</p>
        </section>

        <div className="champions-filters">
          <label className="champions-field">
            <span>{a.championMonthLabel}</span>
            <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="champions-field">
            <span>{a.championYearLabel}</span>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {yearOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button className="panel-topbar-link" type="button" onClick={handleView}>
            {a.championViewButton}
          </button>
        </div>

        {isLoading && (
          <div className="panel-state" role="status">
            {a.championsLoading}
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="panel-state panel-state-error" role="alert">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && champions.length === 0 && (
          <div className="panel-state">{a.championsEmpty}</div>
        )}

        {!isLoading && champions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <th>{a.championPositionLabel}</th>
                  <th>{a.championPlayerLabel}</th>
                  <th>{a.championClassLabel}</th>
                  <th>{a.championPointsLabel}</th>
                  <th>{a.championWinsLabel}</th>
                  <th>{a.championLossesLabel}</th>
                  <th>{a.championMvpsLabel}</th>
                </tr>
              </thead>
              <tbody>
                {champions.map((champion) => (
                  <tr key={`${champion.position}-${champion.playerName}`}>
                    <td className="font-bold text-cyan-200">{champion.position}</td>
                    <td className="font-medium text-white">{champion.playerName}</td>
                    <td>{champion.className}</td>
                    <td className="font-bold text-amber-200">{champion.points}</td>
                    <td>{champion.winCount}</td>
                    <td>{champion.loseCount}</td>
                    <td>{champion.mvpCount}</td>
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
