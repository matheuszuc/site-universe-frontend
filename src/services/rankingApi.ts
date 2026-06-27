import { apiRequest } from './api'

export type RankingEntry = {
  position: number
  playerName: string
  className: string
  points: number
  winCount: number
  loseCount: number
  mvpCount: number
}

type RankingResponse = {
  ranking: RankingEntry[]
}

export type MonthlyRankingResult = {
  // false quando ainda nao ha snapshot do ciclo (cron nao rodou no dia 4).
  available: boolean
  ranking: RankingEntry[]
}

function searchQuery(search?: string) {
  const trimmed = search?.trim()
  return trimmed ? `?search=${encodeURIComponent(trimmed)}` : ''
}

// Busca o Hall da Fama (top 50 por pontos). search opcional filtra por nome de
// personagem (busca parcial, case-insensitive, resolvida no backend).
export async function getMvpRanking(search?: string) {
  const response = await apiRequest<RankingResponse>(`/api/ranking/mvp${searchQuery(search)}`)

  return response.ranking
}

// Ranking do ciclo atual (diferenca contra o snapshot do inicio do ciclo).
export async function getMonthlyMvpRanking(search?: string) {
  return apiRequest<MonthlyRankingResult>(`/api/ranking/mvp/monthly${searchQuery(search)}`)
}
