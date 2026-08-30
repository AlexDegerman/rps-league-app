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

export interface ParticipantRecord {
  damageDealt: number
  missCount: number
  firstHitAt: number
  lastHitAt: number
  nickname: string
}

export interface WorldBossState {
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
