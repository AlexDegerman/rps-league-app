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
  | 'global_tidal_surge'
  | 'global_solar_flare'
  | 'global_cyclone_blitz'
  | 'global_mirage_cataclysm'

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
  },
  // Global Events
  global_tidal_surge: {
    textClass: 'text-cyan-500',
    borderClass: 'border-cyan-400'
  },
  global_solar_flare: {
    textClass: 'text-amber-500',
    borderClass: 'border-amber-400'
  },
  global_cyclone_blitz: {
    textClass: 'text-slate-400',
    borderClass: 'border-slate-400'
  },
  global_mirage_cataclysm: {
    textClass: 'text-amber-600',
    borderClass: 'border-purple-400'
  },
  // Bosses
  boss_hexurion: { textClass: 'text-cyan-400', borderClass: 'border-cyan-500' },
  boss_orphion: {
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500'
  },
  boss_fracturon: {
    textClass: 'text-green-400',
    borderClass: 'border-green-500'
  },
  boss_apexion: {
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500'
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
  },
  // Global Events
  global_tidal_surge: {
    borderClass: 'border-cyan-400',
    topGlowClass: 'ticker-glow-tidal',
    bgClass: 'event-bg-global_tidal_surge',
    dotClass: 'bg-cyan-400',
    particleClass: ''
  },
  global_solar_flare: {
    borderClass: 'border-amber-400',
    topGlowClass: 'ticker-glow-solar',
    bgClass: 'event-bg-global_solar_flare',
    dotClass: 'bg-amber-400',
    particleClass: ''
  },
  global_cyclone_blitz: {
    borderClass: 'border-slate-400',
    topGlowClass: 'ticker-glow-cyclone',
    bgClass: 'event-bg-global_cyclone_blitz',
    dotClass: 'bg-slate-400',
    particleClass: ''
  },
  global_mirage_cataclysm: {
    borderClass: 'border-purple-400',
    topGlowClass: 'ticker-glow-mirage',
    bgClass: 'event-bg-global_mirage_cataclysm',
    dotClass: 'bg-amber-500',
    particleClass: ''
  },
  // Bosses
  boss_hexurion: {
    borderClass: 'border-cyan-400',
    topGlowClass: 'ticker-glow-tidal',
    bgClass: 'event-bg-boss_hexurion',
    dotClass: 'bg-cyan-400',
    particleClass: ''
  },
  boss_orphion: {
    borderClass: 'border-purple-400',
    topGlowClass: 'ticker-glow-electric',
    bgClass: 'event-bg-boss_orphion',
    dotClass: 'bg-purple-400',
    particleClass: ''
  },
  boss_fracturon: {
    borderClass: 'border-green-400',
    topGlowClass: 'ticker-glow-ghost',
    bgClass: 'event-bg-boss_fracturon',
    dotClass: 'bg-green-400',
    particleClass: ''
  },
  boss_apexion: {
    borderClass: 'border-orange-400',
    topGlowClass: 'ticker-glow-hellfire',
    bgClass: 'event-bg-boss_apexion',
    dotClass: 'bg-orange-500',
    particleClass: 'ticker-hellfire-ember'
  }
} as const

export const MODE_CONFIG = {
  flash_lunar: {
    border: 'border-blue-300',
    cardAnim: 'flash-lunar-ring',
    bg: 'bg-gradient-to-br from-white via-white to-blue-50/20',
    glowColor: 'rgba(147,197,253,0.08)',
    dateText: 'text-blue-500/60',
    vsText: 'text-blue-200',
    winnerBadge: 'bg-blue-500',
    winnerText: 'text-blue-700 font-black',
    youWon: 'bg-blue-500'
  },
  flash_electric: {
    border: 'border-purple-300',
    cardAnim: 'flash-electric-ring',
    bg: 'bg-gradient-to-br from-white via-white to-purple-50/20',
    glowColor: 'rgba(192,132,252,0.08)',
    dateText: 'text-purple-500/60',
    vsText: 'text-purple-200',
    winnerBadge: 'bg-purple-500',
    winnerText: 'text-purple-700 font-black',
    youWon: 'bg-purple-500'
  },
  flash_cards: {
    border: 'border-yellow-300',
    cardAnim: 'flash-cards-ring',
    bg: 'bg-gradient-to-br from-white via-white to-yellow-50/20',
    glowColor: 'rgba(252,211,77,0.08)',
    dateText: 'text-yellow-500/60',
    vsText: 'text-yellow-200',
    winnerBadge: 'bg-yellow-500',
    winnerText: 'text-yellow-700 font-black',
    youWon: 'bg-yellow-500'
  },
  flash_hellfire: {
    border: 'border-red-400',
    cardAnim: 'flash-hellfire-ring',
    bg: 'bg-gradient-to-br from-white via-white to-red-100/20',
    glowColor: 'rgba(239,68,68,0.08)',
    dateText: 'text-red-500/60',
    vsText: 'text-red-200',
    winnerBadge: 'bg-red-600',
    winnerText: 'text-red-800 font-black',
    youWon: 'bg-red-600'
  },
  festival_spark: {
    border: 'border-purple-300',
    cardAnim: 'spark-ring',
    bg: 'bg-gradient-to-br from-white via-white to-purple-50/20',
    glowColor: 'rgba(192,132,252,0.08)',
    dateText: 'text-purple-500/60',
    vsText: 'text-purple-200',
    winnerBadge: 'bg-purple-500',
    winnerText: 'text-purple-700 font-black',
    youWon: 'bg-purple-500'
  },
  festival_ghost: {
    border: 'border-teal-300',
    cardAnim: 'ghost-ring',
    bg: 'bg-gradient-to-br from-white via-white to-teal-50/20',
    glowColor: 'rgba(77,208,196,0.08)',
    dateText: 'text-teal-500/60',
    vsText: 'text-teal-200',
    winnerBadge: 'bg-teal-500',
    winnerText: 'text-teal-700 font-black',
    youWon: 'bg-teal-500'
  },
  festival_safeguard: {
    border: 'border-slate-300',
    cardAnim: 'safeguard-ring',
    bg: 'bg-gradient-to-br from-white via-white to-slate-50/20',
    glowColor: 'rgba(148,163,184,0.08)',
    dateText: 'text-slate-500/60',
    vsText: 'text-slate-200',
    winnerBadge: 'bg-slate-500',
    winnerText: 'text-slate-700 font-black',
    youWon: 'bg-slate-500'
  },
  festival_resonance: {
    border: 'border-yellow-300',
    cardAnim: 'resonance-ring',
    bg: 'bg-gradient-to-br from-white via-white to-yellow-50/20',
    glowColor: 'rgba(252,211,77,0.08)',
    dateText: 'text-yellow-500/60',
    vsText: 'text-yellow-200',
    winnerBadge: 'bg-yellow-500',
    winnerText: 'text-yellow-700 font-black',
    youWon: 'bg-yellow-500'
  },
  festival_surge: {
    border: 'border-cyan-300',
    cardAnim: 'surge-ring',
    bg: 'bg-gradient-to-br from-white via-white to-cyan-50/20',
    glowColor: 'rgba(34,211,238,0.08)',
    dateText: 'text-cyan-500/60',
    vsText: 'text-cyan-200',
    winnerBadge: 'bg-cyan-500',
    winnerText: 'text-cyan-700 font-black',
    youWon: 'bg-cyan-500'
  },
  festival_vault: {
    border: 'border-indigo-300',
    cardAnim: 'vault-ring',
    bg: 'bg-gradient-to-br from-white via-white to-indigo-50/20',
    glowColor: 'rgba(129,140,248,0.08)',
    dateText: 'text-indigo-500/60',
    vsText: 'text-indigo-200',
    winnerBadge: 'bg-indigo-500',
    winnerText: 'text-indigo-700 font-black',
    youWon: 'bg-indigo-500'
  },
  festival_fever: {
    border: 'border-orange-300',
    cardAnim: 'fever-ring',
    bg: 'bg-gradient-to-br from-white via-white to-orange-50/20',
    glowColor: 'rgba(251,146,60,0.08)',
    dateText: 'text-orange-500/60',
    vsText: 'text-orange-200',
    winnerBadge: 'bg-orange-500',
    winnerText: 'text-orange-700 font-black',
    youWon: 'bg-orange-500'
  },
  festival_sanguine: {
    border: 'border-red-600',
    cardAnim: 'sanguine-ring',
    bg: 'bg-gradient-to-br from-white via-white to-red-100/20',
    glowColor: 'rgba(153,27,27,0.08)',
    dateText: 'text-red-600/60',
    vsText: 'text-red-300',
    winnerBadge: 'bg-red-700',
    winnerText: 'text-red-900 font-black',
    youWon: 'bg-red-700'
  },
  winstreak_fever: {
    border: 'border-green-300',
    cardAnim: 'fever-ring',
    bg: 'bg-gradient-to-br from-white via-white to-green-50/20',
    glowColor: 'rgba(74,222,128,0.08)',
    dateText: 'text-green-500/60',
    vsText: 'text-green-200',
    winnerBadge: 'bg-green-500',
    winnerText: 'text-green-700 font-black',
    youWon: 'bg-green-500'
  },
  winstreak_inferno: {
    border: 'border-orange-300',
    cardAnim: 'inferno-ring',
    bg: 'bg-gradient-to-br from-white via-white to-orange-50/20',
    glowColor: 'rgba(251,146,60,0.08)',
    dateText: 'text-orange-500/60',
    vsText: 'text-orange-200',
    winnerBadge: 'bg-orange-500',
    winnerText: 'text-orange-700 font-black',
    youWon: 'bg-orange-500'
  },
  global_tidal_surge: {
    border: 'border-cyan-300',
    cardAnim: 'tidal-ring',
    bg: 'bg-gradient-to-br from-white via-white to-cyan-50/20',
    glowColor: 'rgba(34,211,238,0.08)',
    dateText: 'text-cyan-500/60',
    vsText: 'text-cyan-200',
    winnerBadge: 'bg-cyan-500',
    winnerText: 'text-cyan-700 font-black',
    youWon: 'bg-cyan-500'
  },
  global_solar_flare: {
    border: 'border-amber-300',
    cardAnim: 'solar-ring',
    bg: 'bg-gradient-to-br from-white via-white to-amber-50/20',
    glowColor: 'rgba(245,158,11,0.08)',
    dateText: 'text-amber-500/60',
    vsText: 'text-amber-200',
    winnerBadge: 'bg-amber-500',
    winnerText: 'text-amber-700 font-black',
    youWon: 'bg-amber-500'
  },
  global_cyclone_blitz: {
    border: 'border-slate-300',
    cardAnim: 'cyclone-ring',
    bg: 'bg-gradient-to-br from-white via-white to-slate-50/20',
    glowColor: 'rgba(148,163,184,0.08)',
    dateText: 'text-slate-500/60',
    vsText: 'text-slate-300',
    winnerBadge: 'bg-slate-500',
    winnerText: 'text-slate-700 font-black',
    youWon: 'bg-slate-500'
  },
  global_mirage_cataclysm: {
    border: 'border-purple-300',
    cardAnim: 'mirage-ring',
    bg: 'bg-gradient-to-br from-white via-white to-purple-50/20',
    glowColor: 'rgba(168,85,247,0.06)',
    dateText: 'text-purple-400/60',
    vsText: 'text-amber-200',
    winnerBadge: 'bg-amber-500',
    winnerText: 'text-amber-700 font-black',
    youWon: 'bg-amber-500'
  }
} as const
