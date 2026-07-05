import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as relicService from './relicService.js'
import { RELICS } from './relicService.js'
import pool from '../utils/db.js'
import { mockDbResponse } from '../test/setup.js'
import { getActiveFestival } from './festivalService.js'

vi.mock('./festivalService.js', () => ({
  getActiveFestival: vi.fn(() => null)
}))

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

const mockQuery = vi.mocked(pool.query)
const mockGetActiveFestival = vi.mocked(getActiveFestival)

describe('Relic Service', () => {
  let randomSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetActiveFestival.mockReturnValue(null)
    // Control random rolls deterministically.
    randomSpy = vi.spyOn(Math, 'random')
  })

  afterEach(() => {
    randomSpy.mockRestore()
  })

  describe('rollRelicDrop', () => {
    it('returns null when every relic is already owned', async () => {
      // Simulate a fully completed relic collection.
      mockQuery.mockResolvedValueOnce(
        mockDbResponse(RELICS.map((r) => ({ relic_key: r.key })))
      )

      const result = await relicService.rollRelicDrop('u1', null, 0)

      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    // These thresholds intentionally mirror the production rarity table.
    // If the configured rarity rates change, update these boundary expectations.
    describe('Cumulative Probability Boundaries', () => {
      // Shared helper to verify cumulative rarity thresholds.
      const runBoundaryTest = async (roll: number, expectedRarity: string) => {
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ relic_key: 'precision_bearing' }])
        )
        mockQuery.mockResolvedValueOnce(mockDbResponse([]))
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ nickname: 'ProPlayer' }])
        )

        randomSpy.mockReturnValue(roll)

        const result = await relicService.rollRelicDrop('u1', null, 0)
        expect(result).not.toBeNull()
        expect(result?.rarity).toBe(expectedRarity)
      }

      it('maps 0.000999 to MYTHICAL', async () => {
        await runBoundaryTest(0.000999, 'MYTHICAL')
      })

      it('maps 0.001000 to LEGENDARY', async () => {
        await runBoundaryTest(0.001, 'LEGENDARY')
      })

      it('maps 0.002999 to LEGENDARY', async () => {
        await runBoundaryTest(0.002999, 'LEGENDARY')
      })

      it('maps 0.003000 to EPIC', async () => {
        await runBoundaryTest(0.003, 'EPIC')
      })

      it('maps 0.005999 to EPIC', async () => {
        await runBoundaryTest(0.005999, 'EPIC')
      })

      it('maps 0.006000 to RARE', async () => {
        await runBoundaryTest(0.006, 'RARE')
      })

      it('maps 0.015999 to RARE', async () => {
        await runBoundaryTest(0.015999, 'RARE')
      })

      it('maps 0.016000 to COMMON', async () => {
        await runBoundaryTest(0.016, 'COMMON')
      })

      it('maps 0.045999 to COMMON', async () => {
        await runBoundaryTest(0.045999, 'COMMON')
      })
    })

    it('returns null if the roll is greater than or equal to the total combined drop rate', async () => {
      mockQuery.mockResolvedValueOnce(
        mockDbResponse([{ relic_key: 'precision_bearing' }])
      )

      randomSpy.mockReturnValue(0.9)

      const result = await relicService.rollRelicDrop('u1', null, 0)

      expect(result).toBeNull()
    })

    describe('Scavenger Lens Modifier', () => {
      it('successfully scales up effective probability when Scavenger Lens is equipped', async () => {
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ relic_key: 'scavengers_lens' }])
        )
        mockQuery.mockResolvedValueOnce(mockDbResponse([]))
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ nickname: 'Explorer' }])
        )

        // Total rate with Lens (1.2x) is 0.0552 (5.52%).
        // A roll of 0.05 would fail under standard conditions (0.05 >= 0.046)
        // but succeeds with the Lens equipped.
        randomSpy.mockReturnValue(0.05)

        const result = await relicService.rollRelicDrop(
          'u1',
          'scavengers_lens',
          0
        )

        expect(result).not.toBeNull()
      })

      it('fails drop at 0.05 if Scavenger Lens is NOT equipped', async () => {
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ relic_key: 'scavengers_lens' }])
        )

        randomSpy.mockReturnValue(0.05)

        const result = await relicService.rollRelicDrop('u1', null, 0)

        expect(result).toBeNull()
      })
    })

    describe('Vault Festival Modifier', () => {
      it('successfully scales up effective probability during active Vault Festivals', async () => {
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ relic_key: 'precision_bearing' }])
        )
        mockQuery.mockResolvedValueOnce(mockDbResponse([]))
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ nickname: 'Oracle' }])
        )

        mockGetActiveFestival.mockReturnValue({
          type: 'VAULT',
          startedAt: Date.now(),
          endsAt: Date.now() + 10000,
          triggeredBy: 'Oracle'
        })

        // Total rate with Vault (2.0x) is 0.092 (9.2%).
        // A roll of 0.08 fails under standard conditions (0.08 >= 0.046) but succeeds here.
        randomSpy.mockReturnValue(0.08)

        const result = await relicService.rollRelicDrop('u1', null, 0)

        expect(result).not.toBeNull()
      })
    })

    describe('Lap Bonus Scaling', () => {
      it('applies Lap bonuses up to their strict predefined caps', async () => {
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ relic_key: 'precision_bearing' }])
        )
        mockQuery.mockResolvedValueOnce(mockDbResponse([]))
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ nickname: 'Prestigist' }])
        )

        // Common bonus per lap is 0.005, capped at 0.15.
        // At 40 laps, mathematical bonus is 0.20, but must be clamped to 0.15.
        // Total common rate: 0.03 (base) + 0.15 (capped bonus) = 0.18 (18.0%).
        // A roll of 0.17 should succeed under the capped rate (0.17 < 0.18).
        randomSpy.mockReturnValue(0.17)

        const result = await relicService.rollRelicDrop('u1', null, 40)

        expect(result).not.toBeNull()
        expect(result?.rarity).toBe('COMMON')
      })

      it('fails drop at 0.29 at 40 laps proving the progress bonus capped at 15%', async () => {
        mockQuery.mockResolvedValueOnce(
          mockDbResponse([{ relic_key: 'precision_bearing' }])
        )

        randomSpy.mockReturnValue(0.29)

        const result = await relicService.rollRelicDrop('u1', null, 40)

        expect(result).toBeNull()
      })
    })

    it('rolls a Common relic under standard roll conditions', async () => {
      mockQuery.mockResolvedValueOnce(
        mockDbResponse([{ relic_key: 'precision_bearing' }])
      )
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))
      mockQuery.mockResolvedValueOnce(
        mockDbResponse([{ nickname: 'Explorer' }])
      )

      // Roll within the Common probability range.
      randomSpy.mockReturnValue(0.03)

      const result = await relicService.rollRelicDrop('u1', null, 0)

      expect(result).not.toBeNull()
      expect(result?.rarity).toBe('COMMON')
    })

    it('falls back cascadingly downward through all owned tiers', async () => {
      const ownedMythicals = RELICS.filter((r) => r.rarity === 'MYTHICAL')
      const ownedLegendaries = RELICS.filter((r) => r.rarity === 'LEGENDARY')
      const ownedEpics = RELICS.filter((r) => r.rarity === 'EPIC')

      // Simulate all Mythical, Legendary, and Epic relics already collected.
      mockQuery.mockResolvedValueOnce(
        mockDbResponse(
          [...ownedMythicals, ...ownedLegendaries, ...ownedEpics].map((r) => ({
            relic_key: r.key
          }))
        )
      )
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))
      mockQuery.mockResolvedValueOnce(
        mockDbResponse([{ nickname: 'Completionist' }])
      )

      // Roll within the Mythical probability range.
      randomSpy.mockReturnValue(0.0005)

      const result = await relicService.rollRelicDrop('u1', null, 0)

      expect(result).not.toBeNull()
      // Mythical fallback path: MYTHICAL -> LEGENDARY -> EPIC -> RARE -> COMMON
      // Since Mythical, Legendary, and Epic are fully collected, it must bypass them
      // and award the first unowned RARE relic.
      expect(result?.rarity).toBe('RARE')
    })

    it('accurately verifies database insertion arguments', async () => {
      mockQuery.mockResolvedValueOnce(
        mockDbResponse([{ relic_key: 'precision_bearing' }])
      )
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))
      mockQuery.mockResolvedValueOnce(
        mockDbResponse([{ nickname: 'AuditLog' }])
      )

      // Roll falls inside Mythical range [0 .. 0.001)
      randomSpy.mockReturnValue(0.0005)

      const result = await relicService.rollRelicDrop('u1', null, 0)

      expect(result).not.toBeNull()
      expect(result?.rarity).toBe('MYTHICAL')

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO relics'),
        expect.arrayContaining(['u1', result!.key, 'MYTHICAL'])
      )
    })
  })

  describe('getUserRelics', () => {
    it('returns full static details and live counters for a users owned relics', async () => {
      const dbRows = [
        { relic_key: 'precision_bearing', counter: 0 },
        { relic_key: 'buffer_module', counter: 12 }
      ]
      mockQuery.mockResolvedValueOnce(mockDbResponse(dbRows))

      const result = await relicService.getUserRelics('user_123')

      expect(result).toHaveLength(2)

      expect(result[0]?.key).toBe('precision_bearing')
      expect(result[0]?.name).toBe('Precision Bearing')
      expect(result[0]?.rarity).toBe('COMMON')
      expect(result[0]?.counter).toBe(0)

      expect(result[1]?.key).toBe('buffer_module')
      expect(result[1]?.name).toBe('Buffer Module')
      expect(result[1]?.rarity).toBe('EPIC')
      expect(result[1]?.counter).toBe(12)
    })

    it('silently filters out invalid or deprecated keys without breaking', async () => {
      const dbRows = [
        { relic_key: 'deprecated_key_no_longer_in_catalog', counter: 0 },
        { relic_key: 'conductive_filament', counter: 3 }
      ]
      mockQuery.mockResolvedValueOnce(mockDbResponse(dbRows))

      const result = await relicService.getUserRelics('user_123')

      expect(result).toHaveLength(1)
      expect(result[0]?.key).toBe('conductive_filament')
      expect(result[0]?.counter).toBe(3)
    })
  })

  describe('equipRelic', () => {
    it('successfully equips an owned relic', async () => {
      mockQuery.mockResolvedValueOnce(mockDbResponse([{ id: 45 }]))
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))

      await expect(
        relicService.equipRelic('user_1', 'scavengers_lens')
      ).resolves.not.toThrow()

      expect(mockQuery).toHaveBeenCalledTimes(2)
      expect(mockQuery.mock.calls[1]![1]).toEqual(['scavengers_lens', 'user_1'])
    })

    it('rejects equipping an unowned relic', async () => {
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))

      await expect(
        relicService.equipRelic('user_1', 'architects_keystone')
      ).rejects.toThrow('Relic not owned')
    })
  })

  describe('unequipRelic', () => {
    it('sets equipped relic to null and resets its counter', async () => {
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))

      await expect(relicService.unequipRelic('user_1')).resolves.not.toThrow()

      expect(mockQuery).toHaveBeenCalledTimes(2)
      expect(mockQuery.mock.calls[1]![1]).toEqual(['user_1'])
    })

    it('specifically resets the dynamic charging counter of the active relic (e.g. buffer_module) to zero', async () => {
      // Reset query execution
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))
      // Clear equipped relic execution
      mockQuery.mockResolvedValueOnce(mockDbResponse([]))

      const userId = 'user_999'
      await expect(relicService.unequipRelic(userId)).resolves.not.toThrow()

      expect(mockQuery).toHaveBeenCalledTimes(2)

      // Verify the equipped relic's dynamic counter is reset before unequipping.
      const [resetQuery, resetParams] = mockQuery.mock.calls[0]!

      expect(resetQuery).toContain('UPDATE relics')
      expect(resetQuery).toContain('SET counter = 0')
      expect(resetQuery).toContain('WHERE user_id = $1')
      expect(resetQuery).toContain('SELECT equipped_relic FROM users')
      expect(resetParams).toEqual([userId])

      // Verify the equipped relic slot is cleared.
      const [nullifyQuery, nullifyParams] = mockQuery.mock.calls[1]!
      expect(nullifyQuery).toContain('UPDATE users')
      expect(nullifyQuery).toContain('SET equipped_relic = NULL')
      expect(nullifyParams).toEqual([userId])
    })
  })
})
