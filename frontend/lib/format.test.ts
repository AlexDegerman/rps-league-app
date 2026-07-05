import { describe, it, expect, vi } from 'vitest'
import type { Match } from '../types/rps'
import {
  formatDateTime,
  getPlayerResult,
  resultColor,
  parseShorthand,
  formatTickerPoints,
  formatPoints,
  getFullNumberName,
  getAmountColor,
  getBonusStyles,
  getEventColor,
  getDisplayTierClass,
  getUnlockedTiers
} from './format'

// Mock TIER_THRESHOLDS to isolate test execution from external constant changes
vi.mock('./constants', () => ({
  TIER_THRESHOLDS: [
    { min: 1000000n, cls: 'text-gold-tier' },
    { min: 1000n, cls: 'text-silver-tier' },
    { min: 1n, cls: 'text-bronze-tier' }
  ]
}))

describe('Format and RPS Game Utilities', () => {
  describe('toMs and formatDateTime', () => {
    it('should correctly format Unix timestamp in seconds', () => {
      // 1,500,000,000 seconds -> 1,500,000,000,000 milliseconds
      const result = formatDateTime(1500000000)

      expect(result).toMatch(/\d{2} \w{3} \d{4}, \d{2}:\d{2}/)
    })

    it('should correctly format Unix timestamp in milliseconds', () => {
      const result = formatDateTime(1775124000000)
      expect(result).toMatch(/\d{2} \w{3} \d{4}, \d{2}:\d{2}/)
    })
  })

  describe('getPlayerResult', () => {
    const mockMatch: Match = {
      type: 'standard',
      gameId: 'game-123',
      time: 1500000000,
      playerA: { name: 'Alice', played: 'ROCK' },
      playerB: { name: 'Bob', played: 'SCISSORS' }
    }

    it('should return WIN for playerA if playerA wins', () => {
      expect(getPlayerResult(mockMatch, 'Alice')).toBe('WIN')
    })

    it('should return LOSE for playerB if playerA wins', () => {
      expect(getPlayerResult(mockMatch, 'Bob')).toBe('LOSE')
    })

    it('should handle alternative winning combinations (e.g. SCISSORS beats PAPER)', () => {
      const match: Match = {
        type: 'standard',
        gameId: 'game-124',
        time: 1500000000,
        playerA: { name: 'Alice', played: 'SCISSORS' },
        playerB: { name: 'Bob', played: 'PAPER' }
      }
      expect(getPlayerResult(match, 'Alice')).toBe('WIN')
      expect(getPlayerResult(match, 'Bob')).toBe('LOSE')
    })

    it('should capture same-move outcome rules under current implementation constraints', () => {
      const drawMatch: Match = {
        type: 'standard',
        gameId: 'game-125',
        time: 1500000000,
        playerA: { name: 'Alice', played: 'ROCK' },
        playerB: { name: 'Bob', played: 'ROCK' }
      }
      // Currently, if aWins is false, playerA gets 'LOSE' and playerB gets 'WIN'
      expect(getPlayerResult(drawMatch, 'Alice')).toBe('LOSE')
      expect(getPlayerResult(drawMatch, 'Bob')).toBe('WIN')
    })
  })

  describe('resultColor', () => {
    it('should map outcome states to proper Tailwind classes', () => {
      expect(resultColor('WIN')).toBe('bg-green-500')
      expect(resultColor('LOSE')).toBe('bg-red-500')
    })
  })

  describe('parseShorthand', () => {
    it('should return 0n for invalid or empty strings', () => {
      expect(parseShorthand('')).toBe(0n)
      expect(parseShorthand('abc')).toBe(0n)
    })

    it('should parse standard raw integer strings with commas', () => {
      expect(parseShorthand('1,000,000')).toBe(1000000n)
    })

    it('should parse basic lowercase/uppercase suffixes correctly', () => {
      expect(parseShorthand('400k')).toBe(400000n)
      expect(parseShorthand('1.5M')).toBe(1500000n)
      expect(parseShorthand('2b')).toBe(2000000000n)
    })

    it('should support extremely large BigInt scale suffixes (e.g. "str" at 10^111)', () => {
      const expected = 5n * 10n ** 111n
      expect(parseShorthand('5str')).toBe(expected)
    })

    describe('Decimal remainder and limits', () => {
      it('should resolve multi-digit decimal values', () => {
        expect(parseShorthand('1.234k')).toBe(1234n)
      })

      it('should truncate trailing decimal elements beyond the scale divisor', () => {
        // 1.0005k -> (1 * 1000) + (0005 * 1000 / 10000) = 1000 + 0 = 1000
        expect(parseShorthand('1.0005k')).toBe(1000n)
      })
    })
  })

  describe('formatPoints and formatTickerPoints', () => {
    it('should return zero defaults on parse failure', () => {
      expect(formatPoints('invalid-number')).toEqual({
        display: '0',
        full: '0',
        capped: false
      })
    })

    it('should process and preserve negative numeric symbols', () => {
      const result = formatPoints(-1500000n)
      expect(result.display).toBe('-1.5M')
    })

    it('should format smaller numbers using German formatting representations', () => {
      expect(formatPoints(500000n)).toEqual({
        display: '500.000',
        full: '500.000',
        capped: false
      })
    })

    it('should omit decimals if value is 100 or larger within its tier threshold', () => {
      expect(formatPoints(150000000n).display).toBe('150M') // 150M instead of 150.0M
      expect(formatPoints(15000000n).display).toBe('15M') // 15M
      expect(formatPoints(1500000n).display).toBe('1.5M') // Under 100 threshold, decimal shown
    })

    it('should support K formatting mapping when requested', () => {
      expect(formatPoints(5000n, true)).toEqual({
        display: '5K',
        full: '5K',
        capped: false
      })
    })

    it('should trigger cap formatting "9999+" at the maximum BigInt threshold scale', () => {
      // Maximum tier is Str (10^111). Values >= 10000 * 10^111 should cap out
      const ultraHighPoints = 15000n * 10n ** 111n
      const result = formatPoints(ultraHighPoints)
      expect(result.capped).toBe(true)
      expect(result.display).toBe('9999+Str')
    })

    it('should map ticker formatting correctly through formatTickerPoints', () => {
      expect(formatTickerPoints(1500000n)).toBe('1.5M')
    })
  })

  describe('getFullNumberName', () => {
    it('should map big integers to their formal naming groups', () => {
      expect(getFullNumberName(10n ** 6n)).toBe('Million')
      expect(getFullNumberName(10n ** 111n)).toBe('Sextrigintillion')
    })

    it('should fallback to default units when below the million threshold scale', () => {
      expect(getFullNumberName(500000n)).toBe('Points')
    })
  })

  describe('getAmountColor and getDisplayTierClass', () => {
    it('should return default fallback if no valid values are provided', () => {
      expect(getAmountColor(undefined)).toBe('text-gray-400')
      expect(getAmountColor(0n)).toBe('text-gray-400')
    })

    it('should resolve CSS styles matching custom tier conditions', () => {
      expect(getAmountColor(1500000n)).toBe('text-gold-tier')
      expect(getAmountColor(5000n)).toBe('text-silver-tier')
      expect(getAmountColor(500n)).toBe('text-bronze-tier')
    })

    it('should respect owner preference over active tier color output configurations', () => {
      const preferredColor = 'text-custom-rainbow'
      const resolved = getDisplayTierClass(1500000n, preferredColor)
      expect(resolved).toBe(preferredColor)
    })

    it('should fallback to standard color matching if no preference exists', () => {
      const resolved = getDisplayTierClass(1500000n, null)
      expect(resolved).toBe('text-gold-tier')
    })
  })

  describe('getBonusStyles', () => {
    it('should retrieve distinct configurations for known bonus scales', () => {
      const mythicalBonus = getBonusStyles('MYTHICAL')
      expect(mythicalBonus.label).toBe('MYTHICAL BONUS')
      expect(mythicalBonus.text).toBe('text-red-400')
      expect(mythicalBonus.scale).toBe('scale-[1.15]')
    })

    it('should fallback gracefully for common or unknown bonus types', () => {
      const unknownBonus = getBonusStyles('UNKNOWN_TIER')
      expect(unknownBonus.label).toBe('COMMON BONUS')
      expect(unknownBonus.text).toBe('text-white')
    })
  })

  describe('getEventColor', () => {
    it('should render custom event keys with explicit transparency layers', () => {
      expect(getEventColor('lunar', 0.5)).toBe('rgba(144,205,244,0.5)')
      expect(getEventColor('hellfire', 1)).toBe('rgba(220,38,38,1)')
    })

    it('should fall back to gray if the event is not matched', () => {
      expect(getEventColor('undefined_event', 0.8)).toBe(
        'rgba(150,150,150,0.8)'
      )
    })
  })

  describe('getUnlockedTiers', () => {
    it('should return all thresholds below or equal to the peak score', () => {
      const unlocked = getUnlockedTiers(5000n)
      expect(unlocked.length).toBe(2) // Should unlock bronze and silver in our mock
      expect(unlocked[0]!.cls).toBe('text-silver-tier')
      expect(unlocked[1]!.cls).toBe('text-bronze-tier')
    })
  })
})
