import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import type { QueryResult, QueryResultRow } from 'pg'
import type { Match } from '../types/rps.js'
import { startMatchGenerator, getActivePendingMatch } from './matchGenerator.js'
import type { PendingMatch } from './matchGenerator.js'
import pool from './db.js'
import { logger } from '../utils/logger.js'

vi.mock('./db.js', () => ({
  default: {
    query: vi.fn()
  }
}))

vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('uuid', () => ({
  v4: () => 'mocked-game-id'
}))

vi.mock('./playerNames.js', () => ({
  playerNames: ['Player1', 'Player2', 'Player3']
}))

describe('Match Generator Service', () => {
  let onPending: Mock<(pendingMatch: PendingMatch) => void>
  let onResult: Mock<(match: Match) => void | Promise<void>>
  let queryMock: Mock<
    (
      queryText: string,
      values?: unknown[]
    ) => Promise<QueryResult<QueryResultRow>>
  >
  let cleanup: (() => void) | null = null

  beforeEach(() => {
    vi.useFakeTimers()
    onPending = vi.fn()
    onResult = vi.fn()
    queryMock = pool.query as unknown as Mock<
      (
        queryText: string,
        values?: unknown[]
      ) => Promise<QueryResult<QueryResultRow>>
    >
    cleanup = null

    const mockQueryResult: QueryResult<QueryResultRow> = {
      rows: [],
      rowCount: 0,
      command: 'INSERT',
      oid: 0,
      fields: []
    }

    queryMock.mockReset()
    queryMock.mockResolvedValue(mockQueryResult)

    vi.mocked(logger.error).mockReset()
    vi.mocked(logger.warn).mockReset()
  })

  afterEach(() => {
    if (cleanup) {
      cleanup()
    }
    vi.useRealTimers()
  })

  describe('startMatchGenerator', () => {
    describe('duplicate execution', () => {
      it('should prevent concurrent generator instances and log a warning', () => {
        cleanup = startMatchGenerator(onPending, onResult, 5000)

        const duplicateCleanup = startMatchGenerator(onPending, onResult, 5000)

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining('Match generator is already running')
        )

        duplicateCleanup()
      })
    })

    describe('database integration', () => {
      it('should persist generated match to database and notify clients', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        cleanup = startMatchGenerator(onPending, onResult, 5000)

        await vi.advanceTimersByTimeAsync(0)

        expect(queryMock).toHaveBeenCalledTimes(1)
        expect(queryMock).toHaveBeenLastCalledWith(
          expect.stringContaining('INSERT INTO matches'),
          expect.arrayContaining([
            'mocked-game-id',
            'GAME_RESULT',
            now,
            now + 3000
          ])
        )
        expect(onPending).toHaveBeenCalledTimes(1)
        expect(onPending).toHaveBeenCalledWith({
          gameId: 'mocked-game-id',
          time: now,
          expiresAt: now + 3000,
          playerA: expect.any(String),
          playerB: expect.any(String)
        })
      })

      it('should halt step sequence and schedule next interval if database save fails', async () => {
        const dbError = new Error('Connection failed')
        queryMock.mockRejectedValueOnce(dbError)

        cleanup = startMatchGenerator(onPending, onResult, 5000)

        await vi.advanceTimersByTimeAsync(0)

        expect(logger.error).toHaveBeenCalledWith(
          'saveMatch failed',
          dbError,
          expect.any(Object)
        )
        expect(onPending).not.toHaveBeenCalled()
        expect(getActivePendingMatch()).toBeNull()
      })
    })

    describe('callback sequencing', () => {
      it('should wait for an asynchronous onResult to finish before scheduling the next match', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        let resolveOnResult: () => void = () => {}
        const asyncOnResultPromise = new Promise<void>((resolve) => {
          resolveOnResult = resolve
        })

        onResult.mockImplementation(() => asyncOnResultPromise)

        cleanup = startMatchGenerator(onPending, onResult, 5000)

        // Initialize first tick
        await vi.advanceTimersByTimeAsync(0)

        expect(onPending).toHaveBeenCalledTimes(1)

        // Advance to the end of the betting duration
        await vi.advanceTimersByTimeAsync(3000)

        expect(onResult).toHaveBeenCalledTimes(1)

        // Advance past the next scheduled interval while onResult is still pending
        await vi.advanceTimersByTimeAsync(10000)

        // Verify the generator remains suspended until onResult resolves
        expect(onPending).toHaveBeenCalledTimes(1)

        // Resolve the pending result callback
        resolveOnResult()

        // Flush the promise chain so the generator can schedule the next tick
        await vi.advanceTimersByTimeAsync(0)

        expect(onPending).toHaveBeenCalledTimes(2)
      })
    })

    describe('timing', () => {
      it('should progress to results and clear memory after betting duration expires', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        cleanup = startMatchGenerator(onPending, onResult, 5000)
        await vi.advanceTimersByTimeAsync(0)

        expect(getActivePendingMatch()).not.toBeNull()

        await vi.advanceTimersByTimeAsync(3000)

        expect(getActivePendingMatch()).toBeNull()
        expect(onResult).toHaveBeenCalledTimes(1)
      })

      it('should schedule sequential ticks maintaining the configured interval timing', async () => {
        cleanup = startMatchGenerator(onPending, onResult, 5000)

        await vi.advanceTimersByTimeAsync(0)
        expect(onPending).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(5000)
        expect(onPending).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('getActivePendingMatch', () => {
    it('should return null initially when no generator is active', () => {
      expect(getActivePendingMatch()).toBeNull()
    })
  })
})
