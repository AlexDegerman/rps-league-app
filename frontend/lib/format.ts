import type { Match } from '../types/rps'

// Fallback conversion in case a raw timestamp reaches the frontend unnormalized.
// Under normal conditions all timestamps are normalized to milliseconds on ingest.
const toMs = (timestamp: number): number =>
  timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp

// Formats a UTC millisecond timestamp as a human-readable date and time.
// Always displayed in UTC to match the API's timezone assumption.
export const formatDateTime = (timestamp: number): string => {
  return new Date(toMs(timestamp)).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Determines the result of a match from a specific player's perspective.
export const getPlayerResult = (
  match: Match,
  playerName: string
): 'WIN' | 'LOSE' => {
  const { playerA, playerB } = match
  const aWins =
    (playerA.played === 'ROCK' && playerB.played === 'SCISSORS') ||
    (playerA.played === 'SCISSORS' && playerB.played === 'PAPER') ||
    (playerA.played === 'PAPER' && playerB.played === 'ROCK')

  if (playerName === playerA.name) return aWins ? 'WIN' : 'LOSE'
  return aWins ? 'LOSE' : 'WIN'
}

// Maps a match result to its corresponding Tailwind background color class.
export const resultColor = (result: 'WIN' | 'LOSE'): string => {
  if (result === 'WIN') return 'bg-green-500'
  if (result === 'LOSE') return 'bg-red-500'
  return 'bg-orange-400'
}

// Converts shorthand strings (400k, 1.5m, 2b) into raw integers.
export const parseShorthand = (val: string): bigint => {
  const clean = val.toLowerCase().replace(/,/g, '').trim()
  if (!clean) return 0n

  const match = clean.match(
    /^(\d+\.?\d*)(k|m|b|t|qa|qi|sx|sp|oc|no|dc|ud|dd|td|qad|qid|sxd|spd|ocd|nod|vg)?$/
  )
  if (!match) return 0n

  const [, numStr, suffix] = match

  const multipliers: Record<string, bigint> = {
    k: 10n ** 3n,
    m: 10n ** 6n,
    b: 10n ** 9n,
    t: 10n ** 12n,
    qa: 10n ** 15n,
    qi: 10n ** 18n,
    sx: 10n ** 21n,
    sp: 10n ** 24n,
    oc: 10n ** 27n,
    no: 10n ** 30n,
    dc: 10n ** 33n,
    ud: 10n ** 36n,
    dd: 10n ** 39n,
    td: 10n ** 42n,
    qad: 10n ** 45n,
    qid: 10n ** 48n,
    sxd: 10n ** 51n,
    spd: 10n ** 54n,
    ocd: 10n ** 57n,
    nod: 10n ** 60n,
    vg: 10n ** 63n
  }

  if (suffix && multipliers[suffix]) {
    const multiplier = multipliers[suffix]

    // Check if there is a decimal to avoid floating point precision issues at high tiers
    if (numStr.includes('.')) {
      const [whole, decimal] = numStr.split('.')
      const decimalBig = BigInt(decimal)
      const decimalLen = BigInt(decimal.length)

      // Calculate: (whole * multiplier) + (decimal * multiplier / 10^decimalLen)
      const wholePart = BigInt(whole) * multiplier
      const fractionPart = (decimalBig * multiplier) / 10n ** decimalLen
      return wholePart + fractionPart
    }

    return BigInt(numStr) * multiplier
  }

  return BigInt(Math.floor(parseFloat(numStr)))
}

export const formatTickerPoints = (n: number | bigint | string): string => {
  const bigN = BigInt(n);
  const absN = bigN < 0n ? -bigN : bigN;
  const sign = bigN < 0n ? '-' : '';

  const tiers = [
    { threshold: 10n ** 63n, symbol: 'Vg' },
    { threshold: 10n ** 60n, symbol: 'Nod' },
    { threshold: 10n ** 57n, symbol: 'Ocd' },
    { threshold: 10n ** 54n, symbol: 'Spd' },
    { threshold: 10n ** 51n, symbol: 'Sxd' },
    { threshold: 10n ** 48n, symbol: 'Qid' },
    { threshold: 10n ** 45n, symbol: 'Qad' },
    { threshold: 10n ** 42n, symbol: 'Td' },
    { threshold: 10n ** 39n, symbol: 'Dd' },
    { threshold: 10n ** 36n, symbol: 'Ud' },
    { threshold: 10n ** 33n, symbol: 'Dc' },
    { threshold: 10n ** 30n, symbol: 'No' },
    { threshold: 10n ** 27n, symbol: 'Oc' },
    { threshold: 10n ** 24n, symbol: 'Sp' },
    { threshold: 10n ** 21n, symbol: 'Sx' },
    { threshold: 10n ** 18n, symbol: 'Qi' },
    { threshold: 10n ** 15n, symbol: 'Qa' },
    { threshold: 10n ** 12n, symbol: 'T' },
    { threshold: 10n ** 9n, symbol: 'B' },
    { threshold: 10n ** 6n, symbol: 'M' }
  ];

  for (const { threshold, symbol } of tiers) {
    if (absN >= threshold) {
      const val = Number(absN) / Number(threshold);
      return `${sign}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}${symbol}`;
    }
  }

  return sign + absN.toLocaleString('en-US');
}

// Formats large point values into human-readable strings.
export const formatPoints = (
  n: number | bigint | string,
  useK: boolean = false
): { display: string; full: string; capped: boolean } => {
  let bigN: bigint
  try {
    bigN = BigInt(typeof n === 'string' ? n.split('.')[0].replace(/,/g, '') : n)
  } catch {
    return { display: '0', full: '0', capped: false }
  }
  if (bigN === 0n) return { display: '0', full: '0', capped: false }

  const absN = bigN < 0n ? -bigN : bigN
  const sign = bigN < 0n ? '-' : ''

  const tiers = [
    { threshold: 10n ** 63n, symbol: 'Vg' },
    { threshold: 10n ** 60n, symbol: 'Nod' },
    { threshold: 10n ** 57n, symbol: 'Ocd' },
    { threshold: 10n ** 54n, symbol: 'Spd' },
    { threshold: 10n ** 51n, symbol: 'Sxd' },
    { threshold: 10n ** 48n, symbol: 'Qid' },
    { threshold: 10n ** 45n, symbol: 'Qad' },
    { threshold: 10n ** 42n, symbol: 'Td' },
    { threshold: 10n ** 39n, symbol: 'Dd' },
    { threshold: 10n ** 36n, symbol: 'Ud' },
    { threshold: 10n ** 33n, symbol: 'Dc' },
    { threshold: 10n ** 30n, symbol: 'No' },
    { threshold: 10n ** 27n, symbol: 'Oc' },
    { threshold: 10n ** 24n, symbol: 'Sp' },
    { threshold: 10n ** 21n, symbol: 'Sx' },
    { threshold: 10n ** 18n, symbol: 'Qi' },
    { threshold: 10n ** 15n, symbol: 'Qa' },
    { threshold: 10n ** 12n, symbol: 'T' },
    { threshold: 10n ** 9n, symbol: 'B' },
    { threshold: 10n ** 6n, symbol: 'M' }
  ]

  const getFormattedValue = (value: bigint, divisor: bigint, sym: string) => {
    const whole = value / divisor
    if (whole >= 100n) return `${sign}${whole}${sym}`
    const unit = divisor / 10n
    const tenth = unit > 0n ? (value % divisor) / unit : 0n
    const decimalStr = tenth > 0n ? `.${tenth}` : ''
    return `${sign}${whole}${decimalStr}${sym}`
  }
  
  if (useK && absN >= 1000n && absN < 1000000n) {
    const full = getFormattedValue(absN, 1000n, 'K')
    const whole = absN / 1000n
    const capped = whole >= 10000n
    return { display: capped ? `${sign}9999+K` : full, full, capped }
  }

  for (const { threshold, symbol } of tiers) {
    if (absN >= threshold) {
      const full = getFormattedValue(absN, threshold, symbol)
      const whole = absN / threshold
      const capped = whole >= 10000n
      return { display: capped ? `${sign}9999+${symbol}` : full, full, capped }
    }
  }

  const full = `${sign}${new Intl.NumberFormat('de-DE').format(absN)}`
  return { display: full, full, capped: false }
}

export const getFullNumberName = (n: number | bigint | string): string => {
  const bigN = BigInt(n)
  const absN = bigN < 0n ? -bigN : bigN

  const names = [
    { t: 63, n: 'Vigintillion' },
    { t: 60, n: 'Novemdecillion' },
    { t: 57, n: 'Octodecillion' },
    { t: 54, n: 'Septendecillion' },
    { t: 51, n: 'Sexdecillion' },
    { t: 48, n: 'Quindecillion' },
    { t: 45, n: 'Quattuordecillion' },
    { t: 42, n: 'Tredecillion' },
    { t: 39, n: 'Duodecillion' },
    { t: 36, n: 'Undecillion' },
    { t: 33, n: 'Decillion' },
    { t: 30, n: 'Nonillion' },
    { t: 27, n: 'Octillion' },
    { t: 24, n: 'Septillion' },
    { t: 21, n: 'Sextillion' },
    { t: 18, n: 'Quintillion' },
    { t: 15, n: 'Quadrillion' },
    { t: 12, n: 'Trillion' },
    { t: 9, n: 'Billion' },
    { t: 6, n: 'Million' }
  ]

  for (const { t, n } of names) {
    if (absN >= 10n ** BigInt(t)) return n
  }
  return 'Points'
}

const ZERO = 0n
const VIGINTILLION = 10n ** 63n
const NOVEMDECILLION = 10n ** 60n
const OCTODECILLION = 10n ** 57n
const SEPTENDECILLION = 10n ** 54n
const SEXDECILLION = 10n ** 51n
const QUINDECILLION = 10n ** 48n
const QUATTUORDECILLION = 10n ** 45n
const TREDECILLION = 10n ** 42n
const DUODECILLION = 10n ** 39n
const UNDECILLION = 10n ** 36n
const NONILLION = 10n ** 30n
const OCTILLION = 10n ** 27n
const SEPTILLION = 10n ** 24n
const SEXTILLION = 10n ** 21n
const QUINTILLION = 10n ** 18n
const QUADRILLION = 10n ** 15n
const TRILLION = 10n ** 12n

/**
 * Maps a points amount to the corresponding CSS class for "RPS League" tier styling.
 * Prioritizes BigInt for Vigintillion-scale precision and avoids quick-fix error handling.
 */
export const getAmountColor = (amount?: number | bigint | string): string => {
  if (amount == null || amount === '') return 'text-gray-400'

  let raw: bigint
  try {
    if (typeof amount === 'bigint') {
      raw = amount
    } else if (typeof amount === 'number') {
      raw = BigInt(Math.trunc(amount))
    } else {
      const cleanStr = String(amount).split('.')[0].replace(/,/g, '')
      raw = BigInt(cleanStr)
    }
  } catch {
    return 'text-gray-400'
  }

  const a = raw < ZERO ? -raw : raw
  if (a === ZERO) return 'text-gray-400'

  // High Tiers
  if (a >= VIGINTILLION) return 'g-vg'
  if (a >= NOVEMDECILLION) return 'g-nod'
  if (a >= OCTODECILLION) return 'g-ocd'
  if (a >= SEPTENDECILLION) return 'g-spd'
  if (a >= SEXDECILLION) return 'g-sxd'
  if (a >= QUINDECILLION) return 'g-qid'
  if (a >= QUATTUORDECILLION) return 'g-qud'
  if (a >= TREDECILLION) return 'g-td'
  if (a >= DUODECILLION) return 'g-dd'
  if (a >= UNDECILLION) return 'g-ud'
  if (a >= NONILLION) return 'g-no'
  if (a >= OCTILLION) return 'g-oc'
  if (a >= SEPTILLION) return 'g-sp'
  if (a >= SEXTILLION) return 'g-sx'
  if (a >= QUINTILLION) return 'g-qi'
  if (a >= QUADRILLION) return 'g-qd'

  // Base Tiers
  if (a >= TRILLION) return 'g-t'
  if (a >= 100_000_000_000n) return 'g-b3'
  if (a >= 10_000_000_000n) return 'g-b2'
  if (a >= 1_000_000_000n) return 'g-b1'
  if (a >= 100_000_000n) return 'g-m3'
  if (a >= 10_000_000n) return 'g-m2'
  if (a >= 1_000_000n) return 'g-m1'

  return 'text-gray-400'
}

export const getBonusStyles = (tier: string) => {
  const base =
    'font-black uppercase tracking-[0.25em] transition-all duration-300 px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10'

  switch (tier) {
    case 'LEGENDARY':
      return {
        label: 'LEGENDARY BONUS',
        text: 'text-yellow-400',
        containerClass: `${base} text-4xl shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-[pulsate_1s_ease-in-out_infinite]`,
        scale: 'scale-150',
        glow: 'drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]'
      }
    case 'EPIC':
      return {
        label: 'EPIC BONUS',
        text: 'text-purple-400',
        containerClass: `${base} text-3xl`,
        scale: 'scale-125',
        glow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]'
      }
    case 'RARE':
      return {
        label: 'RARE BONUS',
        text: 'text-cyan-400',
        containerClass: `${base} text-2xl`,
        scale: 'scale-110',
        glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]'
      }
    case 'SAVED':
      return {
        label: 'LUCKY SAVE',
        text: 'text-green-300',
        containerClass: `${base} text-xs sm:text-sm`, 
        scale: 'scale-100', 
        glow: 'drop-shadow-md'
      }
    default:
      return {
        label: 'COMMON BONUS',
        text: 'text-white',
        containerClass: `${base} text-xl`,
        scale: 'scale-100',
        glow: 'drop-shadow-sm'
      }
  }
}