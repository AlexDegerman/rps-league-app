import { BonusStyle, BonusTier } from '@/types/rps'

export const BONUS_TIER_STYLES: Record<BonusTier, BonusStyle> = {
  MYTHICAL: {
    label: 'Mythical',
    color: 'text-red-400',
    bg: 'bg-red-50',
    cardClass:
      'border-red-300 shadow-[0_0_30px_rgba(220,38,38,0.5)] bg-gradient-to-br from-white via-red-50/30 to-white animate-[pulsate_0.8s_ease-in-out_infinite]',
    auraClass: 'aura-mythical',
    amountColor: 'text-green-400'
  },
  LEGENDARY: {
    label: 'Legendary',
    color: 'text-amber-700',
    bg: 'bg-[#fdfcf0]',
    cardClass: 'card-legendary-premium',
    auraClass: 'aura-legendary',
    amountColor: 'text-green-400'
  },
  EPIC: {
    label: 'Epic',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    cardClass:
      'border-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-gradient-to-br from-white via-purple-50/30 to-white',
    auraClass: 'aura-epic',
    amountColor: 'text-green-400'
  },
  RARE: {
    label: 'Rare',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    cardClass: 'border-blue-200 shadow-md bg-white',
    auraClass: 'aura-rare',
    amountColor: 'text-green-400'
  },
  COMMON: {
    label: 'Common',
    color: 'text-slate-600',
    bg: 'bg-slate-100/50',
    cardClass: 'card-grey-wash',
    auraClass: 'aura-common',
    amountColor: 'text-green-400'
  }
}

export const EVENT_CARD: Record<
  string,
  {
    cardClass: string
    label: string
    emoji: string
    textClass: string
    multLabel: string
  }
> = {
  // FLASH EVENTS
  LUNAR: {
    cardClass: 'event-card-base event-card-lunar',
    label: "Moon's Blessing",
    emoji: '🌙',
    textClass: 'lunar-badge-text',
    multLabel: 'x3'
  },
  ELECTRIC: {
    cardClass: 'event-card-base event-card-electric',
    label: 'Electric Surge',
    emoji: '⚡',
    textClass: 'electric-badge-text',
    multLabel: 'x3'
  },
  CARDS: {
    cardClass: 'event-card-base event-card-cards',
    label: 'Luck in the Card',
    emoji: '🃏',
    textClass: 'cards-badge-text',
    multLabel: 'x1.5 + LEG'
  },
  HELLFIRE: {
    cardClass: 'event-card-base event-card-hellfire',
    label: 'Hellfire Event',
    emoji: '🔥',
    textClass: 'streak-fire-text text-red-300',
    multLabel: 'x3'
  },

  // FESTIVALS
  SPARK: {
    cardClass: 'event-card-base event-card-spark',
    label: 'Spark Festival',
    emoji: '⚡',
    textClass: 'text-purple-300',
    multLabel: 'FLASH SYNC'
  },
  GHOST: {
    cardClass: 'event-card-base event-card-ghost',
    label: 'Ghost Festival',
    emoji: '👻',
    textClass: 'text-teal-200',
    multLabel: '1.2x ECHO'
  },
  SAFEGUARD: {
    cardClass: 'event-card-base event-card-safeguard',
    label: 'Safeguard Festival',
    emoji: '🛡️',
    textClass: 'text-slate-300',
    multLabel: '40% LOSS DEDUCTION'
  },
  RESONANCE: {
    cardClass: 'event-card-base event-card-resonance',
    label: 'Resonance Festival',
    emoji: '🔮',
    textClass: 'text-yellow-200',
    multLabel: 'BNS FLOOR'
  },
  SURGE: {
    cardClass: 'event-card-base event-card-surge',
    label: 'Surge Festival',
    emoji: '⚡',
    textClass: 'text-cyan-200',
    multLabel: '2x WINS'
  },
  VAULT: {
    cardClass: 'event-card-base event-card-vault',
    label: 'Vault Festival',
    emoji: '🏛️',
    textClass: 'text-indigo-200',
    multLabel: '2x RELICS'
  },
  FEVER_FESTIVAL: {
    cardClass: 'event-card-base event-card-fever-festival',
    label: 'Fever Festival',
    emoji: '🔥',
    textClass: 'text-orange-300',
    multLabel: 'STRK AEGIS'
  },
  SANGUINE: {
    cardClass: 'event-card-base event-card-sanguine',
    label: 'Sanguine Festival',
    emoji: '🩸',
    textClass: 'text-red-400',
    multLabel: '100% WIN'
  }
}

export const MODE_CONFIG = {
  // FLASH MODES
  flash_lunar: {
    border: 'border-blue-200',
    cardAnim: 'lunar-ring',
    bg: 'bg-gradient-to-br from-white via-white to-blue-50/20',
    glowColor: 'rgba(190,227,248,0.06)',
    dateText: 'text-blue-400/60',
    vsText: 'text-blue-200',
    winnerBadge: 'bg-blue-400',
    winnerText: 'text-blue-600 font-black',
    youWon: 'bg-blue-400'
  },
  flash_electric: {
    border: 'border-purple-300',
    cardAnim: 'electric-ring',
    bg: 'bg-gradient-to-br from-white via-white to-purple-50/20',
    glowColor: 'rgba(159,122,234,0.06)',
    dateText: 'text-purple-400/60',
    vsText: 'text-purple-200',
    winnerBadge: 'bg-purple-500',
    winnerText: 'text-purple-600 font-black',
    youWon: 'bg-purple-500'
  },
  flash_cards: {
    border: 'border-yellow-300',
    cardAnim: 'cards-ring',
    bg: 'bg-gradient-to-br from-white via-white to-yellow-50/20',
    glowColor: 'rgba(236,201,75,0.06)',
    dateText: 'text-yellow-600/60',
    vsText: 'text-yellow-300',
    winnerBadge: 'bg-yellow-400',
    winnerText: 'text-yellow-600 font-black',
    youWon: 'bg-yellow-400'
  },
  flash_hellfire: {
    border: 'border-red-400',
    cardAnim: 'hellfire-ring',
    bg: 'bg-gradient-to-br from-white via-white to-red-50/20',
    glowColor: 'rgba(197,48,48,0.06)',
    dateText: 'text-red-400/60',
    vsText: 'text-red-200',
    winnerBadge: 'bg-red-500',
    winnerText: 'text-red-600 font-black',
    youWon: 'bg-red-500'
  },

  // FESTIVAL MODES
  festival_spark: {
    border: 'border-purple-500',
    cardAnim: 'spark-ring',
    bg: 'bg-white',
    glowColor: 'rgba(168,85,247,0.12)',
    dateText: 'text-purple-400',
    vsText: 'text-purple-300',
    winnerBadge: 'bg-purple-600',
    winnerText: 'text-purple-700 font-black',
    youWon: 'bg-purple-600'
  },
  festival_ghost: {
    border: 'border-teal-200',
    cardAnim: 'ghost-ring',
    bg: 'bg-white',
    glowColor: 'rgba(77,208,196,0.1)',
    dateText: 'text-teal-400',
    vsText: 'text-teal-200',
    winnerBadge: 'bg-teal-400',
    winnerText: 'text-teal-600 font-black',
    youWon: 'bg-teal-400'
  },
  festival_safeguard: {
    border: 'border-slate-400',
    cardAnim: 'safeguard-ring',
    bg: 'bg-slate-50',
    glowColor: 'rgba(100,116,139,0.08)',
    dateText: 'text-slate-500',
    vsText: 'text-slate-300',
    winnerBadge: 'bg-slate-600',
    winnerText: 'text-slate-700 font-black',
    youWon: 'bg-slate-600'
  },
  festival_resonance: {
    border: 'border-yellow-400',
    cardAnim: 'resonance-ring',
    bg: 'bg-white',
    glowColor: 'rgba(245,158,11,0.1)',
    dateText: 'text-yellow-600',
    vsText: 'text-yellow-300',
    winnerBadge: 'bg-amber-500',
    winnerText: 'text-amber-700 font-black',
    youWon: 'bg-amber-500'
  },
  festival_surge: {
    border: 'border-cyan-400',
    cardAnim: 'surge-ring',
    bg: 'bg-white',
    glowColor: 'rgba(34,211,238,0.15)',
    dateText: 'text-cyan-500',
    vsText: 'text-cyan-300',
    winnerBadge: 'bg-cyan-500',
    winnerText: 'text-cyan-700 font-black',
    youWon: 'bg-cyan-500'
  },
  festival_vault: {
    border: 'border-indigo-600',
    cardAnim: 'vault-ring',
    bg: 'bg-indigo-50/30',
    glowColor: 'rgba(59,91,219,0.1)',
    dateText: 'text-indigo-600',
    vsText: 'text-indigo-300',
    winnerBadge: 'bg-indigo-700',
    winnerText: 'text-indigo-800 font-black',
    youWon: 'bg-indigo-700'
  },
  festival_fever: {
    border: 'border-orange-500',
    cardAnim: 'fever-festival-ring',
    bg: 'bg-orange-50/20',
    glowColor: 'rgba(249,115,22,0.15)',
    dateText: 'text-orange-600',
    vsText: 'text-orange-400',
    winnerBadge: 'bg-orange-600',
    winnerText: 'text-orange-700 font-black',
    youWon: 'bg-orange-600'
  },
  festival_sanguine: {
    border: 'border-red-900',
    cardAnim: 'sanguine-ring',
    bg: 'bg-red-950/5',
    glowColor: 'rgba(153,27,27,0.2)',
    dateText: 'text-red-800',
    vsText: 'text-red-500',
    winnerBadge: 'bg-red-900',
    winnerText: 'text-red-900 font-black',
    youWon: 'bg-red-900'
  },

  // WINSTREAK MODES
  winstreak_inferno: {
    border: 'border-orange-300',
    cardAnim: 'card-inferno',
    bg: 'bg-gradient-to-br from-white via-white to-orange-50/30',
    glowColor: 'rgba(249,115,22,0.06)',
    dateText: 'text-orange-400/60',
    vsText: 'text-orange-200',
    winnerBadge: 'bg-red-500',
    winnerText: 'text-red-600 font-black',
    youWon: 'bg-red-500'
  },
  winstreak_fever: {
    border: 'border-green-300',
    cardAnim: 'card-fever',
    bg: 'bg-gradient-to-br from-white via-white to-green-50/30',
    glowColor: 'rgba(34,197,94,0.06)',
    dateText: 'text-green-600/60',
    vsText: 'text-green-200',
    winnerBadge: 'bg-green-500',
    winnerText: 'text-green-600 font-black',
    youWon: 'bg-green-500'
  },

  default: {
    border: 'border-gray-100',
    cardAnim: '',
    bg: 'bg-white',
    glowColor: null,
    dateText: 'text-gray-400',
    vsText: 'text-gray-300',
    winnerBadge: 'bg-green-500',
    winnerText: 'text-green-600 font-bold',
    youWon: 'bg-green-500'
  }
}

export const TIER_THRESHOLDS = [
  { label: 'Octovigintillion', cls: 'g-ovg', min: 10n ** 87n },
  { label: 'Septenvigintillion', cls: 'g-spv', min: 10n ** 84n },
  { label: 'Sexvigintillion', cls: 'g-svg', min: 10n ** 81n },
  { label: 'Quinvigintillion', cls: 'g-qiv', min: 10n ** 78n },
  { label: 'Quattuorvigintillion', cls: 'g-qvg', min: 10n ** 75n },
  { label: 'Trevigintillion', cls: 'g-tvg', min: 10n ** 72n },
  { label: 'Duovigintillion', cls: 'g-dvg', min: 10n ** 69n },
  { label: 'Unvigintillion', cls: 'g-uvg', min: 10n ** 66n },
  { label: 'Vigintillion', cls: 'g-vg', min: 10n ** 63n },
  { label: 'Novemdecillion', cls: 'g-nod', min: 10n ** 60n },
  { label: 'Octodecillion', cls: 'g-ocd', min: 10n ** 57n },
  { label: 'Septendecillion', cls: 'g-spd', min: 10n ** 54n },
  { label: 'Sexdecillion', cls: 'g-sxd', min: 10n ** 51n },
  { label: 'Quindecillion', cls: 'g-qid', min: 10n ** 48n },
  { label: 'Quattuordecillion', cls: 'g-qad', min: 10n ** 45n },
  { label: 'Tredecillion', cls: 'g-td', min: 10n ** 42n },
  { label: 'Duodecillion', cls: 'g-dd', min: 10n ** 39n },
  { label: 'Undecillion', cls: 'g-ud', min: 10n ** 36n },
  { label: 'Decillion', cls: 'g-dc', min: 10n ** 33n },
  { label: 'Nonillion', cls: 'g-no', min: 10n ** 30n },
  { label: 'Octillion', cls: 'g-oc', min: 10n ** 27n },
  { label: 'Septillion', cls: 'g-sp', min: 10n ** 24n },
  { label: 'Sextillion', cls: 'g-sx', min: 10n ** 21n },
  { label: 'Quintillion', cls: 'g-qi', min: 10n ** 18n },
  { label: 'Quadrillion', cls: 'g-qa', min: 10n ** 15n },
  { label: 'Trillion', cls: 'g-t', min: 10n ** 12n },
  { label: '100 Billion', cls: 'g-b3', min: 100_000_000_000n },
  { label: '10 Billion', cls: 'g-b2', min: 10_000_000_000n },
  { label: 'Billion', cls: 'g-b1', min: 1_000_000_000n },
  { label: '100 Million', cls: 'g-m3', min: 100_000_000n },
  { label: '10 Million', cls: 'g-m2', min: 10_000_000n },
  { label: 'Million', cls: 'g-m1', min: 1_000_000n }
] as const

export const ASCENSION_THRESHOLD = 999n * 10n ** 87n
