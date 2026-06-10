import { AchievementRarity, BadgeData } from '@/types/rps'

export const CATEGORY_ORDER = [
  'Combatants',
  'Momentum',
  'Prestige',
  'Dimensional',
  'Multiplier',
  'Reliquary',
  'Lunar',
  'Electric',
  'Hellfire',
  'Cards',
  'OracleProphecy',
  'Festival',
  'Meta',
  'Collector',
  'Miscellaneous',
  'Rainbow'
] as const

export type CategoryKey = (typeof CATEGORY_ORDER)[number]

// Categories hidden from all users until they personally earn one.
// Users cannot see OTHER hidden achievements they haven't earned yet.
export const CATEGORY_HIDDEN = new Set(['Miscellaneous'])

export const CATEGORY_ICONS: Record<string, string> = {
  Combatants: '⚔️',
  Momentum: '🔥',
  Prestige: '🔄',
  Dimensional: '🌌',
  Multiplier: '💥',
  Reliquary: '🧿',
  Lunar: '🌙',
  Electric: '⚡',
  Hellfire: '🔥',
  Cards: '🃏',
  OracleProphecy: '🔮',
  Meta: '🎯',
  Miscellaneous: '🎲',
  Festival: '🎪',
  Collector: '📖',
  Rainbow: '🌈'
}

export const CATEGORY_LABELS: Record<string, string> = {
  Combatants: 'The Combatants',
  Momentum: 'Momentum',
  Prestige: 'The Lapping Ecosystem',
  Dimensional: 'Dimensional Scale',
  Multiplier: 'Multiplier Madness',
  Reliquary: 'The Reliquary',
  Lunar: "Moon's Blessing",
  Electric: 'Electric Surge',
  Hellfire: 'Hellfire',
  Cards: 'Luck in the Card',
  OracleProphecy: 'Oracle Prophecy',
  Meta: 'Meta & Special',
  Miscellaneous: 'Miscellaneous',
  Festival: 'Festival Catalyst',
  Collector: 'The Grand Archive',
  Rainbow: 'God King'
}

export const RARITY_ORDER: AchievementRarity[] = [
  'COMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHICAL',
  'RAINBOW'
]

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  COMMON: 'Common',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
  MYTHICAL: 'Mythical',
  RAINBOW: 'Rainbow'
}

export const RARITY_DOT: Record<AchievementRarity, string> = {
  COMMON: '🟢',
  RARE: '🔵',
  EPIC: '🟣',
  LEGENDARY: '🟡',
  MYTHICAL: '🔴',
  RAINBOW: '🌈'
}

export const RARITY_BADGE_STYLE: Record<AchievementRarity, string> = {
  COMMON: 'bg-slate-100 text-slate-600 border-slate-300',
  RARE: 'bg-blue-50 text-blue-700 border-blue-300',
  EPIC: 'bg-purple-50 text-purple-700 border-purple-400',
  LEGENDARY: 'bg-orange-50 text-orange-700 border-orange-400',
  MYTHICAL: 'bg-red-50 text-red-700 border-red-500',
  RAINBOW: 'text-purple-900 border-purple-400 rainbow-badge-bg'
}

export const RARITY_TEXT: Record<AchievementRarity, string> = {
  COMMON: 'text-slate-600',
  RARE: 'text-blue-600',
  EPIC: 'text-purple-600',
  LEGENDARY: 'text-orange-500',
  MYTHICAL: 'text-red-600',
  RAINBOW: 'text-purple-700'
}

export const RARITY_AURA: Record<AchievementRarity, string> = {
  COMMON: 'aura-common',
  RARE: 'aura-rare',
  EPIC: 'aura-epic',
  LEGENDARY: 'aura-legendary',
  MYTHICAL: 'aura-mythical',
  RAINBOW: 'aura-godking'
}

export const RARITY_TOAST_BG: Record<AchievementRarity, string> = {
  COMMON: 'bg-slate-50 border-slate-200',
  RARE: 'bg-blue-50 border-blue-200',
  EPIC: 'bg-purple-50 border-purple-300',
  LEGENDARY: 'bg-orange-50 border-orange-300',
  MYTHICAL: 'bg-red-50 border-red-400',
  RAINBOW: 'border-purple-400 rainbow-badge-bg'
}

export const ACHIEVEMENT_BADGE_MAP: Record<string, BadgeData> = {
  // Combatants
  '50W': { code: '50W', name: 'Skirmisher', icon: '🛡️', rarity: 'COMMON' },
  '100W': { code: '100W', name: 'Centurion', icon: '🎖️', rarity: 'RARE' },
  '250W': { code: '250W', name: 'Veteran', icon: '⚔️', rarity: 'EPIC' },
  '500W': { code: '500W', name: 'Commander', icon: '🏛️', rarity: 'LEGENDARY' },
  GLAD: { code: 'GLAD', name: 'Gladiator', icon: '👑', rarity: 'MYTHICAL' },
  // Momentum
  STK3: { code: 'STK3', name: 'Steady Hand', icon: '📈', rarity: 'COMMON' },
  HOT: { code: 'HOT', name: 'On Fire', icon: '🔥', rarity: 'RARE' },
  FIRE: { code: 'FIRE', name: 'Inferno', icon: '🌋', rarity: 'EPIC' },
  BST: { code: 'BST', name: 'Beast Mode', icon: '💠', rarity: 'LEGENDARY' },
  ZEN: { code: 'ZEN', name: 'Ascended', icon: '🧘', rarity: 'MYTHICAL' },
  // Prestige
  LAP1: { code: 'LAP1', name: 'Rebirth', icon: '♻️', rarity: 'COMMON' },
  LAP5: { code: 'LAP5', name: 'Cycler', icon: '🌀', rarity: 'RARE' },
  '10LP': { code: '10LP', name: 'Lapse King', icon: '🔄', rarity: 'EPIC' },
  '25LP': { code: '25LP', name: 'Eternal', icon: '⏳', rarity: 'LEGENDARY' },
  LORD: { code: 'LORD', name: 'Time Lord', icon: '⌛', rarity: 'MYTHICAL' },
  // Dimensional
  '1TRL': { code: '1TRL', name: 'Trillionaire', icon: '💰', rarity: 'COMMON' },
  '1QAD': { code: '1QAD', name: 'Quadrillionaire', icon: '💎', rarity: 'RARE' },
  '1VIG': {
    code: '1VIG',
    name: 'Vigintillionaire',
    icon: '🌌',
    rarity: 'EPIC'
  },
  '1OVG': {
    code: '1OVG',
    name: 'Infinity Bound',
    icon: '♾️',
    rarity: 'LEGENDARY'
  },
  '999X': {
    code: '999X',
    name: 'The Singularity',
    icon: '🧿',
    rarity: 'MYTHICAL'
  },
  // Multiplier
  '10X': { code: '10X', name: 'Amplified', icon: '⚡', rarity: 'COMMON' },
  '50X': { code: '50X', name: 'Surge', icon: '🌪️', rarity: 'RARE' },
  NUKE: { code: 'NUKE', name: 'Nuclear', icon: '☢️', rarity: 'EPIC' },
  NOVA: { code: 'NOVA', name: 'Supernova', icon: '🌟', rarity: 'LEGENDARY' },
  BOOM: { code: 'BOOM', name: 'The Big One', icon: '🧨', rarity: 'MYTHICAL' },
  // Reliquary
  '5RL': { code: '5RL', name: 'Scavenger', icon: '📁', rarity: 'COMMON' },
  '10RL': { code: '10RL', name: 'Collector', icon: '🎒', rarity: 'RARE' },
  MUSE: { code: 'MUSE', name: 'True Curator', icon: '🏛️', rarity: 'EPIC' },
  FULL: { code: 'FULL', name: 'Full House', icon: '🎰', rarity: 'LEGENDARY' },
  TRI: { code: 'TRI', name: 'Trinity', icon: '🔱', rarity: 'MYTHICAL' },
  // Lunar
  LUN1: { code: 'LUN1', name: 'New Moon', icon: '🌑', rarity: 'COMMON' },
  LUN2: { code: 'LUN2', name: 'Orbit', icon: '🛰️', rarity: 'RARE' },
  LUN3: { code: 'LUN3', name: 'High Tide', icon: '🌊', rarity: 'EPIC' },
  LUN4: { code: 'LUN4', name: 'Full Eclipse', icon: '🌑', rarity: 'LEGENDARY' },
  LUNA: { code: 'LUNA', name: 'Moon God', icon: '🌙', rarity: 'MYTHICAL' },
  // Electric
  VOL1: { code: 'VOL1', name: 'Static', icon: '🎈', rarity: 'COMMON' },
  VOL2: { code: 'VOL2', name: 'Current', icon: '🔋', rarity: 'RARE' },
  VOL3: { code: 'VOL3', name: 'Overload', icon: '🔌', rarity: 'EPIC' },
  VOL4: { code: 'VOL4', name: 'Supercell', icon: '⛈️', rarity: 'LEGENDARY' },
  VOLT: { code: 'VOLT', name: 'Thunder God', icon: '⚡', rarity: 'MYTHICAL' },
  // Hellfire
  HEL1: { code: 'HEL1', name: 'Embers', icon: '🕯️', rarity: 'COMMON' },
  HEL2: { code: 'HEL2', name: 'Scorch', icon: '🥓', rarity: 'RARE' },
  HEL3: { code: 'HEL3', name: 'Blaze', icon: '🎇', rarity: 'EPIC' },
  HEL4: { code: 'HEL4', name: 'Inferno', icon: '🌋', rarity: 'LEGENDARY' },
  HELL: { code: 'HELL', name: 'Apocalypse', icon: '🔥', rarity: 'MYTHICAL' },
  // Cards
  CRD1: { code: 'CRD1', name: 'The Ante', icon: '🪙', rarity: 'COMMON' },
  CRD2: { code: 'CRD2', name: 'Dealer', icon: '🤝', rarity: 'RARE' },
  CRD3: { code: 'CRD3', name: 'Full House', icon: '🏰', rarity: 'EPIC' },
  CRD4: { code: 'CRD4', name: 'Jackpot', icon: '🎰', rarity: 'LEGENDARY' },
  CARD: { code: 'CARD', name: 'The Ace', icon: '🃏', rarity: 'MYTHICAL' },
  // Oracle Prophecy
  ORC3: { code: 'ORC3', name: 'Seer Apprentice', icon: '🔮', rarity: 'COMMON' },
  ORC7: { code: 'ORC7', name: 'Clairvoyant', icon: '🌠', rarity: 'RARE' },
  ORCL: { code: 'ORCL', name: 'Prophet', icon: '👁️', rarity: 'EPIC' },
  CHRON: {
    code: 'CHRON',
    name: 'Chrono Scholar',
    icon: '📅',
    rarity: 'LEGENDARY'
  },
  OMNI: { code: 'OMNI', name: 'Omniscient', icon: '🌌', rarity: 'MYTHICAL' },
  // Meta
  PITY: { code: 'PITY', name: 'Pity King', icon: '🩹', rarity: 'COMMON' },
  FND: { code: 'FND', name: 'Founder', icon: '⭐', rarity: 'RARE' },
  SLAY: { code: 'SLAY', name: 'God-Killer', icon: '👺', rarity: 'MYTHICAL' },
  AUTO: { code: 'AUTO', name: 'Autopilot', icon: '⚙️', rarity: 'RARE' },
  DREM: { code: 'DREM', name: 'Fever Dream', icon: '💤', rarity: 'MYTHICAL' },
  STRM: { code: 'STRM', name: 'Storm Chaser', icon: '🌪️', rarity: 'MYTHICAL' },
  COLMAX: { code: 'COLMAX', name: 'Omnivore', icon: '🌟', rarity: 'MYTHICAL' },
  // Miscellaneous (hidden)
  REBL: { code: 'REBL', name: 'The Rebel', icon: '🎭', rarity: 'RARE' },
  // Total achievement collection
  COL10: { code: 'COL10', name: 'Curious', icon: '📖', rarity: 'COMMON' },
  COL25: { code: 'COL25', name: 'Dedicated', icon: '📚', rarity: 'RARE' },
  COL40: { code: 'COL40', name: 'Completionist', icon: '🗂️', rarity: 'EPIC' },
  COL55: { code: 'COL55', name: 'Archivist', icon: '🏛️', rarity: 'LEGENDARY' },
  // Festival
  FES1: { code: 'FES1', name: 'Spark Initiator', icon: '🔋', rarity: 'COMMON' },
  FES2: { code: 'FES2', name: 'System Catalyst', icon: '🌀', rarity: 'RARE' },
  FES3: {
    code: 'FES3',
    name: 'Instability Driver',
    icon: '⚡',
    rarity: 'EPIC'
  },
  FES4: {
    code: 'FES4',
    name: 'Oracle Breaker',
    icon: '👁️‍🗨️',
    rarity: 'LEGENDARY'
  },
  FEST: {
    code: 'FEST',
    name: 'System Anomaly',
    icon: '🚨',
    rarity: 'MYTHICAL'
  },
  NET1: { code: 'NET1', name: 'Node Arrival', icon: '📍', rarity: 'COMMON' },
  NET2: { code: 'NET2', name: 'Grid Intrusive', icon: '🗺️', rarity: 'RARE' },
  NET3: {
    code: 'NET3',
    name: 'Phase Interlocking',
    icon: '⛓️',
    rarity: 'EPIC'
  },
  NET4: { code: 'NET4', name: 'Matrix Core', icon: '🕸️', rarity: 'LEGENDARY' },
  MESH: { code: 'MESH', name: 'Overmesh', icon: '🌐', rarity: 'MYTHICAL' },
  // Rainbow
  KING: { code: 'KING', name: 'God King', icon: '👑', rarity: 'RAINBOW' }
}

// Chain order per category (low → high tier).
// Chained categories: badge selector shows only the highest earned.
// Standalone categories (Meta, Misc, Rainbow): all earned shown individually.
export const CATEGORY_CHAINS: Record<string, string[]> = {
  Combatants: ['50W', '100W', '250W', '500W', 'GLAD'],
  Momentum: ['STK3', 'HOT', 'FIRE', 'BST', 'ZEN'],
  Prestige: ['LAP1', 'LAP5', '10LP', '25LP', 'LORD'],
  Dimensional: ['1TRL', '1QAD', '1VIG', '1OVG', '999X'],
  Multiplier: ['10X', '50X', 'NUKE', 'NOVA', 'BOOM'],
  Reliquary: ['5RL', '10RL', 'MUSE', 'FULL', 'TRI'],
  Lunar: ['LUN1', 'LUN2', 'LUN3', 'LUN4', 'LUNA'],
  Electric: ['VOL1', 'VOL2', 'VOL3', 'VOL4', 'VOLT'],
  Hellfire: ['HEL1', 'HEL2', 'HEL3', 'HEL4', 'HELL'],
  Cards: ['CRD1', 'CRD2', 'CRD3', 'CRD4', 'CARD'],
  OracleProphecy: ['ORC3', 'ORC7', 'ORCL', 'CHRON', 'OMNI'],
  Meta: ['PITY', 'FND', 'AUTO', 'SLAY', 'DREM', 'STRM'],
  Miscellaneous: ['REBL'],
  Collector: ['COL10', 'COL25', 'COL40', 'COL55', 'COLMAX'],
  Festival: [
    'FES1',
    'FES2',
    'FES3',
    'FES4',
    'FEST',
    'NET1',
    'NET2',
    'NET3',
    'NET4',
    'MESH'
  ],
  Rainbow: ['KING']
}

const STANDALONE_CATEGORIES = new Set(['Meta', 'Miscellaneous', 'Rainbow'])

/**
 * For chained categories: returns only the highest-tier earned badge.
 * For standalone categories: returns all earned badges individually.
 * Used to populate the badge selector in the profile achievement menu.
 */
export function getHighestEarnedPerCategory(earned: Set<string>): BadgeData[] {
  const result: BadgeData[] = []

  for (const [cat, chain] of Object.entries(CATEGORY_CHAINS)) {
    if (STANDALONE_CATEGORIES.has(cat)) {
      for (const code of chain) {
        if (earned.has(code)) {
          const def = ACHIEVEMENT_BADGE_MAP[code]
          if (def) result.push(def)
        }
      }
    } else {
      let highest: BadgeData | null = null
      for (const code of chain) {
        if (earned.has(code)) {
          const def = ACHIEVEMENT_BADGE_MAP[code]
          if (def) highest = def
        }
      }
      if (highest) result.push(highest)
    }
  }

  return result
}

export const BADGE_REQUIREMENT: Record<string, string> = {
  '50W': '50 Total Wins',
  '100W': '100 Total Wins',
  '250W': '250 Total Wins',
  '500W': '500 Total Wins',
  GLAD: '1,000 Total Wins',
  STK3: '3-Win Streak',
  HOT: '5-Win Streak',
  FIRE: '10-Win Streak',
  BST: '15-Win Streak',
  ZEN: '20-Win Streak',
  LAP1: '1 Full Lap',
  LAP5: '5 Full Laps',
  '10LP': '10 Full Laps',
  '25LP': '25 Full Laps',
  LORD: '50 Full Laps',
  '1TRL': 'Reach 1 Trillion',
  '1QAD': 'Reach 1 Quadrillion',
  '1VIG': 'Reach 1 Vigintillion',
  '1OVG': 'Reach 1 Octovigintillion',
  '999X': 'Reach 999 Octovigintillion',
  '10X': 'Reach x10 Multiplier',
  '50X': 'Reach x30 Multiplier',
  NUKE: 'Reach x60 Multiplier',
  NOVA: 'Reach x100 Multiplier',
  BOOM: 'Trigger a x3 Mythic Relic Slam',
  '5RL': 'Own 5 Unique Relics',
  '10RL': 'Own 10 Unique Relics',
  MUSE: 'Own all Common, Rare & Epic Relics',
  FULL: 'Own all 17 Unique Relics',
  TRI: 'Own all 3 Mythical Relics',
  LUN1: '5 Moon Activations',
  LUN2: '10 Moon Activations',
  LUN3: '25 Moon Activations',
  LUN4: '50 Moon Activations',
  LUNA: '100 Moon Activations',
  VOL1: '5 Electric Activations',
  VOL2: '10 Electric Activations',
  VOL3: '25 Electric Activations',
  VOL4: '50 Electric Activations',
  VOLT: '100 Electric Activations',
  HEL1: '5 Hellfire Activations',
  HEL2: '10 Hellfire Activations',
  HEL3: '25 Hellfire Activations',
  HEL4: '50 Hellfire Activations',
  HELL: '100 Hellfire Activations',
  CRD1: '5 Cards Activations',
  CRD2: '10 Cards Activations',
  CRD3: '25 Cards Activations',
  CRD4: '50 Cards Activations',
  CARD: '100 Cards Activations',
  ORC3: 'Use Oracle 3 Days in a Row',
  ORC7: 'Use Oracle 7 Days in a Row',
  ORCL: 'Use Oracle 14 Days in a Row',
  CHRON: 'Use Oracle 30 Days in a Row',
  OMNI: 'Use Oracle 60 Days in a Row',
  PITY: 'Trigger Bonus Pity 100 times',
  FND: 'Play during launch month',
  AUTO: 'Toggle on Auto-Bet for the first time',
  SLAY: 'Win with x100+ multiplier',
  DREM: 'Trigger back-to-back Flash Events on consecutive matches',
  STRM: 'Experience all 4 Flash Event themes in one session',
  REBL: 'Bet against the Oracle',
  COL10: 'Earn 10 Achievements',
  COL25: 'Earn 25 Achievements',
  COL40: 'Earn 40 Achievements',
  COL55: 'Earn 55 Achievements',
  COLMAX: 'Earn 68 Achievements',
  FES1: 'Trigger 1 Festival',
  FES2: 'Trigger 5 Festivals',
  FES3: 'Trigger 15 Festivals',
  FES4: 'Trigger 30 Festivals',
  FEST: 'Trigger 50 Festivals',
  NET1: 'Participate in 5 Festivals',
  NET2: 'Participate in 15 Festivals',
  NET3: 'Participate in 30 Festivals',
  NET4: 'Participate in 60 Festivals',
  MESH: 'Participate in 100 Festivals',
  KING: '1000 Wins + 50 Laps + 3 Mythical Relics'
}