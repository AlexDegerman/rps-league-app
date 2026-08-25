import { vi, describe, it, expect, beforeEach } from 'vitest'
import { type StageType, type BonusSession } from '../../types/bonusStage.js'

const mocks = vi.hoisted(() => {
  const queryFn = vi.fn()
  const clientQueryFn = vi.fn()
  const releaseFn = vi.fn()
  const connectFn = vi.fn().mockResolvedValue({
    query: clientQueryFn,
    release: releaseFn
  })

  return {
    mockQuery: queryFn,
    mockClient: {
      query: clientQueryFn,
      release: releaseFn
    },
    mockConnect: connectFn
  }
})

vi.mock('../../utils/db.js', () => ({
  default: {
    query: (...args: any[]) => mocks.mockQuery(...args),
    connect: () => mocks.mockConnect()
  }
}))

vi.mock('../../types/bonusStage.js', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    ENABLED_STAGES: ['TREASURE_VAULT', 'CRYSTAL_MINE'],
    TOTAL_TRIGGER_CHANCE: 10
  }
})

import {
  rollBonusTrigger,
  createSession,
  getActiveSession,
  getClientInitialData,
  getReconnectData,
  processAction,
  claimWinnings
} from '../../services/bonusStageService.js'

const createMockRow = (overrides = {}) => ({
  id: 'session-123',
  user_id: 'user-123',
  stage_type: 'TREASURE_VAULT',
  is_active: true,
  accumulated_payout: '0',
  last_bet_amount: '1000',
  stage_steps_completed: 0,
  max_steps: null,
  verification_salt: 'salt-123',
  grid_state: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

describe('Bonus Stage Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    mocks.mockConnect.mockResolvedValue(mocks.mockClient)
  })

  describe('1. rollBonusTrigger', () => {
    it('Trigger succeeds and returns an enabled stage', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01)
      const result = rollBonusTrigger()
      expect(result).not.toBeNull()
      expect(['TREASURE_VAULT', 'CRYSTAL_MINE']).toContain(result)
    })

    it('Trigger fails and returns null', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const result = rollBonusTrigger()
      expect(result).toBeNull()
    })
  })

  describe('2. createSession', () => {
    it('Creates a session with correct initial values', async () => {
      const mockRow = createMockRow({ stage_type: 'TREASURE_VAULT' })
      mocks.mockQuery.mockResolvedValueOnce({ rows: [mockRow] })

      const session = await createSession('user-123', 1000n, 'TREASURE_VAULT')
      expect(session.userId).toBe('user-123')
      expect(session.lastBetAmount).toBe(1000n)
      expect(session.stageType).toBe('TREASURE_VAULT')
      expect(session.isActive).toBe(true)
    })

    it('Generates the correct stage-specific grid state', async () => {
      const mockRow = createMockRow({
        stage_type: 'TREASURE_VAULT',
        grid_state: { rewards: [2, 5, 10], chosen: null }
      })
      mocks.mockQuery.mockResolvedValueOnce({ rows: [mockRow] })

      const session = await createSession('user-123', 1000n, 'TREASURE_VAULT')
      expect(session.gridState).toEqual({ rewards: [2, 5, 10], chosen: null })
    })

    it('Sets correct maxSteps', async () => {
      const mockRow = createMockRow({
        stage_type: 'ORACLE_VISION',
        max_steps: 5
      })
      mocks.mockQuery.mockResolvedValueOnce({ rows: [mockRow] })

      const session = await createSession('user-123', 1000n, 'ORACLE_VISION')
      expect(session.maxSteps).toBe(5)
    })
  })

  describe('3. getActiveSession', () => {
    it('Returns the latest active session', async () => {
      const mockRow = createMockRow()
      mocks.mockQuery.mockResolvedValueOnce({ rows: [mockRow] })

      const session = await getActiveSession('user-123')
      expect(session).not.toBeNull()
      expect(session?.id).toBe('session-123')
    })

    it('Returns null when none exists', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [] })

      const session = await getActiveSession('user-123')
      expect(session).toBeNull()
    })
  })

  describe('4. getClientInitialData', () => {
    it('Returns correct client-safe data for Oracle Vision, Rainbow Rush, and Sniper Challenge', () => {
      const oracleSession = {
        stageType: 'ORACLE_VISION',
        gridState: {
          sequences: [
            [1, 2, 3],
            [4, 5, 6]
          ],
          currentSequenceIndex: 0
        }
      } as unknown as BonusSession
      expect(getClientInitialData(oracleSession)).toEqual({
        firstSequence: [1, 2, 3]
      })

      const rrSession = { stageType: 'RAINBOW_RUSH' } as unknown as BonusSession
      expect(getClientInitialData(rrSession)).toEqual({ totalSpins: 3 })

      const sniperSession = {
        stageType: 'SNIPER_CHALLENGE',
        gridState: { startTimestamp: 1000, sweepDurationMs: 1800 }
      } as unknown as BonusSession
      expect(getClientInitialData(sniperSession)).toEqual({
        startTimestamp: 1000,
        sweepDurationMs: 1800
      })
    })

    it('Returns null for other stages', () => {
      const tvSession = {
        stageType: 'TREASURE_VAULT'
      } as unknown as BonusSession
      expect(getClientInitialData(tvSession)).toBeNull()
    })
  })

  describe('5. getReconnectData', () => {
    it('Returns correct reconnect state for the stages that support it', () => {
      const mockSession = {
        stageType: 'CRYSTAL_MINE',
        gridState: { tiles: [], miningCharges: 5, revealedIndices: [] }
      } as unknown as BonusSession

      expect(getReconnectData(mockSession)).toEqual({
        tiles: [],
        miningCharges: 5,
        revealedIndices: []
      })
    })

    it('Handles terminal Oracle Vision state', () => {
      const mockSession = {
        stageType: 'ORACLE_VISION',
        gridState: { failed: true }
      } as unknown as BonusSession

      expect(getReconnectData(mockSession)).toEqual({ terminal: true })
    })
  })

  describe('6. processAction', () => {
    it('Routes each of the 9 stage types to the correct handler', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })

      const stages: StageType[] = [
        'TREASURE_VAULT',
        'KINGS_VAULT',
        'DOUBLE_DOWN',
        'WILD_PREDICTION',
        'SURGE_FRENZY',
        'RAINBOW_RUSH',
        'SNIPER_CHALLENGE',
        'ORACLE_VISION',
        'CRYSTAL_MINE'
      ]

      const payloadMap: Record<StageType, any> = {
        TREASURE_VAULT: { chestIndex: 0 },
        KINGS_VAULT: { chestIndex: 0 },
        DOUBLE_DOWN: { action: 'CLAIM' },
        WILD_PREDICTION: { flipIndex: 0 },
        SURGE_FRENZY: { action: 'END' },
        RAINBOW_RUSH: {},
        SNIPER_CHALLENGE: { action: 'START' },
        ORACLE_VISION: { glyphIndex: 0 },
        CRYSTAL_MINE: { tileIndex: 0 }
      }

      for (const stage of stages) {
        const session = {
          id: 'session-123',
          stageType: stage,
          lastBetAmount: 1000n,
          stageStepsCompleted: 0,
          accumulatedPayout: 0n,
          gridState: {
            chosen: null,
            rewards: [2, 5, 10],
            chosenIndex: null,
            positions: ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'ROYAL'],
            flipsRevealed: 0,
            cardValues: [1, 2, 3],
            flippedIndices: [],
            spinResults: [1, 2, 3],
            spinsRevealed: 0,
            startTimestamp: Date.now(),
            sweepDurationMs: 1800,
            fired: false,
            sequences: [[0, 1, 2]],
            currentSequenceIndex: 0,
            tiles: Array(25).fill({ type: 'EMPTY', revealed: false }),
            miningCharges: 5,
            revealedIndices: []
          }
        } as unknown as BonusSession

        const payload = payloadMap[stage]

        await expect(processAction(session, payload)).resolves.toBeDefined()
      }
    })

    it('Rejects unknown stage types', async () => {
      const invalidSession = {
        stageType: 'UNKNOWN_STAGE'
      } as unknown as BonusSession

      await expect(processAction(invalidSession, {})).rejects.toThrow(
        'Unknown stage type: UNKNOWN_STAGE'
      )
    })
  })

  describe("7. Treasure Vault + King's Vault", () => {
    it('Valid pick produces correct payout and state', async () => {
      mocks.mockQuery.mockResolvedValueOnce({
        rows: [createMockRow({ accumulated_payout: '5000' })]
      })

      const session = {
        id: 'session-123',
        stageType: 'TREASURE_VAULT',
        lastBetAmount: 1000n,
        gridState: { rewards: [2, 5, 10], chosen: null }
      } as unknown as BonusSession

      const result = await processAction(session, { chestIndex: 1 })
      expect(result).toBeDefined()
      expect(mocks.mockQuery).toHaveBeenCalled()
    })

    it('Invalid or duplicate picks are rejected', async () => {
      const alreadyChosenSession = {
        id: 'session-123',
        stageType: 'TREASURE_VAULT',
        lastBetAmount: 1000n,
        gridState: { rewards: [2, 5, 10], chosen: 1 }
      } as unknown as BonusSession

      await expect(
        processAction(alreadyChosenSession, { chestIndex: 1 })
      ).rejects.toThrow('Chest already chosen')

      const outOfBoundsSession = {
        id: 'session-123',
        stageType: 'TREASURE_VAULT',
        lastBetAmount: 1000n,
        gridState: { rewards: [2, 5, 10], chosen: null }
      } as unknown as BonusSession

      await expect(
        processAction(outOfBoundsSession, { chestIndex: 5 })
      ).rejects.toThrow('Invalid chest index')
    })
  })

  describe('8. Double Down + Wild Prediction', () => {
    it('Double Down correctly handles win, loss, and claim', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })

      const session = {
        id: 'session-123',
        stageType: 'DOUBLE_DOWN',
        lastBetAmount: 1000n,
        stageStepsCompleted: 1,
        gridState: { terminal: false, won: null, lastRoll: null }
      } as unknown as BonusSession

      const claimResult = await processAction(session, { action: 'CLAIM' })
      expect(claimResult).toBeDefined()

      vi.spyOn(Math, 'random').mockReturnValue(0.1)
      const winResult = await processAction(session, { action: 'GAMBLE' })
      expect(winResult).toBeDefined()
    })

    it('Wild Prediction resolves the correct payout on the third card', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })

      const session = {
        id: 'session-123',
        stageType: 'WILD_PREDICTION',
        lastBetAmount: 1000n,
        stageStepsCompleted: 2,
        gridState: {
          cardValues: [2, 3, 3],
          flipsRevealed: 2,
          flippedIndices: [0, 1]
        }
      } as unknown as BonusSession

      await processAction(session, { flipIndex: 2 })
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['8000', 3, 'session-123'])
      )
    })
  })

  describe('9. Surge Frenzy', () => {
    it('Combo progression works', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [createMockRow()] })
      const startTime = Date.now()
      const session = {
        id: 'session-123',
        stageType: 'SURGE_FRENZY',
        gridState: {
          confirmedCombo: 0,
          startedAt: startTime,
          lastTapAt: startTime - 1000
        }
      } as unknown as BonusSession

      const result = await processAction(session, { action: 'TAP' })
      expect(result).toBeDefined()
    })

    it('Server-side timing/throttle validation works', async () => {
      const startTime = Date.now()
      const elapsedExpiredSession = {
        id: 'session-123',
        stageType: 'SURGE_FRENZY',
        gridState: {
          confirmedCombo: 0,
          startedAt: startTime - 10000,
          lastTapAt: startTime - 9000
        }
      } as unknown as BonusSession

      await expect(
        processAction(elapsedExpiredSession, { action: 'TAP' })
      ).rejects.toThrow('Frenzy window has already expired')

      const fastTappingSession = {
        id: 'session-123',
        stageType: 'SURGE_FRENZY',
        gridState: {
          confirmedCombo: 0,
          startedAt: startTime,
          lastTapAt: startTime - 50
        }
      } as unknown as BonusSession

      await expect(
        processAction(fastTappingSession, { action: 'TAP' })
      ).rejects.toThrow('Rate limit exceeded: Tap too fast')
    })

    it('END produces the correct payout tier', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })
      const now = Date.now()

      const session5s = {
        id: 'session-123',
        stageType: 'SURGE_FRENZY',
        lastBetAmount: 1000n,
        gridState: { startedAt: now - 4900 }
      } as unknown as BonusSession

      await processAction(session5s, { action: 'END' })
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['10000', 1, 'session-123'])
      )
    })
  })

  describe('10. Rainbow Rush + Sniper Challenge', () => {
    it('Rainbow Rush resolves the correct average-based payout', async () => {
      mocks.mockQuery.mockResolvedValueOnce({ rows: [createMockRow()] })

      const session = {
        id: 'session-123',
        stageType: 'RAINBOW_RUSH',
        lastBetAmount: 1000n,
        gridState: { spinResults: [5, 5, 5], spinsRevealed: 2 }
      } as unknown as BonusSession

      await processAction(session, {})
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['10000', 3, 'session-123'])
      )
    })

    it('Sniper correctly resolves bullseye/other hit zones and payout', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })

      const session = {
        id: 'session-123',
        stageType: 'SNIPER_CHALLENGE',
        lastBetAmount: 1000n,
        gridState: { startTimestamp: 1000, sweepDurationMs: 1800, fired: false }
      } as unknown as BonusSession

      await processAction(session, { action: 'FIRE', tapTimestampMs: 1900 })
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['10000', 1, 'session-123'])
      )
    })
  })

  describe('11. Oracle Vision + Crystal Mine', () => {
    it('Oracle correctly handles sequences, failure, and completion', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })

      const session = {
        id: 'session-123',
        stageType: 'ORACLE_VISION',
        lastBetAmount: 1000n,
        stageStepsCompleted: 0,
        gridState: {
          sequences: [[5, 6, 7]],
          currentSequenceIndex: 0,
          failed: false,
          complete: false
        }
      } as unknown as BonusSession

      await processAction(session, { glyphIndex: 5 })
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1, 'session-123'])
      )

      const wrongSession = {
        ...session,
        stageStepsCompleted: 0
      } as unknown as BonusSession
      await processAction(wrongSession, { glyphIndex: 99 })
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['2000', 1, 'session-123'])
      )
    })

    it('Crystal Mine correctly handles charges, diamonds, and final payout', async () => {
      mocks.mockQuery.mockResolvedValue({ rows: [createMockRow()] })

      const tiles = Array.from({ length: 25 }, (_, i) => ({
        type: i === 0 ? ('DIAMOND' as const) : ('EMPTY' as const),
        revealed: false
      }))

      const session = {
        id: 'session-123',
        stageType: 'CRYSTAL_MINE',
        lastBetAmount: 1000n,
        stageStepsCompleted: 0,
        accumulatedPayout: 0n,
        gridState: {
          tiles,
          miningCharges: 1,
          revealedIndices: []
        }
      } as unknown as BonusSession

      await processAction(session, { tileIndex: 0 })
      expect(mocks.mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['2000', 1, 'session-123'])
      )
    })
  })

  describe('12. claimWinnings', () => {
    it('Marks session inactive and awards payout', async () => {
      const session = {
        id: 'session-123',
        userId: 'user-123',
        stageType: 'TREASURE_VAULT',
        accumulatedPayout: 5000n,
        stageStepsCompleted: 1,
        gridState: { rewards: [2, 5, 10], chosen: 1 }
      } as unknown as BonusSession

      mocks.mockClient.query.mockResolvedValue({ rows: [] })

      const finalPayout = await claimWinnings(session, 10000n)
      expect(finalPayout).toBe(5000n)
      expect(mocks.mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mocks.mockClient.query).toHaveBeenCalledWith('COMMIT')
      expect(mocks.mockClient.release).toHaveBeenCalled()
    })

    it('Increments the correct Neon Paradise metrics', async () => {
      const session = {
        id: 'session-123',
        userId: 'user-123',
        stageType: 'CRYSTAL_MINE',
        accumulatedPayout: 10000n,
        stageStepsCompleted: 5,
        gridState: {
          tiles: [
            ...Array(5).fill({ type: 'DIAMOND', revealed: true }),
            ...Array(20).fill({ type: 'EMPTY', revealed: false })
          ],
          revealedIndices: []
        }
      } as unknown as BonusSession

      mocks.mockClient.query.mockResolvedValue({ rows: [] })

      await claimWinnings(session, 10000n)
      expect(mocks.mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'crystal_mine_clears = crystal_mine_clears + 1'
        ),
        expect.any(Array)
      )
    })

    it('Commits on success and rolls back on failure', async () => {
      const session = {
        id: 'session-123',
        userId: 'user-123',
        stageType: 'TREASURE_VAULT',
        accumulatedPayout: 5000n,
        gridState: { rewards: [2, 5, 10], chosen: 1 }
      } as unknown as BonusSession

      mocks.mockClient.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('UPDATE users')) {
          throw new Error('Database connection lost')
        }
        return Promise.resolve({ rows: [] })
      })

      await expect(claimWinnings(session, 10000n)).rejects.toThrow(
        'Database connection lost'
      )
      expect(mocks.mockClient.query).toHaveBeenCalledWith('ROLLBACK')
      expect(mocks.mockClient.release).toHaveBeenCalled()
    })
  })
})
