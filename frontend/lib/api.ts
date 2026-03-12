const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const fetchLatestMatches = async (page: number, limit = 20) => {
  const res = await fetch(`${API_BASE}/api/matches?page=${page}&limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch matches')
  return res.json()
}

export const fetchHistoricalLeaderboard = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  const res = await fetch(`${API_BASE}/api/leaderboard/historical?${params}`)
  if (!res.ok) throw new Error('Failed to fetch historical leaderboard')
  return res.json()
}