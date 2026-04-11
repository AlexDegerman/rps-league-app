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
  },
}
