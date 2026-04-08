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
  const bigN = BigInt(n)
  const absN = bigN < 0n ? -bigN : bigN
  const sign = bigN < 0n ? '-' : ''

  const tiers = [
    { threshold: 10n ** 21n, symbol: 'Sx' },
    { threshold: 10n ** 18n, symbol: 'Qi' },
    { threshold: 10n ** 15n, symbol: 'Qa' },
    { threshold: 10n ** 12n, symbol: 'T' },
    { threshold: 10n ** 9n, symbol: 'B' },
    { threshold: 10n ** 6n, symbol: 'M' }
  ]

  for (const { threshold, symbol } of tiers) {
    if (absN >= threshold) {
      const val = Number(absN) / Number(threshold)
      return `${sign}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}${symbol}`
    }
  }

  return sign + absN.toLocaleString('en-US')
}

// Formats large point values into human-readable strings.
export const formatPoints = (
  n: number | bigint | string,
  useK: boolean = false
): string => {
  const bigN = BigInt(n)
  if (bigN === 0n) return '0'

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

  if (useK && absN >= 1000n && absN < 1000000n) {
    const whole = absN / 1000n
    const tenth = (absN % 1000n) / 100n
    const decimalStr = tenth > 0n ? `.${tenth}` : ''
    return `${sign}${whole}${decimalStr}K`
  }

  for (const { threshold, symbol } of tiers) {
    if (absN >= threshold) {
      const whole = absN / threshold
      const divisor = threshold / 10n
      const tenth = divisor > 0n ? (absN % threshold) / divisor : 0n
      const decimalStr = tenth > 0n ? `.${tenth}` : ''
      return `${sign}${whole}${decimalStr}${symbol}`
    }
  }

  return `${sign}${new Intl.NumberFormat('de-DE').format(absN)}`
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

export const getAmountColor = (amount?: number | bigint | string): string => {
  if (!amount || amount === 0n || amount === '0') return 'text-gray-400'

  const a = BigInt(amount) < 0n ? -BigInt(amount) : BigInt(amount)

  // 1 Vigintillion (Vg)
  if (a >= 10n ** 63n) { // 1 Vigintillion (Vg)
    return `
    inline-block
    font-black
    animate-[holy-bloom_5s_linear_infinite]
    `
  }

  // 1 Novemdecillion (Nod)
  if (a >= 10n ** 60n) {
    return `
      inline-block
      text-transparent bg-clip-text
      bg-[radial-gradient(circle_at_center,_#fcd34d_0%,_#f59e0b_50%,_#78350f_100%)]
      bg-size-[100%_100%]
      font-black
      animate-[nod-bloom_5s_linear_infinite]
      [-webkit-text-stroke:0.6px_#78350f]
    `
  }

  if (a >= 10n ** 57n) { // 1 Octodecillion (Ocd)
    return `
      inline-block
      text-transparent bg-clip-text 
      bg-gradient-to-r from-red-500 via-green-500 to-blue-500 
      font-black 
      animate-[ocd-glow_3s_linear_infinite] 
      [-webkit-text-stroke:0.5px_rgba(0,0,0,0.1)]
    `
  }

  if (a >= 10n ** 54n) { // 1 Septendecillion (Spd)
  return `
    text-[#6366f1] 
    font-black 
    animate-pulse
    [filter:drop-shadow(0_0_8px_rgba(168,85,247,0.9))_drop-shadow(0_0_15px_rgba(168,85,247,0.5))]
    [-webkit-text-stroke:1px_#3730a3]
    `
  }

  // 1 Sexdecillion (Sxd) - Deep Red Shimmer
  if (a >= 10n ** 51n) {
    return `inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-800 to-red-500 bg-[length:200%_auto] font-black animate-[shimmer-slide_4s_linear_infinite] [filter:drop-shadow(0_-2px_10px_rgba(239,68,68,0.7))_drop-shadow(0_2px_5px_rgba(239,68,68,0.4))]`;
  }

  // 1 Quindecillion (Qid) - Emerald Wave
  if (a >= 10n ** 48n) {
    return `inline-block text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:auto_200%] font-black animate-[emerald-wave_3s_ease-in-out_infinite] [filter:drop-shadow(0_-3px_12px_rgba(52,211,153,0.8))_drop-shadow(0_2px_6px_rgba(52,211,153,0.4))]`;
  }

  // 1 Quattuordecillion (Qud) - Cyan Pulse
  if (a >= 10n ** 45n) {
    return `inline-block text-cyan-600 font-black animate-[soft-glow_3s_ease-in-out_infinite] [--glow-color-upper:rgba(8,145,178,0.8)] [--glow-color-lower:rgba(8,145,178,0.4)]`;
  }

  // 1 Tredecillion (Td) - Sunset Flow
  if (a >= 10n ** 42n) {
    return `inline-block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-600 bg-[length:200%_auto] font-black animate-[shimmer-slide_5s_linear_infinite] [filter:drop-shadow(0_-2px_8px_rgba(245,158,11,0.6))_drop-shadow(0_2px_4px_rgba(245,158,11,0.3))]`;
  }

  // 1 Duodecillion (Dd) - Purple Breathe
  if (a >= 10n ** 39n) {
    return `inline-block text-purple-500 font-black animate-[soft-glow_4s_ease-in-out_infinite] [--glow-color-upper:rgba(168,85,247,0.7)] [--glow-color-lower:rgba(168,85,247,0.3)]`;
  }

  // 1 Undecillion (Ud) - Steel Shimmer
  if (a >= 10n ** 36n) {
    return `
      inline-block text-transparent bg-clip-text 
      bg-gradient-to-b from-slate-300 via-slate-500 to-slate-800 
      bg-[length:200%_200%] font-black 
      animate-[shimmer-glow_4s_ease-in-out_infinite]
      [--glow-top:rgba(148,163,184,0.8)] [--glow-bottom:rgba(71,85,105,0.4)]
      [-webkit-text-stroke:0.8px_#1e293b]
    `
  }

  // 1 Nonillion (No) - The Mini Rainbow
  if (a >= 10n ** 30n) {
    return `
      inline-block text-transparent bg-clip-text 
      bg-gradient-to-r from-red-500 via-green-500 to-purple-500 
      bg-[length:200%_auto] font-black 
      animate-[shimmer-glow_6s_linear_infinite] 
      [--glow-top:rgba(239,68,68,0.5)] [--glow-bottom:rgba(168,85,247,0.4)]
    `
  }

  // 1 Octillion (Oc) - Orange Flicker
  if (a >= 10n ** 27n) {
    return `
      inline-block text-orange-500 font-black 
      animate-[static-breathe_3s_ease-in-out_infinite] 
      [--glow-top:rgba(251,146,60,0.7)] [--glow-bottom:rgba(251,146,60,0.4)]
    `
  }

  // 1 Septillion (Sp) - Ocean Shine
  if (a >= 10n ** 24n) {
    return `
      inline-block text-transparent bg-clip-text 
      bg-gradient-to-r from-cyan-400 to-blue-600 font-black 
      animate-[shimmer-glow_5s_ease-in-out_infinite]
      [--glow-top:rgba(34,211,238,0.6)] [--glow-bottom:rgba(37,99,235,0.3)]
    `
  }

  // 1 Sextillion (Sx) - Fuchsia Pulse
  if (a >= 10n ** 21n) {
    return `
      inline-block text-fuchsia-600 font-black 
      animate-[static-breathe_3s_ease-in-out_infinite] 
      [--glow-top:rgba(192,38,211,0.6)] [--glow-bottom:rgba(192,38,211,0.3)]
    `
  }

  // 1 Quintillion (Qi) - Rose Glow
  if (a >= 10n ** 18n) {
    return `
      inline-block text-rose-600 font-black 
      animate-[static-breathe_4s_ease-in-out_infinite]
      [--glow-top:rgba(225,29,72,0.5)] [--glow-bottom:rgba(225,29,72,0.2)]
    `
  }

  // 1 Quadrillion (Qd)
  if (a >= 10n ** 15n) {
    return 'inline-block text-pink-600 font-extrabold [filter:drop-shadow(0_0_5px_rgba(219,39,119,0.3))]'
  }

  // 1 Trillion
  if (a >= 10n ** 12n) return 'text-red-500 font-bold'
  if (a >= 100_000_000_000n) return 'text-orange-600 font-bold'
  if (a >= 10_000_000_000n) return 'text-orange-500 font-semibold'
  if (a >= 1_000_000_000n) return 'text-amber-500'
  if (a >= 100_000_000n) return 'text-lime-500'
  if (a >= 10_000_000n) return 'text-emerald-500'
  if (a >= 1_000_000n) return 'text-cyan-500'

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