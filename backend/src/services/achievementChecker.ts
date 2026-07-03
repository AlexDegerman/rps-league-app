export type AchievementRarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHICAL'
  | 'RAINBOW'

export interface AchievementDef {
  code: string
  name: string
  requirement: string
  icon: string
  rarity: AchievementRarity
  category: string
  check: (stats: AchievementStats) => boolean
}

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
  // Global event participations
  globalEventParticipations: number
  tidalSurgeParticipations: number
  solarFlareParticipations: number
  cycloneBlitzParticipations: number
  mirageCataclysmParticipations: number
  // Streak-during-event peaks
  maxStreakDuringTidalSurge: number
  maxStreakDuringCycloneBlitz: number
  // Special combo booleans
  hadFlareInfernoCombo: boolean
  hadMirageHighEcho: boolean
  hadFlashPlusGlobalWin: boolean
  // Hidden per-bet triggers
  hadDryMirage: boolean
  hadEyeOfStorm: boolean
  hadPrismaticWave: boolean
  hadThermalFusion: boolean
}

// Category 1: Combatants
const COMBATANTS: AchievementDef[] = [
  {
    code: '50W',
    name: 'Skirmisher',
    requirement: '50 Total Wins',
    icon: '🛡️',
    rarity: 'COMMON',
    category: 'Combatants',
    check: (s) => s.wins >= 50
  },
  {
    code: '100W',
    name: 'Centurion',
    requirement: '100 Total Wins',
    icon: '🎖️',
    rarity: 'RARE',
    category: 'Combatants',
    check: (s) => s.wins >= 100
  },
  {
    code: '250W',
    name: 'Veteran',
    requirement: '250 Total Wins',
    icon: '⚔️',
    rarity: 'EPIC',
    category: 'Combatants',
    check: (s) => s.wins >= 250
  },
  {
    code: '500W',
    name: 'Commander',
    requirement: '500 Total Wins',
    icon: '🏛️',
    rarity: 'LEGENDARY',
    category: 'Combatants',
    check: (s) => s.wins >= 500
  },
  {
    code: 'GLAD',
    name: 'Gladiator',
    requirement: '1,000 Total Wins',
    icon: '👑',
    rarity: 'MYTHICAL',
    category: 'Combatants',
    check: (s) => s.wins >= 1000
  }
]

// Category 2: Momentum
const MOMENTUM: AchievementDef[] = [
  {
    code: 'STK3',
    name: 'Steady Hand',
    requirement: '3-Win Streak',
    icon: '📈',
    rarity: 'COMMON',
    category: 'Momentum',
    check: (s) => s.maxWinStreak >= 3
  },
  {
    code: 'HOT',
    name: 'On Fire',
    requirement: '5-Win Streak',
    icon: '🔥',
    rarity: 'RARE',
    category: 'Momentum',
    check: (s) => s.maxWinStreak >= 5
  },
  {
    code: 'FIRE',
    name: 'Inferno',
    requirement: '10-Win Streak',
    icon: '🌋',
    rarity: 'EPIC',
    category: 'Momentum',
    check: (s) => s.maxWinStreak >= 10
  },
  {
    code: 'BST',
    name: 'Beast Mode',
    requirement: '15-Win Streak',
    icon: '💠',
    rarity: 'LEGENDARY',
    category: 'Momentum',
    check: (s) => s.maxWinStreak >= 15
  },
  {
    code: 'ZEN',
    name: 'Ascended',
    requirement: '20-Win Streak',
    icon: '🧘',
    rarity: 'MYTHICAL',
    category: 'Momentum',
    check: (s) => s.maxWinStreak >= 20
  }
]

// Category 3: Prestige
const PRESTIGE: AchievementDef[] = [
  {
    code: 'LAP1',
    name: 'Rebirth',
    requirement: '1 Full Lap',
    icon: '♻️',
    rarity: 'COMMON',
    category: 'Prestige',
    check: (s) => s.laps >= 1
  },
  {
    code: 'LAP5',
    name: 'Cycler',
    requirement: '5 Full Laps',
    icon: '🌀',
    rarity: 'RARE',
    category: 'Prestige',
    check: (s) => s.laps >= 5
  },
  {
    code: '10LP',
    name: 'Lapse King',
    requirement: '10 Full Laps',
    icon: '🔄',
    rarity: 'EPIC',
    category: 'Prestige',
    check: (s) => s.laps >= 10
  },
  {
    code: '25LP',
    name: 'Eternal',
    requirement: '25 Full Laps',
    icon: '⏳',
    rarity: 'LEGENDARY',
    category: 'Prestige',
    check: (s) => s.laps >= 25
  },
  {
    code: 'LORD',
    name: 'Time Lord',
    requirement: '50 Full Laps',
    icon: '⌛',
    rarity: 'MYTHICAL',
    category: 'Prestige',
    check: (s) => s.laps >= 50
  }
]

// Category 4: Dimensional Scale (Updated with new tiers)
const DIMENSIONAL: AchievementDef[] = [
  {
    code: '1TRL',
    name: 'Trillionaire',
    requirement: 'Reach 1 Trillion',
    icon: '💰',
    rarity: 'COMMON',
    category: 'Dimensional',
    check: (s) => s.points >= 1_000_000_000_000n
  },
  {
    code: '1QAD',
    name: 'Quadrillionaire',
    requirement: 'Reach 1 Quadrillion',
    icon: '💎',
    rarity: 'RARE',
    category: 'Dimensional',
    check: (s) => s.points >= 1_000_000_000_000_000n
  },
  {
    code: '1VIG',
    name: 'Vigintillionaire',
    requirement: 'Reach 1 Vigintillion',
    icon: '🌌',
    rarity: 'EPIC',
    category: 'Dimensional',
    check: (s) => s.points >= BigInt('1' + '0'.repeat(63))
  },
  {
    code: '1OVG',
    name: 'Infinity Bound',
    requirement: 'Reach 1 Octovigintillion',
    icon: '♾️',
    rarity: 'LEGENDARY',
    category: 'Dimensional',
    check: (s) => s.points >= BigInt('1' + '0'.repeat(87))
  },
  {
    code: '1TRG',
    name: 'Trigintillion Sovereign',
    requirement: 'Reach 1 Trigintillion',
    icon: '🌀',
    rarity: 'LEGENDARY',
    category: 'Dimensional',
    check: (s) => s.points >= BigInt('1' + '0'.repeat(93))
  },
  {
    code: '1TTR',
    name: 'Cosmic Transcendence',
    requirement: 'Reach 1 Trestrigintillion',
    icon: '☄️',
    rarity: 'MYTHICAL',
    category: 'Dimensional',
    check: (s) => s.points >= BigInt('1' + '0'.repeat(102))
  },
  {
    code: '1STR',
    name: 'Absolute Zenith',
    requirement: 'Reach 1 Sextrigintillion',
    icon: '🌟',
    rarity: 'MYTHICAL',
    category: 'Dimensional',
    check: (s) => s.points >= BigInt('1' + '0'.repeat(111))
  },
  {
    code: '999X',
    name: 'The Singularity',
    requirement: 'Reach 999 Sextrigintillion',
    icon: '🧿',
    rarity: 'MYTHICAL',
    category: 'Dimensional',
    check: (s) => s.points >= BigInt('999' + '0'.repeat(111))
  }
]

// Category 5: Multiplier Madness
const MULTIPLIER: AchievementDef[] = [
  {
    code: '10X',
    name: 'Amplified',
    requirement: 'Reach x10 Match Multiplier',
    icon: '⚡',
    rarity: 'COMMON',
    category: 'Multiplier',
    check: (s) => s.biggestMatchMult >= 10
  },
  {
    code: '50X',
    name: 'Surge',
    requirement: 'Reach x30 Match Multiplier',
    icon: '🌪️',
    rarity: 'RARE',
    category: 'Multiplier',
    check: (s) => s.biggestMatchMult >= 30
  },
  {
    code: 'NUKE',
    name: 'Nuclear',
    requirement: 'Reach x60 Match Multiplier',
    icon: '☢️',
    rarity: 'EPIC',
    category: 'Multiplier',
    check: (s) => s.biggestMatchMult >= 60
  },
  {
    code: 'NOVA',
    name: 'Supernova',
    requirement: 'Reach x100 Match Multiplier',
    icon: '🌟',
    rarity: 'LEGENDARY',
    category: 'Multiplier',
    check: (s) => s.biggestMatchMult >= 100
  },
  {
    code: 'BOOM',
    name: 'The Big One',
    requirement: 'Trigger a x3 Mythic Relic Slam',
    icon: '🧨',
    rarity: 'MYTHICAL',
    category: 'Multiplier',
    check: (s) => s.hadMythicRelicSlam
  }
]

// Category 6: Reliquary
const RELIQUARY: AchievementDef[] = [
  {
    code: '5RL',
    name: 'Scavenger',
    requirement: 'Own 5 Unique Relics',
    icon: '📁',
    rarity: 'COMMON',
    category: 'Reliquary',
    check: (s) => s.uniqueRelicsOwned >= 5
  },
  {
    code: '10RL',
    name: 'Collector',
    requirement: 'Own 10 Unique Relics',
    icon: '🎒',
    rarity: 'RARE',
    category: 'Reliquary',
    check: (s) => s.uniqueRelicsOwned >= 10
  },
  {
    code: 'MUSE',
    name: 'True Curator',
    requirement: 'Own all Common, Rare & Epic Relics',
    icon: '🏛️',
    rarity: 'EPIC',
    category: 'Reliquary',
    check: (s) => s.allCommonRareEpicRelics
  },
  {
    code: 'FULL',
    name: 'Full House',
    requirement: 'Own all 17 Unique Relics',
    icon: '🎰',
    rarity: 'LEGENDARY',
    category: 'Reliquary',
    check: (s) => s.allRelicsOwned
  },
  {
    code: 'TRI',
    name: 'Trinity',
    requirement: 'Own all 3 Mythical Relics',
    icon: '🔱',
    rarity: 'MYTHICAL',
    category: 'Reliquary',
    check: (s) => s.allMythicalRelics
  }
]

// Category 7: Lunar Track
const LUNAR: AchievementDef[] = [
  {
    code: 'LUN1',
    name: 'New Moon',
    requirement: '5 Moon Activations',
    icon: '🌑',
    rarity: 'COMMON',
    category: 'Lunar',
    check: (s) => s.lunarCaught >= 5
  },
  {
    code: 'LUN2',
    name: 'Orbit',
    requirement: '10 Moon Activations',
    icon: '🛰️',
    rarity: 'RARE',
    category: 'Lunar',
    check: (s) => s.lunarCaught >= 10
  },
  {
    code: 'LUN3',
    name: 'High Tide',
    requirement: '25 Moon Activations',
    icon: '🌊',
    rarity: 'EPIC',
    category: 'Lunar',
    check: (s) => s.lunarCaught >= 25
  },
  {
    code: 'LUN4',
    name: 'Full Eclipse',
    requirement: '50 Moon Activations',
    icon: '🌑',
    rarity: 'LEGENDARY',
    category: 'Lunar',
    check: (s) => s.lunarCaught >= 50
  },
  {
    code: 'LUNA',
    name: 'Moon God',
    requirement: '100 Moon Activations',
    icon: '🌙',
    rarity: 'MYTHICAL',
    category: 'Lunar',
    check: (s) => s.lunarCaught >= 100
  }
]

// Category 8: Electric Track
const ELECTRIC: AchievementDef[] = [
  {
    code: 'VOL1',
    name: 'Static',
    requirement: '5 Electric Activations',
    icon: '🎈',
    rarity: 'COMMON',
    category: 'Electric',
    check: (s) => s.electricCaught >= 5
  },
  {
    code: 'VOL2',
    name: 'Current',
    requirement: '10 Electric Activations',
    icon: '🔋',
    rarity: 'RARE',
    category: 'Electric',
    check: (s) => s.electricCaught >= 10
  },
  {
    code: 'VOL3',
    name: 'Overload',
    requirement: '25 Electric Activations',
    icon: '🔌',
    rarity: 'EPIC',
    category: 'Electric',
    check: (s) => s.electricCaught >= 25
  },
  {
    code: 'VOL4',
    name: 'Supercell',
    requirement: '50 Electric Activations',
    icon: '⛈️',
    rarity: 'LEGENDARY',
    category: 'Electric',
    check: (s) => s.electricCaught >= 50
  },
  {
    code: 'VOLT',
    name: 'Thunder God',
    requirement: '100 Electric Activations',
    icon: '⚡',
    rarity: 'MYTHICAL',
    category: 'Electric',
    check: (s) => s.electricCaught >= 100
  }
]

// Category 9: Hellfire Track
const HELLFIRE: AchievementDef[] = [
  {
    code: 'HEL1',
    name: 'Embers',
    requirement: '5 Hellfire Activations',
    icon: '🕯️',
    rarity: 'COMMON',
    category: 'Hellfire',
    check: (s) => s.hellfireCaught >= 5
  },
  {
    code: 'HEL2',
    name: 'Scorch',
    requirement: '10 Hellfire Activations',
    icon: '🥓',
    rarity: 'RARE',
    category: 'Hellfire',
    check: (s) => s.hellfireCaught >= 10
  },
  {
    code: 'HEL3',
    name: 'Blaze',
    requirement: '25 Hellfire Activations',
    icon: '🎇',
    rarity: 'EPIC',
    category: 'Hellfire',
    check: (s) => s.hellfireCaught >= 25
  },
  {
    code: 'HEL4',
    name: 'Inferno',
    requirement: '50 Hellfire Activations',
    icon: '🌋',
    rarity: 'LEGENDARY',
    category: 'Hellfire',
    check: (s) => s.hellfireCaught >= 50
  },
  {
    code: 'HELL',
    name: 'Apocalypse',
    requirement: '100 Hellfire Activations',
    icon: '🔥',
    rarity: 'MYTHICAL',
    category: 'Hellfire',
    check: (s) => s.hellfireCaught >= 100
  }
]

// Category 10: Cards Track
const CARDS: AchievementDef[] = [
  {
    code: 'CRD1',
    name: 'The Ante',
    requirement: '5 Cards Activations',
    icon: '🪙',
    rarity: 'COMMON',
    category: 'Cards',
    check: (s) => s.cardsCaught >= 5
  },
  {
    code: 'CRD2',
    name: 'Dealer',
    requirement: '10 Cards Activations',
    icon: '🤝',
    rarity: 'RARE',
    category: 'Cards',
    check: (s) => s.cardsCaught >= 10
  },
  {
    code: 'CRD3',
    name: 'Full House',
    requirement: '25 Cards Activations',
    icon: '🏰',
    rarity: 'EPIC',
    category: 'Cards',
    check: (s) => s.cardsCaught >= 25
  },
  {
    code: 'CRD4',
    name: 'Jackpot',
    requirement: '50 Cards Activations',
    icon: '🎰',
    rarity: 'LEGENDARY',
    category: 'Cards',
    check: (s) => s.cardsCaught >= 50
  },
  {
    code: 'CARD',
    name: 'The Ace',
    requirement: '100 Cards Activations',
    icon: '🃏',
    rarity: 'MYTHICAL',
    category: 'Cards',
    check: (s) => s.cardsCaught >= 100
  }
]

// Category 11: Oracle Prophecy
const ORACLE_PROPHECY: AchievementDef[] = [
  {
    code: 'ORC3',
    name: 'Seer Apprentice',
    requirement: 'Use Oracle 3 Days in a Row',
    icon: '🔮',
    rarity: 'COMMON',
    category: 'OracleProphecy',
    check: (s) => s.oracleMaxStreak >= 3
  },
  {
    code: 'ORC7',
    name: 'Clairvoyant',
    requirement: 'Use Oracle 7 Days in a Row',
    icon: '🌠',
    rarity: 'RARE',
    category: 'OracleProphecy',
    check: (s) => s.oracleMaxStreak >= 7
  },
  {
    code: 'ORCL',
    name: 'Prophet',
    requirement: 'Use Oracle 14 Days in a Row',
    icon: '👁️',
    rarity: 'EPIC',
    category: 'OracleProphecy',
    check: (s) => s.oracleMaxStreak >= 14
  },
  {
    code: 'CHRON',
    name: 'Chrono Scholar',
    requirement: 'Use Oracle 30 Days in a Row',
    icon: '📅',
    rarity: 'LEGENDARY',
    category: 'OracleProphecy',
    check: (s) => s.oracleMaxStreak >= 30
  },
  {
    code: 'OMNI',
    name: 'Omniscient',
    requirement: 'Use Oracle 60 Days in a Row',
    icon: '🌌',
    rarity: 'MYTHICAL',
    category: 'OracleProphecy',
    check: (s) => s.oracleMaxStreak >= 60
  }
]

// Category 12: Meta & Special
const META: AchievementDef[] = [
  {
    code: 'PITY',
    name: 'Pity King',
    requirement: 'Trigger Bonus Pity 100 times',
    icon: '🩹',
    rarity: 'COMMON',
    category: 'Meta',
    check: (s) => s.totalPitiesEarned >= 100
  },
  {
    code: 'FND',
    name: 'Founder',
    requirement: 'Play during launch month',
    icon: '⭐',
    rarity: 'RARE',
    category: 'Meta',
    check: (_s) => false
  },
  {
    code: 'AUTO',
    name: 'Autopilot',
    requirement: 'Toggle on Auto-Bet for the first time',
    icon: '⚙️',
    rarity: 'RARE',
    category: 'Meta',
    check: (s) => s.hasUsedAutoBet
  },
  {
    code: 'SLAY',
    name: 'God-Killer',
    requirement: 'Win with x100+ multiplier',
    icon: '👺',
    rarity: 'MYTHICAL',
    category: 'Meta',
    check: (s) => s.biggestMatchMult >= 100
  },
  {
    code: 'DREM',
    name: 'Fever Dream',
    requirement: 'Trigger back-to-back Flash Events on consecutive matches',
    icon: '💤',
    rarity: 'MYTHICAL',
    category: 'Meta',
    check: (s) => s.maxConsecutiveFlashEvents >= 2
  },
  {
    code: 'STRM',
    name: 'Storm Chaser',
    requirement: 'Experience all 4 Flash Event themes in one session',
    icon: '🌪️',
    rarity: 'MYTHICAL',
    category: 'Meta',
    check: (s) => s.hasSeenAllFlashTypes
  },
  {
    code: 'TIDE',
    name: 'Riding the Wave',
    requirement:
      'Win 3 consecutive predictions during a single active Tidal Surge window',
    icon: '🌊',
    rarity: 'EPIC',
    category: 'Meta',
    check: (s) => s.maxStreakDuringTidalSurge >= 3
  },
  {
    code: 'SOL',
    name: 'Solar Maximum',
    requirement:
      'Win a match during a Solar Flare while on an Inferno Win Streak (5+ wins)',
    icon: '☀️',
    rarity: 'EPIC',
    category: 'Meta',
    check: (s) => s.hadFlareInfernoCombo
  },
  {
    code: 'CYCL',
    name: 'Vortex Velocity',
    requirement: 'Reach a 10-win streak during a Cyclone Blitz',
    icon: '🌪️',
    rarity: 'EPIC',
    category: 'Meta',
    check: (s) => s.maxStreakDuringCycloneBlitz >= 10
  },
  {
    code: 'MIR',
    name: 'Fata Morgana',
    requirement: 'Roll a 45%+ Echo Bonus on a win during a Mirage Cataclysm',
    icon: '🏜️',
    rarity: 'LEGENDARY',
    category: 'Meta',
    check: (s) => s.hadMirageHighEcho
  },
  {
    code: 'SYZY',
    name: 'Cosmic Alignment',
    requirement:
      'Win a match while both a personal Flash Event and a server-wide Global Event are active simultaneously',
    icon: '🪐',
    rarity: 'EPIC',
    category: 'Meta',
    check: (s) => s.hadFlashPlusGlobalWin
  },
  {
    code: 'CATA',
    name: 'Cataclysm Surveyor',
    requirement:
      'Participate 15 times in each of the four separate Global Events',
    icon: '🔱',
    rarity: 'MYTHICAL',
    category: 'Meta',
    check: (s) =>
      s.tidalSurgeParticipations >= 15 &&
      s.solarFlareParticipations >= 15 &&
      s.cycloneBlitzParticipations >= 15 &&
      s.mirageCataclysmParticipations >= 15
  }
]

// Category 13: Miscellaneous (hidden)
const MISCELLANEOUS: AchievementDef[] = [
  {
    code: 'REBL',
    name: 'The Rebel',
    requirement: 'Bet against the Oracle',
    icon: '🎭',
    rarity: 'RARE',
    category: 'Miscellaneous',
    check: (s) => s.betAgainstOracleCount >= 1
  },
  {
    code: 'DRYM',
    name: 'Dry Mirage',
    requirement:
      'Roll the minimum Echo Bonus (15%) on a win during Mirage Cataclysm',
    icon: '🏜️',
    rarity: 'RARE',
    category: 'Miscellaneous',
    check: (s) => s.hadDryMirage
  },
  {
    code: 'EYEC',
    name: 'Eye of the Storm',
    requirement:
      'Have your win streak shielded by the Buffer Module during Cyclone Blitz',
    icon: '🛡️',
    rarity: 'RARE',
    category: 'Miscellaneous',
    check: (s) => s.hadEyeOfStorm
  },
  {
    code: 'PRIS',
    name: 'Prismatic Wave',
    requirement:
      'Win a match during Tidal Surge with the Prismatic Shard equipped',
    icon: '💎',
    rarity: 'EPIC',
    category: 'Miscellaneous',
    check: (s) => s.hadPrismaticWave
  },
  {
    code: 'FUSN',
    name: 'Thermal Fusion',
    requirement:
      'Trigger a Soul of the Machine Mythic Slam on a win during a Solar Flare',
    icon: '☀️',
    rarity: 'MYTHICAL',
    category: 'Miscellaneous',
    check: (s) => s.hadThermalFusion
  }
]

// Category 14: Festival Catalyst
const FESTIVAL: AchievementDef[] = [
  {
    code: 'FES1',
    name: 'Spark Initiator',
    requirement: 'Trigger 1 Festival',
    icon: '🔋',
    rarity: 'COMMON',
    category: 'Festival',
    check: (s) => s.festivalsTriggered >= 1
  },
  {
    code: 'FES2',
    name: 'System Catalyst',
    requirement: 'Trigger 5 Festivals',
    icon: '🌀',
    rarity: 'RARE',
    category: 'Festival',
    check: (s) => s.festivalsTriggered >= 5
  },
  {
    code: 'FES3',
    name: 'Instability Driver',
    requirement: 'Trigger 15 Festivals',
    icon: '⚡',
    rarity: 'EPIC',
    category: 'Festival',
    check: (s) => s.festivalsTriggered >= 15
  },
  {
    code: 'FES4',
    name: 'Oracle Breaker',
    requirement: 'Trigger 30 Festivals',
    icon: '👁️‍🗨️',
    rarity: 'LEGENDARY',
    category: 'Festival',
    check: (s) => s.festivalsTriggered >= 30
  },
  {
    code: 'FEST',
    name: 'System Anomaly',
    requirement: 'Trigger 50 Festivals',
    icon: '🚨',
    rarity: 'MYTHICAL',
    category: 'Festival',
    check: (s) => s.festivalsTriggered >= 50
  },
  {
    code: 'NET1',
    name: 'Node Arrival',
    requirement: 'Participate in 5 Festivals',
    icon: '📍',
    rarity: 'COMMON',
    category: 'Festival',
    check: (s) => s.festivalsParticipated >= 5
  },
  {
    code: 'NET2',
    name: 'Grid Intrusive',
    requirement: 'Participate in 15 Festivals',
    icon: '🗺️',
    rarity: 'RARE',
    category: 'Festival',
    check: (s) => s.festivalsParticipated >= 15
  },
  {
    code: 'NET3',
    name: 'Phase Interlocking',
    requirement: 'Participate in 30 Festivals',
    icon: '⛓️',
    rarity: 'EPIC',
    category: 'Festival',
    check: (s) => s.festivalsParticipated >= 30
  },
  {
    code: 'NET4',
    name: 'Matrix Core',
    requirement: 'Participate in 60 Festivals',
    icon: '🕸️',
    rarity: 'LEGENDARY',
    category: 'Festival',
    check: (s) => s.festivalsParticipated >= 60
  },
  {
    code: 'MESH',
    name: 'Overmesh',
    requirement: 'Participate in 100 Festivals',
    icon: '🌐',
    rarity: 'MYTHICAL',
    category: 'Festival',
    check: (s) => s.festivalsParticipated >= 100
  }
]

// Category 15: Cosmic - Unified Global Event
const COSMIC_GLOBAL: AchievementDef[] = [
  {
    code: 'GLO1',
    name: 'Event Horizon',
    requirement: 'Participate in 1 Global Event',
    icon: '🌌',
    rarity: 'COMMON',
    category: 'Cosmic',
    check: (s) => s.globalEventParticipations >= 1
  },
  {
    code: 'GLO2',
    name: 'Phenomenon',
    requirement: 'Participate in 10 Global Events',
    icon: '🌍',
    rarity: 'RARE',
    category: 'Cosmic',
    check: (s) => s.globalEventParticipations >= 10
  },
  {
    code: 'GLO3',
    name: 'Aether Drifter',
    requirement: 'Participate in 25 Global Events',
    icon: '🌠',
    rarity: 'EPIC',
    category: 'Cosmic',
    check: (s) => s.globalEventParticipations >= 25
  },
  {
    code: 'GLO4',
    name: 'Nexus Walker',
    requirement: 'Participate in 50 Global Events',
    icon: '🌀',
    rarity: 'LEGENDARY',
    category: 'Cosmic',
    check: (s) => s.globalEventParticipations >= 50
  },
  {
    code: 'GLOB',
    name: 'Force of Nature',
    requirement: 'Participate in 100 Global Events',
    icon: '💫',
    rarity: 'MYTHICAL',
    category: 'Cosmic',
    check: (s) => s.globalEventParticipations >= 100
  }
]

// Category 15: Cosmic - Tidal Surge
const COSMIC_TIDAL: AchievementDef[] = [
  {
    code: 'TSU1',
    name: 'Neap Tide',
    requirement: 'Participate in 3 Tidal Surges',
    icon: '🌊',
    rarity: 'COMMON',
    category: 'Cosmic',
    check: (s) => s.tidalSurgeParticipations >= 3
  },
  {
    code: 'TSU2',
    name: 'Spring Tide',
    requirement: 'Participate in 7 Tidal Surges',
    icon: '💧',
    rarity: 'RARE',
    category: 'Cosmic',
    check: (s) => s.tidalSurgeParticipations >= 7
  },
  {
    code: 'TSU3',
    name: 'Abyssal Drift',
    requirement: 'Participate in 15 Tidal Surges',
    icon: '🐳',
    rarity: 'EPIC',
    category: 'Cosmic',
    check: (s) => s.tidalSurgeParticipations >= 15
  },
  {
    code: 'TSU4',
    name: 'Maelstrom',
    requirement: 'Participate in 25 Tidal Surges',
    icon: '🌀',
    rarity: 'LEGENDARY',
    category: 'Cosmic',
    check: (s) => s.tidalSurgeParticipations >= 25
  },
  {
    code: 'TSU5',
    name: 'Tsunami Sovereign',
    requirement: 'Participate in 50 Tidal Surges',
    icon: '👑',
    rarity: 'MYTHICAL',
    category: 'Cosmic',
    check: (s) => s.tidalSurgeParticipations >= 50
  }
]

// Category 15: Cosmic - Solar Flare
const COSMIC_SOLAR: AchievementDef[] = [
  {
    code: 'SFL1',
    name: 'Corona',
    requirement: 'Participate in 3 Solar Flares',
    icon: '🔅',
    rarity: 'COMMON',
    category: 'Cosmic',
    check: (s) => s.solarFlareParticipations >= 3
  },
  {
    code: 'SFL2',
    name: 'Solar Wind',
    requirement: 'Participate in 7 Solar Flares',
    icon: '💨',
    rarity: 'RARE',
    category: 'Cosmic',
    check: (s) => s.solarFlareParticipations >= 7
  },
  {
    code: 'SFL3',
    name: 'Prominence',
    requirement: 'Participate in 15 Solar Flares',
    icon: '🔥',
    rarity: 'EPIC',
    category: 'Cosmic',
    check: (s) => s.solarFlareParticipations >= 15
  },
  {
    code: 'SFL4',
    name: 'Coronal Ejection',
    requirement: 'Participate in 25 Solar Flares',
    icon: '☄️',
    rarity: 'LEGENDARY',
    category: 'Cosmic',
    check: (s) => s.solarFlareParticipations >= 25
  },
  {
    code: 'SFL5',
    name: 'Heliosphere',
    requirement: 'Participate in 50 Solar Flares',
    icon: '☀️',
    rarity: 'MYTHICAL',
    category: 'Cosmic',
    check: (s) => s.solarFlareParticipations >= 50
  }
]

// Category 15: Cosmic - Cyclone Blitz
const COSMIC_CYCLONE: AchievementDef[] = [
  {
    code: 'CBL1',
    name: 'Gale',
    requirement: 'Participate in 3 Cyclone Blitzes',
    icon: '🍃',
    rarity: 'COMMON',
    category: 'Cosmic',
    check: (s) => s.cycloneBlitzParticipations >= 3
  },
  {
    code: 'CBL2',
    name: 'Squall',
    requirement: 'Participate in 7 Cyclone Blitzes',
    icon: '🌬️',
    rarity: 'RARE',
    category: 'Cosmic',
    check: (s) => s.cycloneBlitzParticipations >= 7
  },
  {
    code: 'CBL3',
    name: 'Tempest',
    requirement: 'Participate in 15 Cyclone Blitzes',
    icon: '🌩️',
    rarity: 'EPIC',
    category: 'Cosmic',
    check: (s) => s.cycloneBlitzParticipations >= 15
  },
  {
    code: 'CBL4',
    name: 'Eye of the Storm',
    requirement: 'Participate in 25 Cyclone Blitzes',
    icon: '👁',
    rarity: 'LEGENDARY',
    category: 'Cosmic',
    check: (s) => s.cycloneBlitzParticipations >= 25
  },
  {
    code: 'CBL5',
    name: 'Zephyr King',
    requirement: 'Participate in 50 Cyclone Blitzes',
    icon: '👑',
    rarity: 'MYTHICAL',
    category: 'Cosmic',
    check: (s) => s.cycloneBlitzParticipations >= 50
  }
]

// Category 15: Cosmic - Mirage Cataclysm
const COSMIC_MIRAGE: AchievementDef[] = [
  {
    code: 'MCA1',
    name: 'Haze',
    requirement: 'Participate in 3 Mirage Cataclysms',
    icon: '🌫️',
    rarity: 'COMMON',
    category: 'Cosmic',
    check: (s) => s.mirageCataclysmParticipations >= 3
  },
  {
    code: 'MCA2',
    name: 'Shimmer',
    requirement: 'Participate in 7 Mirage Cataclysms',
    icon: '✨',
    rarity: 'RARE',
    category: 'Cosmic',
    check: (s) => s.mirageCataclysmParticipations >= 7
  },
  {
    code: 'MCA3',
    name: 'Sandstorm',
    requirement: 'Participate in 15 Mirage Cataclysms',
    icon: '🏜️',
    rarity: 'EPIC',
    category: 'Cosmic',
    check: (s) => s.mirageCataclysmParticipations >= 15
  },
  {
    code: 'MCA4',
    name: 'Oasis Phantom',
    requirement: 'Participate in 25 Mirage Cataclysms',
    icon: '🌴',
    rarity: 'LEGENDARY',
    category: 'Cosmic',
    check: (s) => s.mirageCataclysmParticipations >= 25
  },
  {
    code: 'MCA5',
    name: 'Master of Illusion',
    requirement: 'Participate in 50 Mirage Cataclysms',
    icon: '🔮',
    rarity: 'MYTHICAL',
    category: 'Cosmic',
    check: (s) => s.mirageCataclysmParticipations >= 50
  }
]

// Category 16: Achievement Collector (Updated scaling: 10 -> 25 -> 45 -> 70 -> 105)
const COLLECTOR: AchievementDef[] = [
  {
    code: 'COL10',
    name: 'Curious',
    requirement: 'Earn 10 Achievements',
    icon: '📖',
    rarity: 'COMMON',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 10
  },
  {
    code: 'COL25',
    name: 'Dedicated',
    requirement: 'Earn 25 Achievements',
    icon: '📚',
    rarity: 'RARE',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 25
  },
  {
    code: 'COL45',
    name: 'Completionist',
    requirement: 'Earn 45 Achievements',
    icon: '🗂️',
    rarity: 'EPIC',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 45
  },
  {
    code: 'COL70',
    name: 'Archivist',
    requirement: 'Earn 70 Achievements',
    icon: '🏛️',
    rarity: 'LEGENDARY',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 70
  },
  {
    code: 'COLMAX',
    name: 'Omnivore',
    requirement: 'Earn 105 Achievements',
    icon: '🌟',
    rarity: 'MYTHICAL',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 105
  }
]

// Category 17: Rainbow
const RAINBOW_CAT: AchievementDef[] = [
  {
    code: 'KING',
    name: 'God King',
    requirement: '1000 Wins + 50 Laps + 3 Mythical Relics',
    icon: '👑',
    rarity: 'RAINBOW',
    category: 'Rainbow',
    check: (s) => s.wins >= 1000 && s.laps >= 50 && s.allMythicalRelics
  },
  {
    code: 'COSM',
    name: 'Cosmic Sovereign',
    requirement: 'Participate 50 times in each of the 4 Global Events',
    icon: '🪐',
    rarity: 'RAINBOW',
    category: 'Rainbow',
    check: (s) =>
      s.tidalSurgeParticipations >= 50 &&
      s.solarFlareParticipations >= 50 &&
      s.cycloneBlitzParticipations >= 50 &&
      s.mirageCataclysmParticipations >= 50
  }
]

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  ...COMBATANTS,
  ...MOMENTUM,
  ...PRESTIGE,
  ...DIMENSIONAL,
  ...MULTIPLIER,
  ...RELIQUARY,
  ...LUNAR,
  ...ELECTRIC,
  ...HELLFIRE,
  ...CARDS,
  ...ORACLE_PROPHECY,
  ...META,
  ...MISCELLANEOUS,
  ...FESTIVAL,
  ...COSMIC_GLOBAL,
  ...COSMIC_TIDAL,
  ...COSMIC_SOLAR,
  ...COSMIC_CYCLONE,
  ...COSMIC_MIRAGE,
  ...COLLECTOR,
  ...RAINBOW_CAT
]

export const ACHIEVEMENT_MAP = new Map<string, AchievementDef>(
  ALL_ACHIEVEMENTS.map((a) => [a.code, a])
)

// Never auto-triggered - manually granted via SQL INSERT into user_achievements
const MANUALLY_GRANTED = new Set(['FND'])

/**
 * Pure function. Takes post-UPDATE stats + already-earned code set.
 * Returns newly unlocked AchievementDef[]. No DB calls.
 */
export function checkAchievements(
  stats: AchievementStats,
  alreadyEarned: Set<string>
): AchievementDef[] {
  const unlocked: AchievementDef[] = []
  for (const a of ALL_ACHIEVEMENTS) {
    if (alreadyEarned.has(a.code)) continue
    if (MANUALLY_GRANTED.has(a.code)) continue
    if (a.check(stats)) unlocked.push(a)
  }
  return unlocked
}
