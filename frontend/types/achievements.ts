export type AchievementRarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHICAL'
  | 'RAINBOW'

export interface AchievementStats {
  wins: number
  maxWinStreak: number
  laps: number
  points: bigint
  biggestMatchMult: number
  totalPitiesEarned: number
  lunarCaught: number
  electricCaught: number
  hellfireCaught: number
  cardsCaught: number
  betAgainstOracleCount: number
  oracleMaxStreak: number
  totalAchievementsEarned: number
  festivalsTriggered: number
  festivalsParticipated: number
  hadMythicRelicSlam: boolean
  uniqueRelicsOwned: number
  allRelicsOwned: boolean
  allCommonRareEpicRelics: boolean
  allMythicalRelics: boolean
  biggestMultiplierTier: string | null
  maxConsecutiveFlashEvents: number
  hasSeenAllFlashTypes: boolean
  hasUsedAutoBet: boolean
  globalEventParticipations: number
  tidalSurgeParticipations: number
  solarFlareParticipations: number
  cycloneBlitzParticipations: number
  mirageCataclysmParticipations: number
  maxStreakDuringTidalSurge: number
  maxStreakDuringCycloneBlitz: number
  hadFlareInfernoCombo: boolean
  hadMirageHighEcho: boolean
  hadFlashPlusGlobalWin: boolean
  hadDryMirage: boolean
  hadEyeOfStorm: boolean
  hadPrismaticWave: boolean
  hadThermalFusion: boolean
  worldBossKills: number
  hexurionKills: number
  orphionKills: number
  fracturonKills: number
  apexionKills: number
  worldBossChestsOpened: number
  hadFinalStrike: boolean
  hadPerfectAssault: boolean
  hadLuckyShot: boolean
  hadClutchVictory: boolean
  hadDivineIntervention: boolean
  bonusStagesPlayed: number
  crystalMineClears: number
  oracleVisionPerfectClears: number
  doubleDownmaxClears: number
  wildPredictionMaxCombos: number
  royalTreasureChestsOpened: number
  royalKingsChestsFound: number
  hadPerfectSnipe: boolean
  rainbowTierRolls: number
  surgeFrenzyMaxComboFinishes: number
  neonParadiseMinigamesPlayed: Record<string, number>
  neonFullCircuitToday: boolean
}

export interface AchievementDef {
  code: string
  name: string
  requirement: string
  icon: string
  rarity: AchievementRarity
  category: string
  check: (stats: AchievementStats) => boolean
}

export interface AchievementNotif {
  code: string
  name: string
  icon: string
  rarity: AchievementRarity
  requirement: string
}