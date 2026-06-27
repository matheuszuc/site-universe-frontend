import { useEffect, useState } from 'react'
import PublicLayout from '../components/layout/PublicLayout'
import { useTranslation } from '../i18n'
import { getMvpRanking, type RankingEntry } from '../services/rankingApi'

export default function HallDaFama() {
  const { t, formatAmount } = useTranslation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Debounce de 300ms: evita disparar uma requisicao a cada tecla digitada.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    setIsLoading(true)

    getMvpRanking(debouncedSearch)
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
  }, [debouncedSearch])

  const tr = t.hallOfFame

  return (
    <PublicLayout>
      <main className="hall-page">
        <section className="hall-hero">
          <p className="legal-kicker">{tr.kicker}</p>
          <h1>{tr.title}</h1>
          <p>{tr.subtitle}</p>

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
                    <th>{tr.mvpLabel}</th>
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
                      <td>{formatAmount(entry.mvpCount)}</td>
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
