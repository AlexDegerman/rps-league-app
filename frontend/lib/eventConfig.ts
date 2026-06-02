export type EventThemeKey =
  | 'LUNAR'
  | 'ELECTRIC'
  | 'CARDS'
  | 'HELLFIRE'
  | 'winstreak_fever'
  | 'winstreak_inferno'
  | 'festival_spark'
  | 'festival_ghost'
  | 'festival_safeguard'
  | 'festival_resonance'
  | 'festival_surge'
  | 'festival_vault'
  | 'festival_fever'
  | 'festival_sanguine'

export const FESTIVAL_THEME_CONFIG = {
  SPARK: { key: 'festival_spark', color: '#a855f7', dotClass: 'bg-purple-400' },
  GHOST: { key: 'festival_ghost', color: '#4dd0c4', dotClass: 'bg-teal-400' },
  SAFEGUARD: {
    key: 'festival_safeguard',
    color: '#64748b',
    dotClass: 'bg-slate-400'
  },
  RESONANCE: {
    key: 'festival_resonance',
    color: '#ecc94b',
    dotClass: 'bg-yellow-400'
  },
  SURGE: { key: 'festival_surge', color: '#22d3ee', dotClass: 'bg-cyan-400' },
  VAULT: { key: 'festival_vault', color: '#748ffc', dotClass: 'bg-indigo-400' },
  FEVER: { key: 'festival_fever', color: '#f97316', dotClass: 'bg-orange-500' },
  SANGUINE: {
    key: 'festival_sanguine',
    color: '#991b1b',
    dotClass: 'bg-red-800'
  }
} as const

export const EVENT_HEADER_CONFIG = {
  // Flash
  LUNAR: { textClass: 'event-header-lunar', borderClass: 'event-border-lunar' },
  ELECTRIC: {
    textClass: 'event-header-electric',
    borderClass: 'event-border-electric'
  },
  CARDS: { textClass: 'event-header-cards', borderClass: 'event-border-cards' },
  HELLFIRE: {
    textClass: 'event-header-hellfire',
    borderClass: 'event-border-hellfire'
  },
  // Festivals
  festival_spark: {
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500'
  },
  festival_ghost: {
    textClass: 'event-header-ghost',
    borderClass: 'event-border-ghost'
  },
  festival_safeguard: {
    textClass: 'event-header-safeguard',
    borderClass: 'event-border-safeguard'
  },
  festival_resonance: {
    textClass: 'text-yellow-500',
    borderClass: 'border-yellow-400'
  },
  festival_surge: {
    textClass: 'event-header-surge',
    borderClass: 'event-border-surge'
  },
  festival_vault: {
    textClass: 'event-header-vault',
    borderClass: 'event-border-vault'
  },
  festival_fever: {
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500'
  },
  festival_sanguine: {
    textClass: 'event-header-sanguine',
    borderClass: 'event-border-sanguine'
  },
  // WinStreaks
  winstreak_fever: {
    textClass: 'text-green-500',
    borderClass: 'border-green-400'
  },
  winstreak_inferno: {
    textClass: 'text-orange-500',
    borderClass: 'border-orange-400'
  }
} as const

export const EVENT_TICKER_CONFIG = {
  // Flash
  LUNAR: {
    borderClass: 'event-border-lunar',
    topGlowClass: 'ticker-glow-lunar',
    bgClass: 'event-bg-lunar',
    dotClass: 'bg-blue-300',
    particleClass: ''
  },
  ELECTRIC: {
    borderClass: 'event-border-electric',
    topGlowClass: 'ticker-glow-electric',
    bgClass: 'event-bg-electric',
    dotClass: 'bg-purple-400',
    particleClass: ''
  },
  CARDS: {
    borderClass: 'event-border-cards',
    topGlowClass: 'ticker-glow-cards',
    bgClass: 'event-bg-cards',
    dotClass: 'bg-yellow-400',
    particleClass: ''
  },
  HELLFIRE: {
    borderClass: 'event-border-hellfire',
    topGlowClass: 'ticker-glow-hellfire',
    bgClass: 'event-bg-hellfire',
    dotClass: 'bg-red-500',
    particleClass: 'ticker-hellfire-ember'
  },
  // Festivals
  festival_spark: {
    borderClass: 'border-purple-500',
    topGlowClass: 'ticker-glow-electric',
    bgClass: 'bg-purple-50/10',
    dotClass: 'bg-purple-400',
    particleClass: ''
  },
  festival_ghost: {
    borderClass: 'event-border-ghost',
    topGlowClass: 'ticker-glow-ghost',
    bgClass: 'event-bg-ghost',
    dotClass: 'bg-teal-400',
    particleClass: ''
  },
  festival_safeguard: {
    borderClass: 'event-border-safeguard',
    topGlowClass: 'ticker-glow-safeguard',
    bgClass: 'event-bg-safeguard',
    dotClass: 'bg-slate-400',
    particleClass: ''
  },
  festival_resonance: {
    borderClass: 'border-yellow-400',
    topGlowClass: 'ticker-glow-cards',
    bgClass: 'bg-yellow-50/10',
    dotClass: 'bg-yellow-400',
    particleClass: ''
  },
  festival_surge: {
    borderClass: 'event-border-surge',
    topGlowClass: 'ticker-glow-surge',
    bgClass: 'event-bg-surge',
    dotClass: 'bg-cyan-400',
    particleClass: ''
  },
  festival_vault: {
    borderClass: 'event-border-vault',
    topGlowClass: 'ticker-glow-vault',
    bgClass: 'event-bg-vault',
    dotClass: 'bg-indigo-400',
    particleClass: ''
  },
  festival_fever: {
    borderClass: 'border-orange-500',
    topGlowClass: 'ticker-glow-hellfire',
    bgClass: 'bg-orange-50/10',
    dotClass: 'bg-orange-500',
    particleClass: ''
  },
  festival_sanguine: {
    borderClass: 'event-border-sanguine',
    topGlowClass: 'ticker-glow-sanguine',
    bgClass: 'event-bg-sanguine',
    dotClass: 'bg-red-800',
    particleClass: ''
  },
  // WinStreaks
  winstreak_fever: {
    borderClass: 'border-green-400',
    topGlowClass: '',
    bgClass: 'bg-green-50/10',
    dotClass: 'bg-green-500',
    particleClass: ''
  },
  winstreak_inferno: {
    borderClass: 'border-orange-400',
    topGlowClass: '',
    bgClass: 'bg-orange-50/10',
    dotClass: 'bg-orange-500',
    particleClass: ''
  }
} as const

export const EVENT_FOOTER_CONFIG = {
  // Flash
  LUNAR: { borderClass: 'event-border-lunar', dotClass: 'bg-blue-300' },
  ELECTRIC: { borderClass: 'event-border-electric', dotClass: 'bg-purple-400' },
  CARDS: { borderClass: 'event-border-cards', dotClass: 'bg-yellow-400' },
  HELLFIRE: { borderClass: 'event-border-hellfire', dotClass: 'bg-red-500' },
  // Festivals
  festival_spark: {
    borderClass: 'border-purple-500',
    dotClass: 'bg-purple-400'
  },
  festival_ghost: {
    borderClass: 'event-border-ghost',
    dotClass: 'bg-teal-400'
  },
  festival_safeguard: {
    borderClass: 'event-border-safeguard',
    dotClass: 'bg-slate-400'
  },
  festival_resonance: {
    borderClass: 'border-yellow-400',
    dotClass: 'bg-yellow-400'
  },
  festival_surge: {
    borderClass: 'event-border-surge',
    dotClass: 'bg-cyan-400'
  },
  festival_vault: {
    borderClass: 'event-border-vault',
    dotClass: 'bg-indigo-400'
  },
  festival_fever: {
    borderClass: 'border-orange-500',
    dotClass: 'bg-orange-500'
  },
  festival_sanguine: {
    borderClass: 'event-border-sanguine',
    dotClass: 'bg-red-800'
  },
  // WinStreaks
  winstreak_fever: {
    borderClass: 'border-green-400',
    dotClass: 'bg-green-500'
  },
  winstreak_inferno: {
    borderClass: 'border-orange-400',
    dotClass: 'bg-orange-500'
  }
} as const
