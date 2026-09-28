import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import pool from '../../utils/db.js'
import {
  getOracleState,
  resetOracle,
  hasUserUsedOracle,
  consumeOracleForUser
} from '../../services/oracleProphecyService.js'

type DbQueryResult = Awaited<ReturnType<typeof pool.query>>

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import oracleRouter from '../../routes/oracle.js'

const app = express()
app.use(express.json())
app.use('/oracle', oracleRouter)

describe('Oracle Daily Prophecy', () => {
  const mockDb = vi.mocked(pool.query)

  beforeEach(() => {
    vi.clearAllMocks()

    mockDb.mockImplementation(async (sql: string) => {
      let rows: Record<string, unknown>[] = []
      if (sql.includes('users')) {
        if (sql.includes('oracle_used_date')) {
          rows = [
            {
              joined_date: new Date('2026-07-09T12:00:00Z').getTime(),
              oracle_used_date: '2026-07-09'
            }
          ]
        } else {
          rows = [{ nickname: 'User1', points: 1000 }]
        }
      }
      return {
        rows,
        command: '',
        rowCount: rows.length,
        oid: 0,
        fields: []
      } as unknown as DbQueryResult
    })
  })

  describe('Service', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns a valid initial state', () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      const state = getOracleState()
      expect(state.date).toBe('2026-07-10')
      expect(['left', 'right']).toContain(state.side)
    })

    it('automatically regenerates the state on a new day', () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      const firstState = getOracleState()
      expect(firstState.date).toBe('2026-07-10')

      vi.setSystemTime(new Date('2026-07-11T01:00:00Z'))
      const secondState = getOracleState()
      expect(secondState.date).toBe('2026-07-11')
    })

    it('resets the oracle with resetOracle()', () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      const oldState = getOracleState()
      resetOracle()
      const newState = getOracleState()
      expect(newState.date).toBe('2026-07-10')
    })

    it('returns true (blocked) if the user does not exist in the database', async () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      mockDb.mockResolvedValueOnce({ rows: [] } as any)

      const used = await hasUserUsedOracle('nonexistent_user')
      expect(used).toBe(true)
    })

    it('returns true (blocked) if the user joined today', async () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      const todayMs = new Date('2026-07-10T08:00:00Z').getTime()

      mockDb.mockResolvedValueOnce({
        rows: [{ joined_date: todayMs, oracle_used_date: null }]
      } as any)

      const used = await hasUserUsedOracle('newly_joined_user')
      expect(used).toBe(true)
    })

    it('returns false if the user joined yesterday and has not used it today', async () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      const yesterdayMs = new Date('2026-07-09T12:00:00Z').getTime()

      mockDb.mockResolvedValueOnce({
        rows: [{ joined_date: yesterdayMs, oracle_used_date: '2026-07-09' }]
      } as any)

      const used = await hasUserUsedOracle('active_user')
      expect(used).toBe(false)
    })

    it('updates the database when consumeOracleForUser is called', async () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      mockDb.mockResolvedValueOnce({ rowCount: 1 } as any)

      await consumeOracleForUser('test_user')

      expect(mockDb).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE users SET oracle_used_date = $1 WHERE user_id = $2'
        ),
        ['2026-07-10', 'test_user']
      )
    })
  })

  describe('API', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('GET /oracle should return the current prophecy state', async () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      const res = await request(app).get('/oracle').query({ userId: 'User1' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('side')
      expect(res.body).toHaveProperty('date')
      expect(res.body).toHaveProperty('used')
    })

    it('GET /oracle should return used: true if the user has already used it today', async () => {
      vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
      mockDb.mockResolvedValueOnce({
        rows: [
          {
            joined_date: new Date('2026-07-09T12:00:00Z').getTime(),
            oracle_used_date: '2026-07-10'
          }
        ]
      } as any)

      const res = await request(app).get('/oracle').query({ userId: 'User1' })

      expect(res.status).toBe(200)
      expect(res.body.used).toBe(true)
    })

    it('POST /oracle/reset should return 401 Unauthorized if secret is incorrect', async () => {
      const res = await request(app)
        .post('/oracle/reset')
        .set('x-reset-secret', 'invalid-secret')

      expect(res.status).toBe(401)
    })

    it('POST /oracle/reset should reset and return 200 OK with correct secret', async () => {
      process.env.RESET_SECRET = 'test-secret'

      const res = await request(app)
        .post('/oracle/reset')
        .set('x-reset-secret', 'test-secret')

      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
      expect(res.body).toHaveProperty('newSide')
    })
  })
})
