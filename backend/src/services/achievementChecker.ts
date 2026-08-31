import pool from '../utils/db.js'
import type {
  AchievementStats,
  AchievementDef
}  from '../types/achievements.js'

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

// Category 11: Arkalon Prophecy
const ORACLE_PROPHECY: AchievementDef[] = [
  {
    code: 'ORC3',
    name: 'Seer Apprentice',
    requirement: 'Use Arkalon 3 Days in a Row',
    icon: '🔮',
    rarity: 'COMMON',
    category: 'ArkalonProphecy',
    check: (s) => s.oracleMaxStreak >= 3
  },
  {
    code: 'ORC7',
    name: 'Clairvoyant',
    requirement: 'Use Arkalon 7 Days in a Row',
    icon: '🌠',
    rarity: 'RARE',
    category: 'ArkalonProphecy',
    check: (s) => s.oracleMaxStreak >= 7
  },
  {
    code: 'ORCL',
    name: 'Prophet',
    requirement: 'Use Arkalon 14 Days in a Row',
    icon: '👁️',
    rarity: 'EPIC',
    category: 'ArkalonProphecy',
    check: (s) => s.oracleMaxStreak >= 14
  },
  {
    code: 'CHRON',
    name: 'Chrono Scholar',
    requirement: 'Use Arkalon 30 Days in a Row',
    icon: '📅',
    rarity: 'LEGENDARY',
    category: 'ArkalonProphecy',
    check: (s) => s.oracleMaxStreak >= 30
  },
  {
    code: 'OMNI',
    name: 'Omniscient',
    requirement: 'Use Arkalon 60 Days in a Row',
    icon: '🌌',
    rarity: 'MYTHICAL',
    category: 'ArkalonProphecy',
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
    requirement: 'Bet against Arkalon',
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
    name: 'Arkalon Breaker',
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

// Category 16: Achievement Collector
const COLLECTOR: AchievementDef[] = [
  {
    code: 'COL20',
    name: 'Curious',
    requirement: 'Earn 20 Achievements',
    icon: '📖',
    rarity: 'COMMON',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 20
  },
  {
    code: 'COL40',
    name: 'Dedicated',
    requirement: 'Earn 40 Achievements',
    icon: '📚',
    rarity: 'RARE',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 40
  },
  {
    code: 'COL65',
    name: 'Completionist',
    requirement: 'Earn 65 Achievements',
    icon: '🗂️',
    rarity: 'EPIC',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 65
  },
  {
    code: 'COL95',
    name: 'Archivist',
    requirement: 'Earn 95 Achievements',
    icon: '🏛️',
    rarity: 'LEGENDARY',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 95
  },
  {
    code: 'COLMAX',
    name: 'Omnivore',
    requirement: 'Earn 142 Achievements',
    icon: '🌟',
    rarity: 'MYTHICAL',
    category: 'Collector',
    check: (s) => s.totalAchievementsEarned >= 142
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
  },
  {
    code: 'PURI',
    name: 'World Purifier',
    requirement: 'Defeat each of the four World Bosses 50 times',
    icon: '🌍',
    rarity: 'RAINBOW',
    category: 'Rainbow',
    check: (s) =>
      s.hexurionKills >= 50 &&
      s.orphionKills >= 50 &&
      s.fracturonKills >= 50 &&
      s.apexionKills >= 50
  },
  {
    code: 'NEON',
    name: 'Paradise Ascendant',
    requirement: '50 clears of every bonus stage',
    icon: '🌈',
    rarity: 'RAINBOW',
    category: 'Rainbow',
    check: (s) =>
      Object.values(s.neonParadiseMinigamesPlayed).length >= 9 &&
      Object.values(s.neonParadiseMinigamesPlayed).every((n) => n >= 50)
  }
]

const WORLD_BOSSES: AchievementDef[] = [
  {
    code: 'WB01',
    name: 'First Contact',
    requirement: 'Defeat 1 World Boss',
    icon: '⚔️',
    rarity: 'COMMON',
    category: 'WorldBoss',
    check: (s) => s.worldBossKills >= 1
  },
  {
    code: 'WB02',
    name: 'Entity Hunter',
    requirement: 'Defeat 10 World Bosses',
    icon: '🛡️',
    rarity: 'RARE',
    category: 'WorldBoss',
    check: (s) => s.worldBossKills >= 10
  },
  {
    code: 'WB03',
    name: 'World Defender',
    requirement: 'Defeat 30 World Bosses',
    icon: '🌍',
    rarity: 'EPIC',
    category: 'WorldBoss',
    check: (s) => s.worldBossKills >= 30
  },
  {
    code: 'WB04',
    name: 'Cataclysm Breaker',
    requirement: 'Defeat 75 World Bosses',
    icon: '💥',
    rarity: 'LEGENDARY',
    category: 'WorldBoss',
    check: (s) => s.worldBossKills >= 75
  },
  {
    code: 'WB05',
    name: 'World Savior',
    requirement: 'Defeat 200 World Bosses',
    icon: '🌟',
    rarity: 'MYTHICAL',
    category: 'WorldBoss',
    check: (s) => s.worldBossKills >= 200
  },
  {
    code: 'HEXM',
    name: "Hexurion's Bane",
    requirement: 'Defeat Hexurion 50 times',
    icon: '⬢',
    rarity: 'MYTHICAL',
    category: 'WorldBoss',
    check: (s) => s.hexurionKills >= 50
  },
  {
    code: 'ORBM',
    name: 'Orbitbreaker',
    requirement: 'Defeat Orphion 50 times',
    icon: '🪐',
    rarity: 'MYTHICAL',
    category: 'WorldBoss',
    check: (s) => s.orphionKills >= 50
  },
  {
    code: 'FRAM',
    name: 'Fractal Collapse',
    requirement: 'Defeat Fracturon 50 times',
    icon: '💎',
    rarity: 'MYTHICAL',
    category: 'WorldBoss',
    check: (s) => s.fracturonKills >= 50
  },
  {
    code: 'APXM',
    name: 'Pyramid Fall',
    requirement: 'Defeat Apexion 50 times',
    icon: '🔺',
    rarity: 'MYTHICAL',
    category: 'WorldBoss',
    check: (s) => s.apexionKills >= 50
  }
]

const WORLD_BOSS_CHESTS: AchievementDef[] = [
  {
    code: 'CH01',
    name: 'Treasure Seeker',
    requirement: 'Open 5 World Boss Chests',
    icon: '📦',
    rarity: 'COMMON',
    category: 'WorldBossChests',
    check: (s) => s.worldBossChestsOpened >= 5
  },
  {
    code: 'CH02',
    name: 'Treasure Hunter',
    requirement: 'Open 20 World Boss Chests',
    icon: '🎁',
    rarity: 'RARE',
    category: 'WorldBossChests',
    check: (s) => s.worldBossChestsOpened >= 20
  },
  {
    code: 'CH03',
    name: 'Vault Raider',
    requirement: 'Open 50 World Boss Chests',
    icon: '💰',
    rarity: 'EPIC',
    category: 'WorldBossChests',
    check: (s) => s.worldBossChestsOpened >= 50
  },
  {
    code: 'CH04',
    name: 'Treasure Hoard',
    requirement: 'Open 100 World Boss Chests',
    icon: '🏆',
    rarity: 'LEGENDARY',
    category: 'WorldBossChests',
    check: (s) => s.worldBossChestsOpened >= 100
  },
  {
    code: 'CH05',
    name: 'Living Vault',
    requirement: 'Open 250 World Boss Chests',
    icon: '👑',
    rarity: 'MYTHICAL',
    category: 'WorldBossChests',
    check: (s) => s.worldBossChestsOpened >= 250
  }
]

const WORLD_BOSS_META: AchievementDef[] = [
  {
    code: 'LAST',
    name: 'Final Strike',
    requirement: 'Land the finishing blow on a World Boss',
    icon: '🎯',
    rarity: 'COMMON',
    category: 'Meta',
    check: (s) => s.hadFinalStrike
  },
  {
    code: 'PERF',
    name: 'Perfect Assault',
    requirement: 'Defeat a World Boss without missing a single prediction',
    icon: '💯',
    rarity: 'RARE',
    category: 'Meta',
    check: (s) => s.hadPerfectAssault
  },
  {
    code: 'LUCK',
    name: 'Lucky Shot',
    requirement:
      'Land the finishing blow while contributing 10% or less of total boss damage',
    icon: '🍀',
    rarity: 'RARE',
    category: 'Meta',
    check: (s) => s.hadLuckyShot
  },
  {
    code: 'CLUT',
    name: 'Clutch Victory',
    requirement: 'Land the finishing blow with less than 5 seconds remaining',
    icon: '⏱️',
    rarity: 'EPIC',
    category: 'Meta',
    check: (s) => s.hadClutchVictory
  },
  {
    code: 'DIVN',
    name: 'Divine Intervention',
    requirement:
      'Join a World Boss during its final 10 seconds and land the finishing blow',
    icon: '🌠',
    rarity: 'MYTHICAL',
    category: 'Meta',
    check: (s) => s.hadDivineIntervention
  }
]

const NEON_PARADISE: AchievementDef[] = [
  {
    code: 'NEO1',
    name: 'Paradise Visitor',
    requirement: 'Trigger 1 bonus stage',
    icon: '🎰',
    rarity: 'COMMON',
    category: 'NEON_PARADISE',
    check: (s) => s.bonusStagesPlayed >= 1
  },
  {
    code: 'NEO2',
    name: 'Paradise Explorer',
    requirement: 'Trigger 10 bonus stages',
    icon: '🎰',
    rarity: 'RARE',
    category: 'NEON_PARADISE',
    check: (s) => s.bonusStagesPlayed >= 10
  },
  {
    code: 'NEO3',
    name: 'Paradise Regular',
    requirement: 'Trigger 50 bonus stages',
    icon: '🎰',
    rarity: 'EPIC',
    category: 'NEON_PARADISE',
    check: (s) => s.bonusStagesPlayed >= 50
  },
  {
    code: 'NEO4',
    name: 'Paradise Legend',
    requirement: 'Trigger 150 bonus stages',
    icon: '🎰',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.bonusStagesPlayed >= 150
  },
  {
    code: 'NEO5',
    name: 'Neon Sovereign',
    requirement: 'Trigger 300 bonus stages',
    icon: '👑',
    rarity: 'MYTHICAL',
    category: 'NEON_PARADISE',
    check: (s) => s.bonusStagesPlayed >= 300
  },
  {
    code: 'TVLT',
    name: 'Open the Royal Chest',
    requirement: 'Get the 10x reward from Treasure Vault',
    icon: '🏆',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.royalTreasureChestsOpened >= 1
  },
  {
    code: 'KVAL',
    name: 'Find the Royal Chest',
    requirement: "Pick the Royal chest in King's Vault",
    icon: '👑',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.royalKingsChestsFound >= 1
  },
  {
    code: 'DON3',
    name: 'Reach the 10x Payout',
    requirement: 'Reach step 3 in Double Down',
    icon: '⚡',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.doubleDownmaxClears >= 1
  },
  {
    code: 'WILD',
    name: 'Reveal the Maximum Combination',
    requirement: 'Flip three Arkalon cards in Wild Prediction',
    icon: '🃏',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.wildPredictionMaxCombos >= 1
  },
  {
    code: 'SFX5',
    name: 'Reach the 10x Payout',
    requirement: 'Get the 10x reward in Surge Frenzy',
    icon: '⚡',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.surgeFrenzyMaxComboFinishes >= 1
  },
  {
    code: 'RRSH',
    name: 'Roll Rainbow Tier',
    requirement: 'Average Rainbow spectrum in Rainbow Rush',
    icon: '🌈',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.rainbowTierRolls >= 1
  },
  {
    code: 'SNIP',
    name: 'Hit the Perfect Bullseye',
    requirement: 'Get the 10x reward in Sniper Challenge',
    icon: '🎯',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.hadPerfectSnipe
  },
  {
    code: 'OVIS',
    name: 'Complete All Five Sequences',
    requirement: 'Complete all 5 sequences in Arkalon Vision',
    icon: '🔮',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.oracleVisionPerfectClears >= 1
  },
  {
    code: 'MINE',
    name: 'Strike the Motherlode',
    requirement: 'Find 5 diamonds for the 10x reward in Crystal Mine',
    icon: '💎',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.crystalMineClears >= 1
  },
  {
    code: 'NEO9',
    name: 'Complete Every Neon Paradise Minigame',
    requirement: 'Play all 9 bonus stages at least once',
    icon: '🌈',
    rarity: 'EPIC',
    category: 'NEON_PARADISE',
    check: (s) => Object.keys(s.neonParadiseMinigamesPlayed).length >= 9
  },
  {
    code: 'NE20',
    name: 'Complete Every Minigame 20 Times',
    requirement: '20 clears of every bonus stage',
    icon: '🌈',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) =>
      Object.values(s.neonParadiseMinigamesPlayed).length >= 9 &&
      Object.values(s.neonParadiseMinigamesPlayed).every((n) => n >= 20)
  },
  {
    code: 'CIRC',
    name: 'Play Every Minigame in a Single Day',
    requirement: 'All 9 bonus stages in one calendar day',
    icon: '🌈',
    rarity: 'LEGENDARY',
    category: 'NEON_PARADISE',
    check: (s) => s.neonFullCircuitToday
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
  ...RAINBOW_CAT,
  ...WORLD_BOSSES,
  ...WORLD_BOSS_CHESTS,
  ...WORLD_BOSS_META,
  ...NEON_PARADISE
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

import type { BonusSession, SniperSession } from '../types/bonusStage.js'

export async function checkBonusAchievements(
  userId: string,
  session: BonusSession,
  _finalPayout: bigint
): Promise<void> {
  try {
    if (session.stageType === 'SNIPER_CHALLENGE') {
      const grid = session.gridState as
        | (SniperSession & { resolvedZone?: string })
        | null

      if (grid?.resolvedZone === 'bullseye') {
        await pool.query(
          'UPDATE users SET had_perfect_snipe = true WHERE user_id = $1',
          [userId]
        )
      }
    }

    const userResult = await pool.query(
      `SELECT bonus_stages_played, had_perfect_snipe,
        crystal_mine_clears, oracle_vision_perfect_clears,
              double_down_max_clears, wild_prediction_max_combos,
              royal_treasure_chests_opened, royal_kings_chests_found,
              rainbow_tier_rolls, surge_frenzy_max_combo_finishes,
              neon_paradise_minigames_played, neon_full_circuit_today
        FROM users WHERE user_id = $1`,
      [userId]
    )
    const u = userResult.rows[0]
    if (!u) return

    const earnedRes = await pool.query(
      `SELECT achievement_code FROM user_achievements WHERE user_id = $1`,
      [userId]
    )
    const alreadyEarned = new Set<string>(
      earnedRes.rows.map(
        (r: { achievement_code: string }) => r.achievement_code
      )
    )

    const partialStats = {
      bonusStagesPlayed: Number(u.bonus_stages_played ?? 0),
      hadPerfectSnipe: Boolean(u.had_perfect_snipe),
      crystalMineClears: Number(u.crystal_mine_clears ?? 0),
      oracleVisionPerfectClears: Number(u.oracle_vision_perfect_clears ?? 0),
      doubleDownmaxClears: Number(u.double_down_max_clears ?? 0),
      wildPredictionMaxCombos: Number(u.wild_prediction_max_combos ?? 0),
      royalTreasureChestsOpened: Number(u.royal_treasure_chests_opened ?? 0),
      royalKingsChestsFound: Number(u.royal_kings_chests_found ?? 0),
      rainbowTierRolls: Number(u.rainbow_tier_rolls ?? 0),
      surgeFrenzyMaxComboFinishes: Number(
        u.surge_frenzy_max_combo_finishes ?? 0
      ),
      neonParadiseMinigamesPlayed:
        (u.neon_paradise_minigames_played as Record<string, number>) ?? {},
      neonFullCircuitToday: Boolean(u.neon_full_circuit_today)
    } as unknown as AchievementStats

    const newAchievements = [
      ...NEON_PARADISE,
      ...RAINBOW_CAT.filter((a) => a.code === 'NEON')
    ].filter((a) => !alreadyEarned.has(a.code) && a.check(partialStats))

    if (newAchievements.length === 0) return

    const placeholders = newAchievements
      .map((_, i) => `($1, $${i + 2}, ${Date.now()})`)
      .join(', ')

    await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_code, earned_at)
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING`,
      [userId, ...newAchievements.map((a) => a.code)]
    )

    await pool.query(
      `UPDATE users SET total_achievements = total_achievements + $1
        WHERE user_id = $2`,
      [newAchievements.length, userId]
    )
  } catch (err) {
    console.error('[checkBonusAchievements] error:', err)
  }
}