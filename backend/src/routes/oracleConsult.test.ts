import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import pool from '../utils/db.js'
import * as matchService from '../services/matchService.js'
import type { GenerativeModel } from '@google/generative-ai'

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

// Mock the Gemini SDK so fallback behavior can be tested deterministically.
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

import oracleConsultRouter from './oracleConsult.js'

const app = express()
app.use(express.json())
app.use('/oracleConsult', oracleConsultRouter)

describe('Analysis Route', () => {
  const mockDb = vi.mocked(pool.query)
  const mockMatches = vi.mocked(matchService.getLatestMatches)

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatches.mockResolvedValue({
      matches: [],
      hasMore: false
    } as unknown as MatchesReturnType)
    // Mock the Gemini SDK so fallback behavior can be tested deterministically.
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
          rows = [
            {
              total_count: '10',
              total_volume: '1000',
              win_count: '5'
            }
          ]
        }
      } else if (sql.includes('matches')) {
        if (sql.includes('player_a_played')) {
          rows = [
            {
              name: 'BotA',
              wins: '5'
            }
          ]
        } else {
          rows = [
            {
              count: '15'
            }
          ]
        }
      } else if (sql.includes('users')) {
        rows = [
          {
            nickname: 'User1',
            points: 1000
          }
        ]
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

  it('falls back to secondary model when primary returns 503', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({
        response: { text: () => 'Fallback Success [SOURCE: league_telemetry]' }
      })

    const res = await request(app)
      .post('/oracleConsult')
      .set('x-forwarded-for', '1.1.1.1')
      .send({ query: 'Who is the goat?' })

    expect(res.status).toBe(200)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it('returns 500 with oracle error message when all models fail', async () => {
    mockGenerateContent.mockRejectedValue(new Error('All models 503'))

    const res = await request(app)
      .post('/oracleConsult')
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
      .post('/oracleConsult')
      .set('x-forwarded-for', '3.3.3.3')
      .send(payload)
    const res = await request(app)
      .post('/oracleConsult')
      .set('x-forwarded-for', '3.3.3.3')
      .send(payload)

    expect(res.body.cached).toBe(true)
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('returns 429 after exceeding the per-IP rate limit', async () => {
    const testIp = '4.4.4.4'
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/oracleConsult')
        .set('x-forwarded-for', testIp)
        .send({ query: `limit-test-${i}` })
    }

    const res = await request(app)
      .post('/oracleConsult')
      .set('x-forwarded-for', testIp)
      .send({ query: 'one-too-many' })

    expect(res.status).toBe(429)
    expect(res.body.error).toContain('RATE_LIMITED')
  })

  it('returns 400 when query length exceeds 500 characters', async () => {
    const longQuery = 'a'.repeat(501)
    const res = await request(app)
      .post('/oracleConsult')
      .set('x-forwarded-for', '5.5.5.5')
      .send({ query: longQuery })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('QUERY_TOO_LONG')
  })

  it('bypasses AI and returns system override when financial intent is detected', async () => {
    const res = await request(app)
      .post('/oracleConsult')
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
      .post('/oracleConsult')
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
      .post('/oracleConsult')
      .set('x-forwarded-for', '8.8.8.8')
      .send({ query: 'Who won the last match?' })

    expect(res.status).toBe(200)
    expect(res.body.source).toBe('active_match_history')
    expect(res.body.result).toBe('First. Second.')
  })
})
