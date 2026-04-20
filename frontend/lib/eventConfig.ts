export type EventThemeKey =
  | 'LUNAR'
  | 'ELECTRIC'
  | 'CARDS'
  | 'HELLFIRE'
  | 'fever'
  | 'inferno'

export const EVENT_BORDER_CONFIG: Record<string, string> = {
  LUNAR: 'event-border-lunar',
  ELECTRIC: 'event-border-electric',
  CARDS: 'event-border-cards',
  HELLFIRE: 'event-border-hellfire',
  fever: 'event-border-fever',
  inferno: 'event-border-inferno'
}

export const EVENT_HEADER_CONFIG = {
  LUNAR: { textClass: 'event-header-lunar', borderClass: 'event-border-lunar' },
  ELECTRIC: {
    textClass: 'event-header-electric',
    borderClass: 'event-border-electric'
  },
  CARDS: { textClass: 'event-header-cards', borderClass: 'event-border-cards' },
  HELLFIRE: {
    textClass: 'event-header-hellfire',
    borderClass: 'event-border-hellfire'
  }
} as const

export const EVENT_TICKER_CONFIG = {
  LUNAR: {
    borderClass: 'event-border-lunar',
    topGlowClass: 'ticker-glow-lunar',
    bgClass: 'bg-gradient-to-r from-blue-50/20 via-white/95 to-blue-50/20',
    dotClass: 'bg-blue-300',
    particleClass: ''
  },
  ELECTRIC: {
    borderClass: 'event-border-electric',
    topGlowClass: 'ticker-glow-electric',
    bgClass: 'bg-gradient-to-r from-purple-50/20 via-white/95 to-purple-50/20',
    dotClass: 'bg-purple-400',
    particleClass: ''
  },
  CARDS: {
    borderClass: 'event-border-cards',
    topGlowClass: 'ticker-glow-cards',
    bgClass: 'bg-gradient-to-r from-yellow-50/20 via-white/95 to-yellow-50/20',
    dotClass: 'bg-yellow-400',
    particleClass: ''
  },
  HELLFIRE: {
    borderClass: 'event-border-hellfire',
    topGlowClass: 'ticker-glow-hellfire',
    bgClass: 'bg-gradient-to-r from-red-50/30 via-white/95 to-red-50/30',
    dotClass: 'bg-red-500',
    particleClass: 'ticker-hellfire-ember'
  }
} as const

export const EVENT_FOOTER_CONFIG = {
  LUNAR: { borderClass: 'event-border-lunar', dotClass: 'bg-blue-300' },
  ELECTRIC: { borderClass: 'event-border-electric', dotClass: 'bg-purple-400' },
  CARDS: { borderClass: 'event-border-cards', dotClass: 'bg-yellow-400' },
  HELLFIRE: { borderClass: 'event-border-hellfire', dotClass: 'bg-red-500' }
} as const
