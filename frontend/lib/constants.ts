import { BonusStyle, BonusTier } from '@/types/rps'

export const BONUS_TIER_STYLES: Record<BonusTier, BonusStyle> = {
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

export const FLASH_EVENT_CARD: Record<
  string,
  {
    cardClass: string
    label: string
    emoji: string
    textClass: string
    multLabel: string
  }
> = {
  LUNAR: {
    cardClass: 'event-card-base event-card-lunar',
    label: "Moon's Blessing",
    emoji: '🌙',
    textClass: 'lunar-badge-text',
    multLabel: 'x5'
  },
  ELECTRIC: {
    cardClass: 'event-card-base event-card-electric',
    label: 'Electric Surge',
    emoji: '⚡',
    textClass: 'electric-badge-text',
    multLabel: 'x5'
  },
  CARDS: {
    cardClass: 'event-card-base event-card-cards',
    label: 'Luck in the Card',
    emoji: '🃏',
    textClass: 'cards-badge-text',
    multLabel: 'LEG'
  },
  HELLFIRE: {
    cardClass: 'event-card-base event-card-hellfire',
    label: 'Hellfire Event',
    emoji: '🔥',
    textClass: 'streak-fire-text text-red-300',
    multLabel: 'x5'
  }
}

export const MODE_CONFIG = {
  flash_lunar: {
    border: 'border-blue-200',
    cardAnim: 'lunar-ring',
    bg: 'bg-gradient-to-br from-white via-white to-blue-50/20',
    glowColor: 'rgba(190,227,248,0.06)',
    dateText: 'text-blue-400/60',
    vsText: 'text-blue-200',
    winnerBadge: 'bg-gradient-to-r from-blue-400 to-cyan-400',
    winnerText:
      'text-blue-600 font-black hover:text-blue-700 decoration-blue-300',
    youWon: 'bg-gradient-to-r from-blue-400 to-cyan-400'
  },
  flash_electric: {
    border: 'border-purple-300',
    cardAnim: 'electric-ring',
    bg: 'bg-gradient-to-br from-white via-white to-purple-50/20',
    glowColor: 'rgba(159,122,234,0.06)',
    dateText: 'text-purple-400/60',
    vsText: 'text-purple-200',
    winnerBadge: 'bg-gradient-to-r from-purple-500 to-violet-400',
    winnerText:
      'text-purple-600 font-black hover:text-purple-700 decoration-purple-300',
    youWon: 'bg-gradient-to-r from-purple-500 to-violet-400'
  },
  flash_cards: {
    border: 'border-yellow-300',
    cardAnim: 'cards-ring',
    bg: 'bg-gradient-to-br from-white via-white to-yellow-50/20',
    glowColor: 'rgba(236,201,75,0.06)',
    dateText: 'text-yellow-600/60',
    vsText: 'text-yellow-300',
    winnerBadge: 'bg-gradient-to-r from-yellow-400 to-amber-400',
    winnerText:
      'text-yellow-600 font-black hover:text-yellow-700 decoration-yellow-300',
    youWon: 'bg-gradient-to-r from-yellow-400 to-amber-400'
  },
  flash_hellfire: {
    border: 'border-red-400',
    cardAnim: 'hellfire-ring',
    bg: 'bg-gradient-to-br from-white via-white to-red-50/20',
    glowColor: 'rgba(197,48,48,0.06)',
    dateText: 'text-red-400/60',
    vsText: 'text-red-200',
    winnerBadge: 'bg-gradient-to-r from-red-500 to-rose-500',
    winnerText: 'text-red-600 font-black hover:text-red-700 decoration-red-300',
    youWon: 'bg-gradient-to-r from-red-500 to-rose-500'
  },
  inferno: {
    border: 'border-orange-300',
    cardAnim: 'card-inferno',
    bg: 'bg-gradient-to-br from-white via-white to-orange-50/30',
    glowColor: 'rgba(249,115,22,0.06)',
    dateText: 'text-orange-400/60',
    vsText: 'text-orange-200',
    winnerBadge: 'bg-gradient-to-r from-orange-500 to-red-500',
    winnerText:
      'text-orange-600 font-black hover:text-orange-700 decoration-orange-300',
    youWon: 'bg-gradient-to-r from-orange-500 to-red-500'
  },
  fever: {
    border: 'border-green-300',
    cardAnim: 'card-fever',
    bg: 'bg-gradient-to-br from-white via-white to-green-50/30',
    glowColor: 'rgba(34,197,94,0.06)',
    dateText: 'text-green-600/60',
    vsText: 'text-green-200',
    winnerBadge: 'bg-gradient-to-r from-green-500 to-emerald-400',
    winnerText:
      'text-green-600 font-black hover:text-green-700 decoration-green-300',
    youWon: 'bg-gradient-to-r from-green-500 to-emerald-400'
  },
  default: {
    border: 'border-gray-100',
    cardAnim: '',
    bg: 'bg-white',
    glowColor: null,
    dateText: 'text-gray-400',
    vsText: 'text-gray-300',
    winnerBadge: 'bg-green-500',
    winnerText: 'text-green-600 font-bold hover:decoration-green-600',
    youWon: 'bg-green-500'
  }
}

