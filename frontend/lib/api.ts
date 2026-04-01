const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const fetchLatestMatches = async (page: number, limit = 20) => {
  const res = await fetch(`${API_BASE}/api/matches?page=${page}&limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch matches')
  return res.json()
}

export const fetchHistoricalLeaderboard = async (
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const res = await fetch(`${API_BASE}/api/leaderboard/historical?${params}`)
  if (!res.ok) throw new Error('Failed to fetch historical leaderboard')
  return res.json()
}

export const fetchTodayLeaderboard = async () => {
  const res = await fetch(`${API_BASE}/api/leaderboard/today`)
  if (!res.ok) throw new Error('Failed to fetch today leaderboard')
  return res.json()
}

export const fetchMatchesByDate = async (
  date: string,
  page: number,
  limit = 20
) => {
  const res = await fetch(
    `${API_BASE}/api/matches/by-date?date=${date}&page=${page}&limit=${limit}`
  )
  if (!res.ok) throw new Error('Failed to fetch matches by date')
  return res.json()
}

export const fetchPlayerNames = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE}/api/matches/players`)
  if (!res.ok) throw new Error('Failed to fetch player names')
  return res.json()
}

export const fetchMatchesByPlayer = async (
  name: string,
  page: number,
  limit = 20
) => {
  const res = await fetch(
    `${API_BASE}/api/matches/by-player?name=${encodeURIComponent(name)}&page=${page}&limit=${limit}`
  )
  if (!res.ok) throw new Error('Failed to fetch matches by player')
  return res.json()
}

export const fetchPlayerStats = async (name: string) => {
  const res = await fetch(
    `${API_BASE}/api/matches/players/${encodeURIComponent(name)}/stats`
  )
  if (!res.ok) throw new Error('Failed to fetch player stats')
  return res.json()
}

export const fetchPredictorLeaderboard = async () => {
  const res = await fetch(`${API_BASE}/api/predictions/leaderboard`)
  if (!res.ok) throw new Error('Failed to fetch predictor leaderboard')
  return res.json()
}

export const fetchWeeklyPredictorLeaderboard = async () => {
  const res = await fetch(`${API_BASE}/api/predictions/leaderboard/weekly`)
  if (!res.ok) throw new Error('Failed to fetch weekly predictor leaderboard')
  return res.json()
}

export const fetchCurrentPredictorLeaderboard = async () => {
  const res = await fetch(`${API_BASE}/api/predictions/leaderboard/current`)
  if (!res.ok) throw new Error('Failed to fetch current predictor leaderboard')
  return res.json()
}