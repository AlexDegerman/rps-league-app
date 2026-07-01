import { randomUUID } from 'crypto'
import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'

const SESSION_TIMEOUT_MS = 20 * 60 * 1000 // 20 min inactivity = end session
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // sweep every 5 min
const MAX_COMPLETED = 5000 // ring-buffer cap (prevent OOM)

export type InteractionType = 'prediction' | 'oracle'

interface PlayerSession {
  userId: string
  sessionId: string
  sessionStartedAt: number
  lastInteractionAt: number
  matchesPlayed: number
  oracleQueries: number
  country: string | null
  town: string | null
  utmSource: string | null
  isFirstSession: boolean
}

interface CompletedSession {
  userId: string
  sessionId: string
  startedAt: number
  endedAt: number
  durationMs: number
  matchesPlayed: number
  oracleQueries: number
  country: string | null
  town: string | null
  utmSource: string | null
  isFirstSession: boolean
}

const activeSessions = new Map<string, PlayerSession>()
const completedSessions: CompletedSession[] = []
// Tracks users who have had at least one session this uptime (first-session detection)
const usersSeenInUptime = new Set<string>()

// Private helpers
async function fetchUserMeta(userId: string): Promise<{
  country: string | null
  town: string | null
  utmSource: string | null
}> {
  try {
    const res = await pool.query(
      `SELECT signup_country, signup_town, utm_source
        FROM users WHERE user_id = $1`,
      [userId]
    )
    const r = res.rows[0]
    return {
      country: r?.signup_country ?? null,
      town: r?.signup_town ?? null,
      utmSource: r?.utm_source ?? null
    }
  } catch {
    return { country: null, town: null, utmSource: null }
  }
}

function finalizeSession(session: PlayerSession): void {
  const now = Date.now()
  const completed: CompletedSession = {
    userId: session.userId,
    sessionId: session.sessionId,
    startedAt: session.sessionStartedAt,
    endedAt: now,
    durationMs: Math.max(0, now - session.sessionStartedAt),
    matchesPlayed: session.matchesPlayed,
    oracleQueries: session.oracleQueries,
    country: session.country,
    town: session.town,
    utmSource: session.utmSource,
    isFirstSession: session.isFirstSession
  }
  completedSessions.push(completed)
  // Ring-buffer: trim oldest when over cap
  if (completedSessions.length > MAX_COMPLETED) {
    completedSessions.splice(0, completedSessions.length - MAX_COMPLETED)
  }
}

function createSession(
  userId: string,
  meta: {
    country: string | null
    town: string | null
    utmSource: string | null
  },
  firstAction: InteractionType
): PlayerSession {
  const isFirstSession = !usersSeenInUptime.has(userId)
  usersSeenInUptime.add(userId)
  const now = Date.now()
  return {
    userId,
    sessionId: randomUUID(),
    sessionStartedAt: now,
    lastInteractionAt: now,
    matchesPlayed: firstAction === 'prediction' ? 1 : 0,
    oracleQueries: firstAction === 'oracle' ? 1 : 0,
    country: meta.country,
    town: meta.town,
    utmSource: meta.utmSource,
    isFirstSession
  }
}

// Cleanup (runs every 5 min)
function cleanupStaleSessions(): void {
  const now = Date.now()
  for (const [userId, session] of activeSessions.entries()) {
    if (now - session.lastInteractionAt > SESSION_TIMEOUT_MS) {
      finalizeSession(session)
      activeSessions.delete(userId)
    }
  }
  logger.info('Session cleanup ran', {
    active: activeSessions.size,
    completed: completedSessions.length
  })
}
setInterval(cleanupStaleSessions, CLEANUP_INTERVAL_MS)

// Public: record interaction
/**
 * Call on every meaningful user action (prediction placed, oracle queried).
 * Creates a new session or refreshes an existing one.
 * DB lookup (fetchUserMeta) only happens once per new session, not per bet.
 */
export async function recordInteraction(
  userId: string,
  type: InteractionType
): Promise<void> {
  const now = Date.now()
  const existing = activeSessions.get(userId)

  if (existing) {
    const stale = now - existing.lastInteractionAt > SESSION_TIMEOUT_MS
    if (stale) {
      finalizeSession(existing)
      const meta = await fetchUserMeta(userId)
      activeSessions.set(userId, createSession(userId, meta, type))
    } else {
      existing.lastInteractionAt = now
      if (type === 'prediction') existing.matchesPlayed++
      if (type === 'oracle') existing.oracleQueries++
    }
  } else {
    const meta = await fetchUserMeta(userId)
    activeSessions.set(userId, createSession(userId, meta, type))
  }
}

// Public: stats report
interface BucketStats {
  sessions: number
  avgDurationMs: number
  avgDurationMin: number
  avgMatchesPerSession: number
}

interface TownStats extends BucketStats {}
interface UtmStats extends BucketStats {}
interface CountryStats extends BucketStats {
  byTown: Record<string, TownStats>
}

export interface SessionStatsReport {
  activeSessions: number
  completedSessions: number
  totalMatchesTracked: number
  avgDurationMs: number
  avgDurationMin: number
  avgMatchesPerSession: number
  firstSessionAvgDurationMin: number
  returningSessionAvgDurationMin: number
  byCountry: Record<string, CountryStats>
  byUtm: Record<string, UtmStats>
}

function calcAvg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length
}

function makeStats(durations: number[], matches: number[]): BucketStats {
  const avgDur = calcAvg(durations)
  return {
    sessions: durations.length,
    avgDurationMs: Math.round(avgDur),
    avgDurationMin: parseFloat((avgDur / 60000).toFixed(1)),
    avgMatchesPerSession: parseFloat(calcAvg(matches).toFixed(1))
  }
}

/**
 * Returns a snapshot of all session analytics.
 * Active sessions are included with their current duration.
 * O(N) over completedSessions + active sessions, fast for admin use.
 */
export function getSessionStats(): SessionStatsReport {
  const now = Date.now()

  // Snapshot active sessions as if they ended right now
  const allSessions: CompletedSession[] = [
    ...completedSessions,
    ...Array.from(activeSessions.values()).map(
      (s): CompletedSession => ({
        userId: s.userId,
        sessionId: s.sessionId,
        startedAt: s.sessionStartedAt,
        endedAt: now,
        durationMs: Math.max(0, now - s.sessionStartedAt),
        matchesPlayed: s.matchesPlayed,
        oracleQueries: s.oracleQueries,
        country: s.country,
        town: s.town,
        utmSource: s.utmSource,
        isFirstSession: s.isFirstSession
      })
    )
  ]

  // Accumulators, using Maps to avoid noUncheckedIndexedAccess issues
  const allDur: number[] = []
  const allMat: number[] = []
  const firstDur: number[] = []
  const retDur: number[] = []

  const cDur = new Map<string, number[]>()
  const cMat = new Map<string, number[]>()
  const tDur = new Map<string, Map<string, number[]>>()
  const tMat = new Map<string, Map<string, number[]>>()
  const uDur = new Map<string, number[]>()
  const uMat = new Map<string, number[]>()

  for (const s of allSessions) {
    const dur = s.durationMs
    const matches = s.matchesPlayed
    const country = s.country ?? 'Unknown'
    const town = s.town ?? 'Unknown'
    const utm = s.utmSource ?? 'direct'

    allDur.push(dur)
    allMat.push(matches)
    if (s.isFirstSession) firstDur.push(dur)
    else retDur.push(dur)

    // Country
    if (!cDur.has(country)) {
      cDur.set(country, [])
      cMat.set(country, [])
    }
    cDur.get(country)!.push(dur)
    cMat.get(country)!.push(matches)

    // Town (nested under country)
    if (!tDur.has(country)) tDur.set(country, new Map())
    if (!tMat.has(country)) tMat.set(country, new Map())
    const cTownDur = tDur.get(country)!
    const cTownMat = tMat.get(country)!
    if (!cTownDur.has(town)) {
      cTownDur.set(town, [])
      cTownMat.set(town, [])
    }
    cTownDur.get(town)!.push(dur)
    cTownMat.get(town)!.push(matches)

    // UTM
    if (!uDur.has(utm)) {
      uDur.set(utm, [])
      uMat.set(utm, [])
    }
    uDur.get(utm)!.push(dur)
    uMat.get(utm)!.push(matches)
  }

  // Assemble byCountry
  const byCountry: Record<string, CountryStats> = {}
  for (const [country, durations] of cDur.entries()) {
    const matches = cMat.get(country) ?? []
    const cTownDur = tDur.get(country)
    const cTownMat = tMat.get(country)
    const byTown: Record<string, TownStats> = {}
    if (cTownDur) {
      for (const [town, tDurations] of cTownDur.entries()) {
        const tMatches = cTownMat?.get(town) ?? []
        byTown[town] = makeStats(tDurations, tMatches)
      }
    }
    byCountry[country] = { ...makeStats(durations, matches), byTown }
  }

  // Assemble byUtm
  const byUtm: Record<string, UtmStats> = {}
  for (const [utm, durations] of uDur.entries()) {
    byUtm[utm] = makeStats(durations, uMat.get(utm) ?? [])
  }

  const overallAvgDur = calcAvg(allDur)
  return {
    activeSessions: activeSessions.size,
    completedSessions: completedSessions.length,
    totalMatchesTracked: allMat.reduce((a, b) => a + b, 0),
    avgDurationMs: Math.round(overallAvgDur),
    avgDurationMin: parseFloat((overallAvgDur / 60000).toFixed(1)),
    avgMatchesPerSession: parseFloat(calcAvg(allMat).toFixed(1)),
    firstSessionAvgDurationMin: parseFloat(
      (calcAvg(firstDur) / 60000).toFixed(1)
    ),
    returningSessionAvgDurationMin: parseFloat(
      (calcAvg(retDur) / 60000).toFixed(1)
    ),
    byCountry,
    byUtm
  }
}
