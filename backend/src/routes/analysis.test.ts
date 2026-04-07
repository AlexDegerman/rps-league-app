import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import pool from '../utils/db.js'
import * as matchService from '../services/matchService.js'
import { mockDbResponse } from '../test/setup.js'

// Hoist before any imports so the mock is in place when analysis.js loads
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn()
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      })
    }
  })
}))

import analysisRouter from './analysis.js'

vi.mock('../services/matchService.js', () => ({
  getLatestMatches: vi.fn()
}))

const app = express()
app.use(express.json())
app.use('/analysis', analysisRouter)

describe('Analysis Route', () => {
  const mockDb = vi.mocked(pool.query)
  const mockMatches = vi.mocked(matchService.getLatestMatches)

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatches.mockResolvedValue({ matches: [], total: 0, hasMore: false })
    mockDb.mockResolvedValue(
      mockDbResponse([
        { total_volume: '1000', win_count: '5', total_count: '10' }
      ])
    )
  })

  it('falls back to secondary model when primary returns 503', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({ response: { text: () => 'Fallback Success' } })

    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '1.1.1.1')
      .send({ query: 'Who is the goat?' })

    expect(res.status).toBe(200)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it('returns 500 with oracle error message when all models fail', async () => {
    mockGenerateContent.mockRejectedValue(new Error('All models 503'))

    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '2.2.2.2')
      .send({ query: 'Crash me' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('The Oracle is currently blinded by the stars.')
  })

  it('serves cached result on identical query without calling AI again', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Cached answer' }
    })

    const payload = { query: 'UniqueCacheQuery' }
    await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '3.3.3.3')
      .send(payload)
    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '3.3.3.3')
      .send(payload)

    expect(res.body.cached).toBe(true)
    // AI should only have been called once — second request hit the cache
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('returns 429 after exceeding the per-IP rate limit', async () => {
    const testIp = '4.4.4.4'
    // Exhaust the limit (5 requests)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/analysis')
        .set('x-forwarded-for', testIp)
        .send({ query: `limit-test-${i}` })
    }

    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', testIp)
      .send({ query: 'one-too-many' })

    expect(res.status).toBe(429)
    expect(res.body.error).toContain('The Oracle is annoyed')
  })
})
