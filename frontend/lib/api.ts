import type {
  UserStats,
  ProfileData,
  RecoverResponse,
  LeaderboardEntry,
  PredictionResponse,
  UserPointsData,
  Match,
  SinglePlayerStats,
  PendingMatch,
  AchievementEntry,
  AchievementStats,
  BetHistoryEntry,
  PlayerStats,
  BadgeData,
  GlobalEventStateResponse,
  OracleResponse
} from '@/types/rps'
import { logger } from '@/lib/logger'
import { getOrCreateUser, getStoredRecoveryCode } from './user'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function handleResponse<T>(
  promise: Promise<Response>
): Promise<T | null> {
  try {
    const res = await promise
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    logger.error(
      'API request failed',
      error instanceof Error ? error : undefined
    )
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

export async function fetchUserPoints(
  userId: string,
  shortId: string,
  nickname?: string,
  utmSource?: string
) {
  const params = new URLSearchParams({ shortId })
  if (nickname) params.append('nickname', nickname)
  if (utmSource) params.append('utm_source', utmSource)

  return handleResponse<UserPointsData>(
    fetch(`${API_BASE}/api/users/${userId}/points?${params.toString()}`)
  )
}

export async function updateNickname(
  userId: string,
  newNickname: string,
  shortId: string
) {
  return handleResponse<{ success: boolean }>(
    fetch(`${API_BASE}/api/users/update-nickname`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nickname: newNickname, shortId })
    })
  )
}

export async function fetchUserBetHistory(
  userId: string,
  page: number,
  sort: 'recent' | 'wins' | 'multipliers' = 'recent'
): Promise<{
  matches: Match[]
  predictions: BetHistoryEntry[]
  hasMore: boolean
} | null> {
  return handleResponse<{
    matches: Match[]
    predictions: BetHistoryEntry[]
    hasMore: boolean
  }>(
    fetch(
      `${API_BASE}/api/predictions/user/${userId}/history?page=${page}&limit=20&sort=${sort}`
    )
  )
}

export async function updateLinkedin(
  shortId: string,
  linkedinUrl: string | null,
  showLinkedinBadge: boolean
) {
  return handleResponse<{ success: boolean }>(
    fetch(`${API_BASE}/api/users/update-linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortId, linkedinUrl, showLinkedinBadge })
    })
  )
}

export async function ascendUser(userId: string, shortId: string) {
  return handleResponse<{
    success: boolean
    laps: number
    fastestLapBets: number
  }>(
    fetch(`${API_BASE}/api/ascend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, shortId })
    })
  )
}

export async function markAutoBetUsed(userId: string): Promise<void> {
  const { shortId } = getOrCreateUser()
  try {
    await fetch(`${API_BASE}/api/users/${userId}/auto-bet-used`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortId })
    })
  } catch {}
}

/* --- AUTH & RECOVERY --- */

export async function fetchRecoveryCode(): Promise<{
  recoveryCode: string
} | null> {
  const stored = getStoredRecoveryCode()
  if (stored) return { recoveryCode: stored }
  return null
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
  try {
    const res = await fetch(`${API_BASE}/api/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal
    })
    const data = await res.json()
    return { ok: res.ok, data: data as PredictionResponse }
  } catch {
    return { ok: false, data: null }
  }
}

export async function fetchPendingMatches() {
  return handleResponse<PendingMatch[]>(
    fetch(`${API_BASE}/api/matches/pending`)
  )
}

export async function fetchLatestMatches(
  page: number,
  limit = 20
): Promise<{ matches: Match[]; hasMore: boolean } | null> {
  return handleResponse<{ matches: Match[]; hasMore: boolean }>(
    fetch(`${API_BASE}/api/matches?page=${page}&limit=${limit}`)
  )
}

export async function fetchMatchesByDate(
  date: string,
  page: number,
  limit = 20
): Promise<{ matches: Match[]; hasMore: boolean } | null> {
  return handleResponse<{ matches: Match[]; hasMore: boolean }>(
    fetch(
      `${API_BASE}/api/matches/by-date?date=${date}&page=${page}&limit=${limit}`
    )
  )
}

export async function fetchPlayerNames() {
  return handleResponse<string[]>(fetch(`${API_BASE}/api/matches/players`))
}

export async function fetchMatchesByPlayer(
  name: string,
  page: number,
  limit = 20
): Promise<{ matches: Match[]; hasMore: boolean } | null> {
  return handleResponse<{ matches: Match[]; hasMore: boolean }>(
    fetch(
      `${API_BASE}/api/matches/by-player?name=${encodeURIComponent(name)}&page=${page}&limit=${limit}`
    )
  )
}

/* --- LEADERBOARDS & STATS --- */

export async function fetchHistoricalLeaderboard(
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)
  return handleResponse<PlayerStats[]>(
    fetch(`${API_BASE}/api/leaderboard/historical?${params}`)
  )
}

export async function fetchTodayLeaderboard() {
  return handleResponse<PlayerStats[]>(
    fetch(`${API_BASE}/api/leaderboard/today`)
  )
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
  if (!result) throw new Error('Could not fetch leaderboard data')
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

export async function fetchFestivalState() {
  return handleResponse<{
    festival: {
      type: string
      triggeredBy: string
      startedAt: number
      endsAt: number | null
    } | null
    lockoutRemaining: number
  }>(fetch(`${API_BASE}/api/live/festival-state`))
}

export async function submitFeedback(formData: FormData) {
  try {
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST',
      body: formData
    })
    if (res.ok) return { ok: true }
    const d = await res.json().catch(() => ({}))
    return { error: d.error ?? 'UNKNOWN' }
  } catch {
    return { error: 'CONNECTION_FAILED' }
  }
}

export async function updateStylePreference(
  shortId: string,
  stylePreference: string | null
) {
  return handleResponse<{ success: boolean }>(
    fetch(`${API_BASE}/api/users/style-preference`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortId, stylePreference })
    })
  )
}

export async function fetchUserFlashState(userId: string) {
  return handleResponse<{ type: string; betsRemaining: number }>(
    fetch(`${API_BASE}/api/live/flash-state?userId=${userId}`)
  )
}

export async function fetchGlobalFlashState() {
  return handleResponse<{ type: string; betsRemaining: number }>(
    fetch(`${API_BASE}/api/live/flash-state`)
  )
}

export async function fetchOracleState(userId: string) {
  return handleResponse<{ side: 'left' | 'right'; used: boolean }>(
    fetch(`${API_BASE}/api/oracle?userId=${userId}`)
  )
}

export async function fetchIdleEligibility(userId: string) {
  return handleResponse<{ eligible: boolean }>(
    fetch(`${API_BASE}/api/users/idle-eligible/${userId}`)
  )
}

export async function postFestivalParticipated(userId: string) {
  return handleResponse<{ success: boolean }>(
    fetch(`${API_BASE}/api/festivals/participated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
  )
}

export async function fetchAchievementsBulkBadges(shortIds: string[]) {
  return handleResponse<Record<string, BadgeData[]>>(
    fetch(`${API_BASE}/api/achievements/badges-for-leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortIds })
    })
  )
}
export async function fetchUserAchievements(shortId: string) {
  return handleResponse<{
    achievements: AchievementEntry[]
    stats: AchievementStats
    displayedBadges: string[]
  }>(fetch(`${API_BASE}/api/achievements/${shortId}`))
}

export async function updateUserBadges(shortId: string, badges: string[]) {
  return handleResponse<{ displayedBadges: string[] }>(
    fetch(`${API_BASE}/api/achievements/${shortId}/badges`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badges })
    })
  )
}

export async function fetchEquippedRelic(userId: string) {
  return handleResponse<{ relic: import('@/lib/relics').RelicDef | null }>(
    fetch(`${API_BASE}/api/relics/equipped?userId=${userId}`)
  )
}

export async function fetchUserRelics(userId: string) {
  return handleResponse<import('@/lib/relics').RelicDef[]>(
    fetch(`${API_BASE}/api/relics?userId=${userId}`)
  )
}

export async function fetchRecoveryTutorialStatus(userId: string) {
  return handleResponse<{ recoveryTutorialCompleted: boolean }>(
    fetch(`${API_BASE}/api/users/${userId}/recovery-tutorial-status`)
  )
}

export async function completeRecoveryTutorial(userId: string) {
  return handleResponse<{ success: boolean }>(
    fetch(`${API_BASE}/api/users/recovery-tutorial-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
  )
}

export const fetchGlobalEventState =
  async (): Promise<GlobalEventStateResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/live/global-event-state`)
      if (!res.ok) return null
      return res.json() as Promise<GlobalEventStateResponse>
    } catch {
      return null
    }
  }

export const askOracle = async (
  query: string,
  nickname?: string
): Promise<OracleResponse> => {
  try {
    const res = await fetch(`${API_BASE}/api/oracle/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, nickname })
    })

    const data = await res.json()
    if (!res.ok) {
      return { error: data.error || 'SYSTEM_ERROR' }
    }
    return data as OracleResponse
  } catch {
    return { error: 'SYSTEM_ERROR' }
  }
}