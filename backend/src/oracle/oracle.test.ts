import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import pool from '../utils/db.js'
import * as matchService from '../services/matchService.js'
import type { GenerativeModel } from '@google/generative-ai'
import {
  getOracleState,
  resetOracle,
  hasUserUsedOracle,
  consumeOracleForUser
} from '../services/oracleProphecyService.js'

type DbQueryResult = Awaited<ReturnType<typeof pool.query>>
type MatchesReturnType = Awaited<
  ReturnType<typeof matchService.getLatestMatches>
>

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn()
}))

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      } as unknown as GenerativeModel)
    }
  })
}))

vi.mock('../services/matchService.js', () => ({
  getLatestMatches: vi.fn()
}))

import oracleRouter from '../routes/oracle.js'

const app = express()
app.use(express.json())
app.use('/oracleConsult', oracleRouter)

describe('Oracle', () => {
  const mockDb = vi.mocked(pool.query)
  const mockMatches = vi.mocked(matchService.getLatestMatches)

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatches.mockResolvedValue({
      matches: [],
      hasMore: false
    } as unknown as MatchesReturnType)

    mockDb.mockImplementation(async (sql: string) => {
      let rows: Record<string, unknown>[] = []
      if (sql.includes('predictions')) {
        if (sql.includes('flash_event_type')) {
          rows = [
            {
              total_flash_events: '2',
              unique_event_types: '1',
              most_common_event: 'MULTIPLIER',
              highest_multiplier_seen: '2',
              flash_event_wins: '1'
            }
          ]
        } else {
          rows = [{ total_count: '10', total_volume: '1000', win_count: '5' }]
        }
      } else if (sql.includes('matches')) {
        if (sql.includes('player_a_played')) {
          rows = [{ name: 'BotA', wins: '5' }]
        } else {
          rows = [{ count: '15' }]
        }
      } else if (sql.includes('users')) {
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

  describe('Consultation API', () => {
    it('falls back to secondary model when primary returns 503', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('503 Service Unavailable'))
        .mockResolvedValueOnce({
          response: {
            text: () => 'Fallback Success [SOURCE: league_telemetry]'
          }
        })

      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '1.1.1.1')
        .send({ query: 'Who is the goat?' })

      expect(res.status).toBe(200)
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })

    it('returns 500 with oracle error message when all models fail', async () => {
      mockGenerateContent.mockRejectedValue(new Error('All models 503'))

      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '2.2.2.2')
        .send({ query: 'Crash me' })

      expect(res.status).toBe(500)
      expect(res.body.error).toBe('SYSTEM_ERROR')
    })

    it('serves cached result on identical query without calling AI again', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'Cached answer [SOURCE: league_telemetry]' }
      })

      const payload = { query: 'UniqueCacheQuery' }
      await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '3.3.3.3')
        .send(payload)
      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '3.3.3.3')
        .send(payload)

      expect(res.body.cached).toBe(true)
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    })

    it('returns 429 after exceeding the per-IP rate limit', async () => {
      const testIp = '4.4.4.4'
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/oracleConsult/consult')
          .set('x-forwarded-for', testIp)
          .send({ query: `limit-test-${i}` })
      }

      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', testIp)
        .send({ query: 'one-too-many' })

      expect(res.status).toBe(429)
      expect(res.body.error).toContain('RATE_LIMITED')
    })

    it('returns 400 when query length exceeds 500 characters', async () => {
      const longQuery = 'a'.repeat(501)
      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '5.5.5.5')
        .send({ query: longQuery })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('QUERY_TOO_LONG')
    })

    it('bypasses AI and returns system override when financial intent is detected', async () => {
      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '6.6.6.6')
        .send({ query: 'How do I cashout?' })

      expect(res.status).toBe(200)
      expect(res.body.source).toBe('system_override')
      expect(res.body.result).toContain(
        'Points are strictly virtual telemetry metrics'
      )
      expect(mockGenerateContent).not.toHaveBeenCalled()
    })

    it('clips to maximum 3 sentences and strips tag for game_knowledge source', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'One. Two. Three. Four. Five. [SOURCE: game_knowledge]'
        }
      })

      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '7.7.7.7')
        .send({ query: 'Explain relic rules' })

      expect(res.status).toBe(200)
      expect(res.body.source).toBe('game_knowledge')
      expect(res.body.result).toBe('One. Two. Three.')
    })

    it('clips to maximum 2 sentences and strips tag for other sources', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            'First. Second. Third. Fourth. [SOURCE: active_match_history]'
        }
      })

      const res = await request(app)
        .post('/oracleConsult/consult')
        .set('x-forwarded-for', '8.8.8.8')
        .send({ query: 'Who won the last match?' })

      expect(res.status).toBe(200)
      expect(res.body.source).toBe('active_match_history')
      expect(res.body.result).toBe('First. Second.')
    })
  })

  describe('Daily Prophecy', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('Service', () => {
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
      it('GET /oracleConsult should return the current prophecy state', async () => {
        vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
        const res = await request(app)
          .get('/oracleConsult')
          .query({ userId: 'User1' })

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('side')
        expect(res.body).toHaveProperty('date')
        expect(res.body).toHaveProperty('used')
      })

      it('GET /oracleConsult should return used: true if the user has already used it today', async () => {
        vi.setSystemTime(new Date('2026-07-10T12:00:00Z'))
        mockDb.mockResolvedValueOnce({
          rows: [
            {
              joined_date: new Date('2026-07-09T12:00:00Z').getTime(),
              oracle_used_date: '2026-07-10'
            }
          ]
        } as any)

        const res = await request(app)
          .get('/oracleConsult')
          .query({ userId: 'User1' })

        expect(res.status).toBe(200)
        expect(res.body.used).toBe(true)
      })

      it('POST /oracleConsult/reset should return 401 Unauthorized if secret is incorrect', async () => {
        const res = await request(app)
          .post('/oracleConsult/reset')
          .set('x-reset-secret', 'invalid-secret')

        expect(res.status).toBe(401)
      })

      it('POST /oracleConsult/reset should reset and return 200 OK with correct secret', async () => {
        process.env.RESET_SECRET = 'test-secret'

        const res = await request(app)
          .post('/oracleConsult/reset')
          .set('x-reset-secret', 'test-secret')

        expect(res.status).toBe(200)
        expect(res.body.ok).toBe(true)
        expect(res.body).toHaveProperty('newSide')
      })
    })
  })
})
