export type Move = 'ROCK' | 'PAPER' | 'SCISSORS'

export interface Player {
  name: string
  played: Move
}

export interface Match {
  type: string
  gameId: string
  time: number
  playerA: Player
  playerB: Player
}

export interface PlayerStats {
  name: string
  wins: number
  losses: number
  winRate: number
}

export interface SinglePlayerStats {
  total: number
  wins: number
  losses: number
  winRate: number
}

export interface PendingMatch {
  gameId: string
  time: number
  expiresAt: number
  playerA: string
  playerB: string
}

export interface PredictionRecord {
  gameId: string
  pick: string
  result?: 'WIN' | 'LOSE'
  confirmed: boolean
  id?: number
  betAmount?: string
  gainLoss?: string
  bonusTier?: string | null
  bonusMultiplier?: number
  createdAt?: number
  flashEventType?: string | null
  flashMult?: number
  streakMultiplier?: number
  relicMultiplier?: number
  totalMultiplier: number
  festivalMultiplier?: number
  festivalType?: string | null
  globalEventType?: string | null
  globalEchoAmount?: string | null
}

export interface UserStats {
  joinedDate: string
  total: number
  wins: number
  losses: number
  winRate: number
  points: string
  totalGain: string
  totalVolume: string
  biggestWin: string
  avgReturn: string
  peakPoints: string
  dailyPeak: string
  weeklyPeak: string
  currentWinStreak: number
  maxWinStreak: number
  totalPitiesEarned: number
}

export interface UserPointsData {
  nickname: string
  userId: string
  shortId: string
  points: string
  peakPoints: string
  dailyPeak: string
  weeklyPeak: string
  currentWinStreak: number
  allTimePeak: string
  pointStylePreference: string | null
  laps: number
  fastestLapBets: number
  linkedinUrl: string | null
  showLinkedinBadge: boolean
}

export interface LeaderboardEntry {
  userId: string
  shortId: string
  nickname: string
  points: string
  peakPoints: string
  gained: string
  wins: number
  losses: number
  winRate: number
  linkedinUrl: string | null
  pointStylePreference: string | null
  laps?: number
  fastestLapBets?: number | null
  achievementCount?: number
  showLinkedinBadge: boolean
}

export interface ProfileData {
  userId: string
  shortId: string
  nickname: string
  points: string
  biggestWin: string
  maxWinStreak: number
  joinedDate: number
  linkedinUrl: string | null
  showLinkedinBadge: boolean
  pointStylePreference: string | null
  allTimePeak: string
}

export interface RecoverResponse {
  userId: string
  shortId: string
  nickname?: string
}

export interface PredictionResponse {
  success: boolean
  gameId: string
  userId: string
  pointsAfter: string
  error?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PublicProfile {
  nickname: string
  shortId: string
  stats: UserStats
  recentHistory: {
    gameId: string
    pick: string
    result: 'WIN' | 'LOSE'
    betAmount: string
    gain: string
  }[]
}

export interface BonusStyle {
  label: string
  color: string
  bg: string
  cardClass: string
  auraClass?: string
  amountColor?: string
}

export interface BetHistoryEntry {
  id: number
  gameId: string
  pick: string
  result: 'WIN' | 'LOSE' | null
  createdAt: number
  betAmount: string
  gainLoss: string
  bonusTier: string | null
  bonusMultiplier: number
  playerAName: string
  playerBName: string
  playerAPlayed: 'ROCK' | 'PAPER' | 'SCISSORS'
  playerBPlayed: 'ROCK' | 'PAPER' | 'SCISSORS'
  flashMult: number
  flashEventType: string | null
  streakMult: number
  relicMultiplier: number
  totalMultiplier: number
  festivalMultiplier: number
  festivalType: string | null
  globalEventType: string | null
  globalEchoAmount: string | null
}

export type BonusTier = 'MYTHICAL' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON'

export interface MatchRowProps {
  match: Match
  highlightPlayer?: string
  prediction?: PredictionRecord
  alwaysLeft?: boolean
  winStreak?: number
  visualMode?: string | null
  totalMultiplier?: number
  festivalMultiplier?: number
  festivalType?: string | null
}

export type LeaderboardTab = 'daily' | 'weekly' | 'alltime'
export type SortKey =
  | 'points'
  | 'gained'
  | 'peak'
  | 'wins'
  | 'losses'
  | 'winrate'
export type SortDir = 'asc' | 'desc'

export type ConfettiType =
  | 'normal'
  | 'hellfire'
  | 'lunar'
  | 'electric'
  | 'cards'
  | 'fever'
  | 'inferno'
  | 'tidal_surge'
  | 'solar_flare'
  | 'cyclone_blitz'
  | 'mirage_cataclysm'


export interface BonusData {
  tier: BonusTier
  amount: bigint
  multiplier?: number
  visualMultiplier?: number
}

export interface ResultAnim {
  win: boolean
  amount: bigint
  bonus?: BonusData | null
  confetti?: { vx: number; vy: number; leftOffset: number; delay: number }[]
  streakAfter?: number
  confettiType?: ConfettiType
  flashMult?: number
  flashEventType?: string | null
  ghostEchoAmount?: bigint | null
  soulProc?: boolean
  kineticFired?: boolean
  preSoulAmount?: bigint
  globalEventType?: GlobalEventType | null
  globalEchoAmount?: bigint | null
}

export type EventTheme = 'LUNAR' | 'ELECTRIC' | 'CARDS' | 'HELLFIRE' | null

export type FlashModeKey =
  | 'flash_lunar'
  | 'flash_electric'
  | 'flash_cards'
  | 'flash_hellfire'

export type FestivalType =
  | 'SPARK'
  | 'GHOST'
  | 'SAFEGUARD'
  | 'RESONANCE'
  | 'SURGE'
  | 'VAULT'
  | 'FEVER'
  | 'SANGUINE'

export type FestivalModeKey =
  | 'festival_spark'
  | 'festival_ghost'
  | 'festival_safeguard'
  | 'festival_resonance'
  | 'festival_surge'
  | 'festival_vault'
  | 'festival_fever'
  | 'festival_sanguine'

export type WinStreakModeKey = 'winstreak_inferno' | 'winstreak_fever'

export type VisualMode =
  | FlashModeKey
  | GlobalEventModeKey
  | FestivalModeKey
  | WinStreakModeKey
  | null

export interface FestivalSSEData {
  type: string
  startedAt: number
  endsAt: number | null
  durationMs: number
  message: string
  flashType?: string
  isDemo: boolean
  triggerUserId?: string
  speech?: string
}

export interface PredictionResultSSEData {
  userId: string
  gameId: string
  result: 'WIN' | 'LOSE'
  amount: string
  nickname?: string
  streakAfter?: number
  streakMult?: number
  bonus?: { tier: BonusTier; amount: string; multiplier?: number } | null
  flashMult?: number
  flashEventType?: string | null
  relicDrop?: unknown
  relicCounter?: number
  soulProc?: boolean
  kineticFired?: boolean
  preSoulAmount?: string
  ghostEchoAmount?: string
  globalEventType?: GlobalEventType | null
  globalEchoAmount?: string | null
}

export interface AchievementNotif {
  code: string
  name: string
  icon: string
  rarity: AchievementRarity
  requirement: string
}

export type AchievementRarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHICAL'
  | 'RAINBOW'

export interface BadgeData {
  code: string
  name: string
  icon: string
  rarity: AchievementRarity
}

export interface AchievementEntry extends BadgeData {
  requirement: string
  category: string
  earned: boolean
  earnedAt: number | null
}

export interface AchievementStats {
  wins: number
  maxWinStreak: number
  laps: number
  points: string
  biggestMatchMult: number
  totalPitiesEarned: number
  lunarCaught: number
  electricCaught: number
  hellfireCaught: number
  cardsCaught: number
  betAgainstOracleCount: number
  festivalsTriggered: number
  festivalsParticipated: number
  oracleMaxStreak: number
  totalAchievementsEarned: number
  hadMythicRelicSlam: boolean
  uniqueRelicsOwned: number
  allRelicsOwned: boolean
  allCommonRareEpicRelics: boolean
  allMythicalRelics: boolean
  biggestMultiplierTier: string | null
  maxConsecutiveFlashEvents: number
  hasSeenAllFlashTypes: boolean
  hasUsedAutoBet: boolean
}

export type GlobalEventType =
  | 'TIDAL_SURGE'
  | 'SOLAR_FLARE'
  | 'CYCLONE_BLITZ'
  | 'MIRAGE_CATACLYSM'

export type GlobalEventPhase = 'warning' | 'active'

export type GlobalEventModeKey =
  | 'global_tidal_surge'
  | 'global_solar_flare'
  | 'global_cyclone_blitz'
  | 'global_mirage_cataclysm'

export interface GlobalEventWarningSSEData {
  type: GlobalEventType
  phase: 'warning'
  startedAt: number
  activeAt: number
  endsAt: number
  message: string
  speech?: string
}

export interface GlobalEventStartSSEData {
  type: GlobalEventType
  phase: 'active'
  startedAt: number
  activeAt: number
  endsAt: number
}

export interface GlobalEventStateResponse {
  event: {
    type: GlobalEventType
    phase: GlobalEventPhase
    activeAt: number
    endsAt: number
    startedAt: number
  } | null
}
