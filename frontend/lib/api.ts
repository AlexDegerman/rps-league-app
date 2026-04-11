import type {
  UserStats,
  ProfileData,
  RecoverResponse,
  LeaderboardEntry,
  PredictionResponse,
  UserPointsData,
  Match,
  SinglePlayerStats,
  PendingMatch
} from '@/types/rps'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function handleResponse<T>(
  promise: Promise<Response>
): Promise<T | null> {
  try {
    const res = await promise
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error('API Error:', error)
    return null
  }
}

/* --- USER & PROFILE --- */

export async function fetchUserProfile(shortId: string) {
  return handleResponse<ProfileData>(
    fetch(`${API_BASE}/api/users/profile/${shortId}`)
  )
}

export async function fetchUserStats(userId: string, shortId: string) {
  return handleResponse<UserStats>(
    fetch(`${API_BASE}/api/predictions/${userId}/stats?shortId=${shortId}`)
  )
}

export async function fetchUserPoints(userId: string, shortId: string, nickname?: string) {
  const params = new URLSearchParams({ shortId });
  if (nickname) params.append('nickname', nickname);

  return handleResponse<UserPointsData>(
    fetch(`${API_BASE}/api/users/${userId}/points?${params.toString()}`)
  )
}

export async function updateNickname(
  shortId: string,
  nickname: string,
  userId: string
) {
  return fetch(`${API_BASE}/api/users/update-nickname`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shortId, nickname, userId })
  })
}

export const fetchUserBetHistory = async (
  userId: string,
  page: number,
  sort: 'recent' | 'wins' | 'multipliers' = 'recent'
) => {
  const res = await fetch(
    `${API_BASE}/api/predictions/user/${userId}/history?page=${page}&limit=20&sort=${sort}`
  )
  if (!res.ok) throw new Error('Failed to fetch bet history')
  return res.json()
}

export async function updateLinkedin(
  shortId: string,
  linkedinUrl: string | null,
  showLinkedinBadge: boolean
) {
  return fetch(`${API_BASE}/api/users/update-linkedin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shortId, linkedinUrl, showLinkedinBadge })
  })
}

/* --- AUTH & RECOVERY --- */

export async function fetchRecoveryCode(userId: string) {
  return fetch(`${API_BASE}/api/users/recovery/${userId}`)
}

export async function handleRecoverProfile(recoveryCode: string) {
  return handleResponse<RecoverResponse>(
    fetch(`${API_BASE}/api/users/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryCode })
    })
  )
}

/* --- PREDICTIONS & MATCHES --- */

export async function postPrediction(
  params: {
    userId: string
    gameId: string
    pick: string
    betAmount: string
    nickname: string
    shortId: string
  },
  signal?: AbortSignal
): Promise<{ ok: boolean; data: PredictionResponse | null }> {
  const res = await fetch(`${API_BASE}/api/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal
  })
  const data = await res.json()
  return { ok: res.ok, data: data as PredictionResponse }
}

export async function fetchPendingMatches() {
  return handleResponse<PendingMatch[]>(
    fetch(`${API_BASE}/api/matches/pending`)
  )
}

export async function fetchLatestMatches(page: number, limit = 20) {
  return handleResponse<{ matches: Match[]; total: number }>(
    fetch(`${API_BASE}/api/matches?page=${page}&limit=${limit}`)
  )
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

/* --- LEADERBOARDS & STATS --- */

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

export async function fetchUnifiedLeaderboard(
  tab: string,
  sort = 'points',
  dir = 'desc'
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({ tab, sort, dir })

  const result = await handleResponse<LeaderboardEntry[]>(
    fetch(`${API_BASE}/api/leaderboard/unified?${params}`)
  )

  if (!result) {
    throw new Error('Could not fetch leaderboard data')
  }

  return result
}

export async function fetchRank(
  tab: string,
  targetShortId: string
): Promise<number | null> {
  const data = await fetchUnifiedLeaderboard(tab)
  if (!data) return null
  const index = data.findIndex((e) => e.shortId === targetShortId)
  return index !== -1 ? index + 1 : null
}

export async function fetchPlayerStats(name: string) {
  return handleResponse<SinglePlayerStats>(
    fetch(`${API_BASE}/api/matches/players/${encodeURIComponent(name)}/stats`)
  )
}

export async function fetchDailyStats() {
  return handleResponse<{
    totalVolume: string
    dailyPayout: string
    winRate: number
    totalBets: number
    mvp: { nickname: string; gain: string } | null
  }>(fetch(`${API_BASE}/api/predictions/stats/daily`))
}