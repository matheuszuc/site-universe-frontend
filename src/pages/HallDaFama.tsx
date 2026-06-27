import { useEffect, useState } from 'react'
import PublicLayout from '../components/layout/PublicLayout'
import { useTranslation } from '../i18n'
import { getMonthlyMvpRanking, getMvpRanking, type RankingEntry } from '../services/rankingApi'

type RankingTab = 'general' | 'monthly'

export default function HallDaFama() {
  const { t, formatAmount } = useTranslation()
  const [tab, setTab] = useState<RankingTab>('general')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // true quando o ciclo mensal ainda nao tem snapshot (cron nao rodou no dia 4).
  const [monthlyUnavailable, setMonthlyUnavailable] = useState(false)

  // Debounce de 300ms: evita disparar uma requisicao a cada tecla digitada.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setMonthlyUnavailable(false)

    const request =
      tab === 'monthly'
        ? getMonthlyMvpRanking(debouncedSearch).then((result) => {
            if (active) setMonthlyUnavailable(!result.available)
            return result.ranking
          })
        : getMvpRanking(debouncedSearch)

    request
      .then((ranking) => {
        if (active) setEntries(ranking)
      })
      .catch(() => {
        if (active) setEntries([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, tab])

  const tr = t.hallOfFame

  const tabs: { key: RankingTab; label: string }[] = [
    { key: 'general', label: tr.tabGeneral },
    { key: 'monthly', label: tr.tabMonthly },
  ]

  return (
    <PublicLayout>
      <main className="hall-page">
        <section className="hall-hero">
          <p className="legal-kicker">{tr.kicker}</p>
          <h1>{tr.title}</h1>
          <p>{tr.subtitle}</p>

          <div className="hall-tabs" role="tablist" aria-label={tr.title}>
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                className={`hall-tab ${tab === item.key ? 'hall-tab--active' : ''}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hall-search">
            <label className="hall-search-label" htmlFor="hall-search">
              {tr.searchLabel}
            </label>
            <input
              id="hall-search"
              className="hall-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr.searchPlaceholder}
              autoComplete="off"
            />
          </div>
        </section>

        <section className="hall-content" aria-live="polite">
          {isLoading ? (
            <p className="hall-status">{tr.loading}</p>
          ) : tab === 'monthly' && monthlyUnavailable ? (
            <p className="hall-status">{tr.monthlyUnavailable}</p>
          ) : entries.length === 0 ? (
            <p className="hall-status">{tr.empty}</p>
          ) : (
            <div className="hall-table-wrapper">
              <table className="admin-table hall-table">
                <thead>
                  <tr>
                    <th>{tr.colPosition}</th>
                    <th>{tr.colClass}</th>
                    <th>{tr.colPlayer}</th>
                    <th>{tr.colPoints}</th>
                    <th>{tr.colWins}</th>
                    <th>{tr.colLosses}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={`${entry.position}-${entry.playerName}`}>
                      <td className="hall-position">{entry.position}</td>
                      <td>{entry.className}</td>
                      <td className="hall-player">{entry.playerName}</td>
                      <td className="hall-points">{formatAmount(entry.points)}</td>
                      <td>{formatAmount(entry.winCount)}</td>
                      <td>{formatAmount(entry.loseCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  )
}
