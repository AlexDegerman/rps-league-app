import { BonusStyle, BonusTier } from '@/types/prediction'

export const ASCENSION_THRESHOLD = 999n * 10n ** 162n

export const TIER_THRESHOLDS = [
  { label: 'Trequinquagintillion', cls: 'g-tqgs', min: 10n ** 162n },
  { label: 'Duoquinquagintillion', cls: 'g-dqgs', min: 10n ** 159n },
  { label: 'Unquinquagintillion', cls: 'g-uqgs', min: 10n ** 156n },
  { label: 'Quinquagintillion', cls: 'g-qg', min: 10n ** 153n },
  { label: 'Novemquadragintillion', cls: 'g-noqg', min: 10n ** 150n },
  { label: 'Octoquadragintillion', cls: 'g-ocqg', min: 10n ** 147n },
  { label: 'Septenquadragintillion', cls: 'g-spqg', min: 10n ** 144n },
  { label: 'Sexquadragintillion', cls: 'g-sxqg', min: 10n ** 141n },
  { label: 'Quinquadragintillion', cls: 'g-qnqg', min: 10n ** 138n },
  { label: 'Quattuorquadragintillion', cls: 'g-qqg', min: 10n ** 135n },
  { label: 'Tresquadragintillion', cls: 'g-tqg', min: 10n ** 132n },
  { label: 'Duoquadragintillion', cls: 'g-dqg', min: 10n ** 129n },
  { label: 'Unquadragintillion', cls: 'g-uqg', min: 10n ** 126n },
  { label: 'Quadragintillion', cls: 'g-qag', min: 10n ** 123n },
  { label: 'Novemtrigintillion', cls: 'g-ntg', min: 10n ** 120n },
  { label: 'Octotrigintillion', cls: 'g-otg', min: 10n ** 117n },
  { label: 'Septentrigintillion', cls: 'g-stg', min: 10n ** 114n },
  { label: 'Sextrigintillion', cls: 'g-str', min: 10n ** 111n },
  { label: 'Quintrigintillion', cls: 'g-qntr', min: 10n ** 108n },
  { label: 'Quattuortrigintillion', cls: 'g-qtr', min: 10n ** 105n },
  { label: 'Trestrigintillion', cls: 'g-ttr', min: 10n ** 102n },
  { label: 'Duotrigintillion', cls: 'g-dtr', min: 10n ** 99n },
  { label: 'Untrigintillion', cls: 'g-utr', min: 10n ** 96n },
  { label: 'Trigintillion', cls: 'g-trg', min: 10n ** 93n },
  { label: 'Novemvigintillion', cls: 'g-nvg', min: 10n ** 90n },
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