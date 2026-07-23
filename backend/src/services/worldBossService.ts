import pool from '../utils/db.js'
import { logger } from '../utils/logger.js'
import { isGlobalEventBlocking } from './globalEventService.js'

// Feature flag
const WORLD_BOSS_ENABLED = true

// Types
export type WorldBossType = 'HEXURION' | 'ORPHION' | 'FRACTURON' | 'APEXION'
export type WorldBossPhase =
  | 'IDLE'
  | 'COOLDOWN'
  | 'WARNING'
  | 'ACTIVE'
  | 'QUIET'
export type ChestRarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHICAL'
  | 'RAINBOW'

export interface DamagerEntry {
  userId: string
  nickname: string
  damageDealt: number
  rank: number
}

interface ParticipantRecord {
  damageDealt: number
  missCount: number // Tracks misses for the Perfect Assault achievement.
  firstHitAt: number
  lastHitAt: number
  nickname: string
}

interface WorldBossState {
  phase: WorldBossPhase
  bossType: WorldBossType | null
  encounterId: number | null
  bossMaxHp: number
  bossCurrentHp: number
  participants: Map<string, ParticipantRecord>
  damageLeaderboard: Map<string, number>
  tieBreaker: Map<string, number>
  strikeCount: number
  encounterStartedAt: number | null
  encounterEndsAt: number | null
  warningStartedAt: number | null
  warningEndsAt: number | null
}

type Broadcast = (event: string, data: string) => void

// Timing constants
const COOLDOWN_MIN_MS = 10 * 60 * 1000
const COOLDOWN_MAX_MS = 12 * 60 * 1000
const WARNING_DURATION_MS = 30 * 1000
const QUIET_DURATION_MS = 60 * 1000
const ENCOUNTER_DURATION_MS = 60 * 1000

const BOSS_POOL: WorldBossType[] = [
  'HEXURION',
  'ORPHION',
  'FRACTURON',
  'APEXION'
]

// Boss relic definitions
// Boss-exclusive relics can only be obtained from world boss chests.
import { RELICS } from './relicService.js'

// Defeats always grant Mythical chests.
// Retreat rewards scale with the percentage of HP depleted.
const getBaseChestRarity = (
  hpDepletedPct: number,
  outcome: 'DEFEAT' | 'RETREAT'
): ChestRarity => {
  if (outcome === 'DEFEAT') return 'MYTHICAL'
  if (hpDepletedPct >= 75) return 'LEGENDARY'
  if (hpDepletedPct >= 50) return 'EPIC'
  if (hpDepletedPct >= 25) return 'RARE'
  return 'COMMON'
}

// Applies relic-based chest upgrades. Rainbow requires Prism Key.
const applyChestUpgrade = (
  base: ChestRarity,
  equippedRelics: string[]
): ChestRarity => {
  let upgradeChance = 0
  if (equippedRelics.includes('lucky_crest')) upgradeChance += 0.1
  if (equippedRelics.includes('fortune_seal')) upgradeChance += 0.2
  if (equippedRelics.includes('ascension_sigil')) upgradeChance += 0.35
  if (equippedRelics.includes('celestial_crown')) upgradeChance += 0.5

  if (upgradeChance <= 0 || Math.random() > Math.min(upgradeChance, 1.0))
    return base

  const ORDER: ChestRarity[] = [
    'COMMON',
    'RARE',
    'EPIC',
    'LEGENDARY',
    'MYTHICAL',
    'RAINBOW'
  ]
  const idx = ORDER.indexOf(base)
  const next = ORDER[idx + 1]
  if (!next) return base
  if (next === 'RAINBOW' && !equippedRelics.includes('prism_key')) return base
  return next
}

// Rewards are based on a percentage of the player's current points.
const getChestPointReward = (
  chestRarity: ChestRarity,
  currentPoints: bigint,
  equippedRelics: string[]
): bigint => {
  const BASE_PCT: Record<ChestRarity, number> = {
    COMMON: 0.5,
    RARE: 1.0,
    EPIC: 2.0,
    LEGENDARY: 3.5,
    MYTHICAL: 5.0,
    RAINBOW: 7.5
  }
  let pct = BASE_PCT[chestRarity]
  // Apply additive relic bonuses.
  if (equippedRelics.includes('fortune_satchel')) pct += 0.25
  if (equippedRelics.includes('kings_purse')) pct += 0.5
  if (equippedRelics.includes('royal_treasury')) pct += 1.0
  if (equippedRelics.includes('dragons_hoard')) pct += 1.5

  const pctScaled = BigInt(Math.round(pct * 10000))
  return (currentPoints * pctScaled) / 10000n
}

// Relic drop system with separate drop and rarity rolls.
const CHEST_RELIC_DROP_CHANCE: Record<ChestRarity, number> = {
  COMMON: 0.05,
  RARE: 0.1,
  EPIC: 0.2,
  LEGENDARY: 0.3,
  MYTHICAL: 0.5,
  RAINBOW: 1.0
}

const CHEST_RELIC_RARITY_WEIGHTS = [
  { rarity: 'COMMON' as const, weight: 50 },
  { rarity: 'RARE' as const, weight: 28 },
  { rarity: 'EPIC' as const, weight: 15 },
  { rarity: 'LEGENDARY' as const, weight: 6 },
  { rarity: 'MYTHICAL' as const, weight: 1 }
]

const rollChestRelicRarity = (): string => {
  const total = CHEST_RELIC_RARITY_WEIGHTS.reduce((s, e) => s + e.weight, 0)
  let roll = Math.random() * total
  for (const e of CHEST_RELIC_RARITY_WEIGHTS) {
    roll -= e.weight
    if (roll <= 0) return e.rarity
  }
  return 'COMMON'
}

const rollChestRelic = async (
  userId: string,
  chestRarity: ChestRarity,
  equippedRelics: string[],
  excludeKeys: Set<string> = new Set()
): Promise<{
  key: string
  name: string
  rarity: string
  icon: string
  effect: string
} | null> => {
  let dropChance = CHEST_RELIC_DROP_CHANCE[chestRarity]
  if (equippedRelics.includes('treasure_compass')) dropChance += 0.25
  if (equippedRelics.includes('relic_magnet')) dropChance += 0.5
  if (equippedRelics.includes('vault_key')) dropChance += 1.0
  if (equippedRelics.includes('collectors_vault')) dropChance += 1.5

  if (Math.random() > Math.min(dropChance, 1.0)) return null

  const targetRarity = rollChestRelicRarity()

  const owned = await pool.query(
    'SELECT relic_key FROM relics WHERE user_id = $1',
    [userId]
  )
  const ownedKeys = new Set([
    ...owned.rows.map((r: any) => r.relic_key),
    ...excludeKeys
  ])

  const bossRelics = RELICS.filter(
    (r: any) => r.bossExclusive && !ownedKeys.has(r.key)
  )
  if (bossRelics.length === 0) return null

  let candidates = bossRelics.filter((r: any) => r.rarity === targetRarity)
  if (candidates.length === 0) candidates = bossRelics

  const picked = candidates[Math.floor(Math.random() * candidates.length)]!
  await pool.query(
    'INSERT INTO relics (user_id, relic_key, rarity, found_at) VALUES ($1, $2, $3, $4)',
    [userId, picked.key, picked.rarity, Date.now()]
  )
  return {
    key: picked.key,
    name: picked.name,
    rarity: picked.rarity,
    icon: picked.icon,
    effect: picked.effect
  }
}

// Runtime state
const _state: WorldBossState = {
  phase: 'IDLE',
  bossType: null,
  encounterId: null,
  bossMaxHp: 0, // Starts at zero and increases as players join.
  bossCurrentHp: 0,
  participants: new Map(),
  damageLeaderboard: new Map(),
  tieBreaker: new Map(),
  strikeCount: 0,
  encounterStartedAt: null,
  encounterEndsAt: null,
  warningStartedAt: null,
  warningEndsAt: null
}

let _cooldownTimer: ReturnType<typeof setTimeout> | null = null
let _warningTimer: ReturnType<typeof setTimeout> | null = null
let _encounterTimer: ReturnType<typeof setTimeout> | null = null
let _burstInterval: ReturnType<typeof setInterval> | null = null
let _pendingDamage: { userId: string; nickname: string; damage: number }[] = []
let _resolving = false
let _rawContributionSum = 0

let _pauseFestival: (() => void) | null = null
let _resumeFestival: (() => void) | null = null
let _pauseGlobalEvent: (() => void) | null = null
let _resumeGlobalEvent: (() => void) | null = null

// Helper functions
const rand = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min))

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!

const clearTimers = () => {
  if (_cooldownTimer) {
    clearTimeout(_cooldownTimer)
    _cooldownTimer = null
  }
  if (_warningTimer) {
    clearTimeout(_warningTimer)
    _warningTimer = null
  }
  if (_encounterTimer) {
    clearTimeout(_encounterTimer)
    _encounterTimer = null
  }
  if (_burstInterval) {
    clearInterval(_burstInterval)
    _burstInterval = null
  }
}

const resetEncounterState = () => {
  _state.encounterId = null
  _state.bossType = null
  _state.bossMaxHp = 0
  _state.bossCurrentHp = 0
  _state.participants = new Map()
  _state.damageLeaderboard = new Map()
  _state.tieBreaker = new Map()
  _state.strikeCount = 0
  _state.encounterStartedAt = null
  _state.encounterEndsAt = null
  _state.warningStartedAt = null
  _state.warningEndsAt = null
  _pendingDamage = []
  _resolving = false
  _rawContributionSum = 0
}

// Public API
export const isWorldBossActive = (): boolean =>
  WORLD_BOSS_ENABLED && _state.phase === 'ACTIVE'

export const isWorldBossBlocking = (): boolean => {
  return (
    WORLD_BOSS_ENABLED &&
    (_state.phase === 'WARNING' ||
      _state.phase === 'ACTIVE' ||
      _state.phase === 'QUIET')
  )
}

export const getCurrentState = () => ({
  phase: _state.phase,
  bossType: _state.bossType,
  encounterId: _state.encounterId,
  bossMaxHp: _state.bossMaxHp,
  bossCurrentHp: _state.bossCurrentHp,
  hpPct:
    _state.bossMaxHp > 0
      ? Math.max(0, (_state.bossCurrentHp / _state.bossMaxHp) * 100)
      : 0,
  strikeCount: _state.strikeCount,
  encounterStartedAt: _state.encounterStartedAt,
  encounterEndsAt: _state.encounterEndsAt,
  warningStartedAt: _state.warningStartedAt,
  warningEndsAt: _state.warningEndsAt
})

export const getTopDamagers = (
  localUserId?: string
): {
  top: DamagerEntry[]
  myRank: number | null
  myDamagePct: number
} => {
  const sorted = Array.from(_state.damageLeaderboard.entries()).sort((a, b) => {
    const diff = b[1] - a[1]
    if (diff !== 0) return diff
    return (
      (_state.tieBreaker.get(a[0]) ?? Infinity) -
      (_state.tieBreaker.get(b[0]) ?? Infinity)
    )
  })

  const top = sorted.slice(0, 3).map((e, i) => ({
    userId: e[0],
    nickname: _state.participants.get(e[0])?.nickname ?? 'Player',
    damageDealt: e[1],
    rank: i + 1
  }))

  let myRank: number | null = null
  let myDamagePct = 0
  if (localUserId) {
    const idx = sorted.findIndex((e) => e[0] === localUserId)
    myRank = idx !== -1 ? idx + 1 : null
    myDamagePct =
      _state.bossMaxHp > 0
        ? ((_state.damageLeaderboard.get(localUserId) ?? 0) /
            _state.bossMaxHp) *
          100
        : 0
  }
  return { top, myRank, myDamagePct }
}

// Players increase boss health based on when they join.
export const registerParticipant = (
  userId: string,
  timeRemaining: number,
  nickname: string
): void => {
  if (_state.participants.has(userId)) return

  const totalSec = ENCOUNTER_DURATION_MS / 1000
  const ratio = totalSec > 0 ? timeRemaining / totalSec : 0

  let hpContribution = 1
  if (ratio >= 0.75) hpContribution = 4
  else if (ratio >= 0.5) hpContribution = 3
  else if (ratio >= 0.25) hpContribution = 2

  _state.participants.set(userId, {
    damageDealt: 0,
    missCount: 0,
    firstHitAt: Date.now(),
    lastHitAt: Date.now(),
    nickname
  })

  const oldTotalHp = Math.max(4, _rawContributionSum)
  _rawContributionSum += hpContribution
  const newTotalHp = Math.max(4, _rawContributionSum)
  const delta = newTotalHp - oldTotalHp

  // Increase both max and current HP when a new participant joins
  _state.bossMaxHp += delta
  _state.bossCurrentHp += delta
}
export const recordMiss = (userId: string): void => {
  const p = _state.participants.get(userId)
  if (p) p.missCount++
}

export const applyDamage = (
  userId: string,
  damage: number,
  broadcast: Broadcast
): void => {
  if (_state.phase !== 'ACTIVE') return
  if (_state.bossMaxHp === 0) return

  const now = Date.now()
  const participant = _state.participants.get(userId)
  if (participant) {
    participant.damageDealt += damage
    participant.lastHitAt = now
  }

  _state.damageLeaderboard.set(
    userId,
    (_state.damageLeaderboard.get(userId) ?? 0) + damage
  )
  _state.tieBreaker.set(userId, now)
  _pendingDamage.push({
    userId,
    nickname: _state.participants.get(userId)?.nickname ?? 'Player',
    damage
  })
  _state.bossCurrentHp = Math.max(0, _state.bossCurrentHp - damage)
  _state.strikeCount++

  if (_state.bossCurrentHp <= 0 && !_resolving) {
    resolveEncounter('DEFEAT', broadcast)
  }
}

export const registerExternalSystems = (
  pauseFest: () => void,
  resumeFest: () => void,
  pauseGlobal: () => void,
  resumeGlobal: () => void
): void => {
  _pauseFestival = pauseFest
  _resumeFestival = resumeFest
  _pauseGlobalEvent = pauseGlobal
  _resumeGlobalEvent = resumeGlobal
}

const pauseExternalSystems = () => {
  _pauseFestival?.()
  _pauseGlobalEvent?.()
}
const resumeExternalSystems = () => {
  _resumeFestival?.()
  _resumeGlobalEvent?.()
}

// Damage burst processing
// Include the boss's maximum HP so clients can calculate percentages.
const drainBurst = (broadcast: Broadcast): void => {
  if (_pendingDamage.length === 0) return
  const events = _pendingDamage.splice(0, _pendingDamage.length)
  const hpPct =
    _state.bossMaxHp > 0
      ? Math.max(0, (_state.bossCurrentHp / _state.bossMaxHp) * 100)
      : 0

  broadcast(
    'world_boss_damage_burst',
    JSON.stringify({ events, timestamp: Date.now() })
  )
  broadcast(
    'world_boss_hp_update',
    JSON.stringify({
      hpPct,
      bossMaxHp: _state.bossMaxHp,
      topDamagers: getTopDamagers().top,
      strikeCount: _state.strikeCount,
      participantCount: _state.participants.size
    })
  )
}

// Encounter resolution
const resolveEncounter = async (
  outcome: 'DEFEAT' | 'RETREAT',
  broadcast: Broadcast
): Promise<void> => {
  if (_state.phase !== 'ACTIVE' || _resolving) return
  _resolving = true
  clearTimers()
  _state.phase = 'QUIET'

  const hpDepleted =
    _state.bossMaxHp > 0
      ? Math.max(0, 100 - (_state.bossCurrentHp / _state.bossMaxHp) * 100)
      : 0
  const participantCount = _state.participants.size

  // Save encounter results.
  if (_state.encounterId) {
    try {
      await pool.query(
        `UPDATE world_boss_encounters
          SET ended_at = $1, outcome = $2, hp_depleted_pct = $3, participant_count = $4
          WHERE id = $5`,
        [Date.now(), outcome, hpDepleted, participantCount, _state.encounterId]
      )
      for (const [userId, damage] of _state.damageLeaderboard.entries()) {
        const p = _state.participants.get(userId)
        await pool.query(
          `INSERT INTO world_boss_damage (encounter_id, user_id, damage_dealt, first_hit_at, last_hit_at)
            VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [
            _state.encounterId,
            userId,
            damage,
            p?.firstHitAt ?? Date.now(),
            p?.lastHitAt ?? Date.now()
          ]
        )
      }
    } catch (err) {
      logger.error('worldBossService: failed to write encounter results', err)
    }
  }

  // Evaluate achievement unlocks.
  const sorted = Array.from(_state.damageLeaderboard.entries()).sort(
    (a, b) => b[1] - a[1]
  )
  const finalDamagerUserId = sorted[0]?.[0] ?? null
  const totalDamage = Array.from(_state.damageLeaderboard.values()).reduce(
    (s, d) => s + d,
    0
  )
  const timeLeft = _state.encounterEndsAt
    ? Math.max(0, _state.encounterEndsAt - Date.now())
    : 9999

  for (const [userId, record] of _state.participants.entries()) {
    const userDamage = _state.damageLeaderboard.get(userId) ?? 0
    const isKillingBlow = finalDamagerUserId === userId && outcome === 'DEFEAT'
    const userDamagePct = totalDamage > 0 ? userDamage / totalDamage : 0
    const joinedLateFinal10s =
      record.firstHitAt > (_state.encounterStartedAt ?? 0) + 50_000

    const hadFinalStrike = isKillingBlow
    const hadPerfectAssault =
      outcome === 'DEFEAT' && record.missCount === 0 && userDamage > 0
    const hadLuckyShot = isKillingBlow && userDamagePct <= 0.1
    const hadClutchVictory = isKillingBlow && timeLeft < 5_000
    const hadDivineIntervention = isKillingBlow && joinedLateFinal10s

    if (
      hadFinalStrike ||
      hadPerfectAssault ||
      hadLuckyShot ||
      hadClutchVictory ||
      hadDivineIntervention
    ) {
      await pool
        .query(
          `UPDATE users
          SET had_final_strike        = had_final_strike        OR $1,
              had_perfect_assault     = had_perfect_assault     OR $2,
              had_lucky_shot          = had_lucky_shot          OR $3,
              had_clutch_victory      = had_clutch_victory      OR $4,
              had_divine_intervention = had_divine_intervention OR $5
          WHERE user_id = $6`,
          [
            hadFinalStrike,
            hadPerfectAssault,
            hadLuckyShot,
            hadClutchVictory,
            hadDivineIntervention,
            userId
          ]
        )
        .catch(() => {})
    }
  }

  broadcast(
    'world_boss_end',
    JSON.stringify({
      outcome,
      hpDepleted,
      bossType: _state.bossType
    })
  )

  const baseChestRarity = getBaseChestRarity(hpDepleted, outcome)

  // Preserve encounter data before resetting state.
  const rewardSnapshot = {
    participants: new Map(_state.participants),
    damageLeaderboard: new Map(_state.damageLeaderboard),
    bossType: _state.bossType,
    bossMaxHp: _state.bossMaxHp,
    encounterId: _state.encounterId
  }

  resetEncounterState()
  resumeExternalSystems()

  distributeRewards(rewardSnapshot, baseChestRarity, broadcast).catch((err) =>
    logger.error('worldBossService: distributeRewards failed', err)
  )

  setTimeout(() => {
    _state.phase = 'COOLDOWN'
    scheduleCooldown(broadcast)
  }, QUIET_DURATION_MS)
}

// Reward distribution
const distributeRewards = async (
  snapshot: {
    participants: Map<string, ParticipantRecord>
    damageLeaderboard: Map<string, number>
    bossType: WorldBossType | null
    bossMaxHp: number
    encounterId: number | null
  },
  baseChestRarity: ChestRarity,
  broadcast: Broadcast
): Promise<void> => {
  const isDefeat = baseChestRarity === 'MYTHICAL'

  for (const [userId] of snapshot.participants.entries()) {
    try {
      const pointsRes = await pool.query(
        'SELECT points FROM users WHERE user_id = $1',
        [userId]
      )
      const currentPoints = BigInt(pointsRes.rows[0]?.points ?? '0')

      const userRes = await pool.query(
        'SELECT equipped_relics, nickname FROM users WHERE user_id = $1',
        [userId]
      )
      if (!userRes.rows.length) continue
      const relics: string[] =
        userRes.rows[0].equipped_relics?.filter(Boolean) ?? []

      const finalRarity = applyChestUpgrade(baseChestRarity, relics)
      const pointReward = getChestPointReward(
        finalRarity,
        currentPoints,
        relics
      )

      const relicDrop = await rollChestRelic(userId, finalRarity, relics)

      const twinFortune =
        relics.includes('twin_fortune') && Math.random() < 0.25
      let twinRelicDrop: typeof relicDrop = null
      let twinPointReward = 0n

      if (twinFortune) {
        twinPointReward = getChestPointReward(
          finalRarity,
          currentPoints,
          relics
        )
        // Prevent Twin Fortune from awarding the same relic twice.
        const excludeFirst = relicDrop
          ? new Set([relicDrop.key])
          : new Set<string>()
        twinRelicDrop = await rollChestRelic(
          userId,
          finalRarity,
          relics,
          excludeFirst
        )
      }

      const totalPoints = pointReward + twinPointReward
      const chestsGained = twinFortune ? 2 : 1

      await pool.query(
        `UPDATE users
          SET points = points + $1,
              world_boss_chests_opened = world_boss_chests_opened + $2,
              boss_encounters_total = boss_encounters_total + 1,
              boss_kills_total = boss_kills_total + $3
          WHERE user_id = $4`,
        [totalPoints.toString(), chestsGained, isDefeat ? 1 : 0, userId]
      )

      // Track kills for each boss type.
      if (isDefeat && snapshot.bossType) {
        const colMap: Record<WorldBossType, string> = {
          HEXURION: 'hexurion_kills',
          ORPHION: 'orphion_kills',
          FRACTURON: 'fracturon_kills',
          APEXION: 'apexion_kills'
        }
        const col = colMap[snapshot.bossType]
        if (col) {
          await pool.query(
            `UPDATE users SET ${col} = ${col} + 1 WHERE user_id = $1`,
            [userId]
          )
        }
      }

      broadcast(
        'world_boss_reward',
        JSON.stringify({
          userId,
          chestRarity: finalRarity,
          pointReward: pointReward.toString(),
          relicDrop: relicDrop ?? null,
          twinFortune,
          twinFortuneReward: twinFortune ? twinPointReward.toString() : null,
          twinRelicDrop: twinRelicDrop ?? null
        })
      )
    } catch (err) {
      logger.error('distributeRewards: per-user failed', err, { userId })
    }
  }
}

// Encounter lifecycle
const startActive = async (broadcast: Broadcast): Promise<void> => {
  if (!WORLD_BOSS_ENABLED) return

  // Wait for active predictions to finish before starting the encounter.
  try {
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
    let checks = 0
    const threshold = Date.now() - 60000
    while (checks < 50) {
      // Wait up to 25 seconds.
      const pending = await pool.query(
        'SELECT 1 FROM predictions WHERE result IS NULL AND CAST(created_at AS BIGINT) > $1 LIMIT 1',
        [threshold]
      )
      if (pending.rows.length === 0) break
      await wait(500)
      checks++
    }
  } catch {
  }

  _state.phase = 'ACTIVE'
  const now = Date.now()
  _state.encounterStartedAt = now
  _state.encounterEndsAt = now + ENCOUNTER_DURATION_MS
  _state.bossMaxHp = 4
  _state.bossCurrentHp = 4

  try {
    const res = await pool.query(
      'INSERT INTO world_boss_encounters (boss_type, started_at) VALUES ($1, $2) RETURNING id',
      [_state.bossType, now]
    )
    _state.encounterId = res.rows[0].id
  } catch (err) {
    logger.error('worldBossService: failed to insert encounter', err)
  }

  pauseExternalSystems()

  broadcast(
    'world_boss_start',
    JSON.stringify({
      bossType: _state.bossType,
      endsAt: _state.encounterEndsAt,
      encounterId: _state.encounterId
    })
  )

  _burstInterval = setInterval(() => drainBurst(broadcast), 100)
  _encounterTimer = setTimeout(
    () => resolveEncounter('RETREAT', broadcast),
    ENCOUNTER_DURATION_MS
  )
}

const BOSS_WARNING_MESSAGES: Record<WorldBossType, string[]> = {
  HEXURION: [
    'Structural... lattice... awakening. Hexurion... assembling.',
    'Hard-light... geometry... stabilizing. Hexurion... emergence... imminent.',
    'Sentinel... protocol... activated. Hexurion... approaches.'
  ],
  ORPHION: [
    'Gravitational... anomaly... detected. Orphion... descending.',
    'Orbital... convergence... accelerating. Orphion... approaches.',
    'Singularity... forming. Orphion... emergence... imminent.'
  ],
  FRACTURON: [
    'Data... lattice... corruption... detected. Fracturon... materializing.',
    'Fractal... instability... rising. Fracturon... boot... sequence... initiated.',
    'Dimensional... refraction... increasing. Fracturon... approaches.'
  ],
  APEXION: [
    'Monolith... energy... signature... detected. Apexion... awakening.',
    'Kinetic... compression... exceeding... limits. Apexion... emergence... imminent.',
    'Zenith... core... destabilizing. Apexion... approaches.'
  ]
}

const tryStartWarning = (broadcast: Broadcast): void => {
  if (!WORLD_BOSS_ENABLED) return
  if (isGlobalEventBlocking()) {
    setTimeout(() => tryStartWarning(broadcast), 5000)
    return
  }
  startWarning(broadcast)
}

const startWarning = (broadcast: Broadcast): void => {
  if (!WORLD_BOSS_ENABLED) return
  const bossType = randomItem(BOSS_POOL)
  const warningDuration = WARNING_DURATION_MS
  const now = Date.now()

  _state.phase = 'WARNING'
  _state.bossType = bossType
  _state.warningStartedAt = now
  _state.warningEndsAt = now + warningDuration

  broadcast(
    'world_boss_warning',
    JSON.stringify({
      bossType,
      activeAt: _state.warningEndsAt,
      endsAt: _state.warningEndsAt,
      message: randomItem(BOSS_WARNING_MESSAGES[bossType]),
      speech: randomItem(BOSS_WARNING_MESSAGES[bossType])
    })
  )

  _warningTimer = setTimeout(() => startActive(broadcast), warningDuration)
}

const scheduleCooldown = (broadcast: Broadcast): void => {
  if (!WORLD_BOSS_ENABLED) return
  _state.phase = 'COOLDOWN'
  _cooldownTimer = setTimeout(
    () => tryStartWarning(broadcast),
    rand(COOLDOWN_MIN_MS, COOLDOWN_MAX_MS)
  )
}

export const handleRestart = async (broadcast: Broadcast): Promise<void> => {
  if (!WORLD_BOSS_ENABLED) return
  try {
    const res = await pool.query(
      'SELECT id FROM world_boss_encounters WHERE ended_at IS NULL'
    )
    if (res.rows.length > 0) {
      await pool.query(
        `UPDATE world_boss_encounters SET ended_at=$1, outcome='RETREAT', interrupted=true WHERE id=$2`,
        [Date.now(), res.rows[0].id]
      )
    }
  } catch (err) {
    logger.error('worldBossService: handleRestart query failed', err)
  }
  resetEncounterState()
  scheduleCooldown(broadcast)
}

export const startScheduler = (broadcast: Broadcast): void => {
  if (!WORLD_BOSS_ENABLED) return
  handleRestart(broadcast)
}
