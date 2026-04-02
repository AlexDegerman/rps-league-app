import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import pool from '../utils/db.js'
import * as matchService from '../services/matchService.js'
import { mockDbResponse } from '../test/setup.js'

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

describe('Analysis Route - The Shield', () => {
  const mockDb = vi.mocked(pool.query)
  const mockMatches = vi.mocked(matchService.getLatestMatches)

  beforeEach(() => {
    vi.clearAllMocks()
    mockMatches.mockResolvedValue({ matches: [], total: 0, hasMore: false })
    mockDb.mockResolvedValue(
      mockDbResponse([
        {
          total_volume: '1000',
          win_count: '5',
          total_count: '10'
        }
      ])
    )
  })

  it('should rotate models if the primary fails with 503', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({ response: { text: () => 'Fallback Success' } })

    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '1.1.1.1') // Unique IP
      .send({ query: 'Who is the goat?' })

    expect(res.status).toBe(200)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it('should return 500 when all AI models fail', async () => {
    mockGenerateContent.mockRejectedValue(new Error('All models 503'))

    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '2.2.2.2') // Fresh IP
      .send({ query: 'Crash me' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('The Oracle is currently blinded by the stars.')
  })

  it('should serve results from cache for identical queries', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Cached answer' }
    })

    const q = { query: 'UniqueCacheQuery' }
    await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '3.3.3.3')
      .send(q)
    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', '3.3.3.3')
      .send(q)

    expect(res.body.cached).toBe(true)
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('should enforce rate limits (429) after 5 requests', async () => {
    const testIp = '4.4.4.4'
    // Send 5 requests
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/analysis')
        .set('x-forwarded-for', testIp)
        .send({ query: `limit-test-${i}` })
    }

    // The 6th should fail
    const res = await request(app)
      .post('/analysis')
      .set('x-forwarded-for', testIp)
      .send({ query: 'one-too-many' })

    expect(res.status).toBe(429)
    expect(res.body.error).toContain('The Oracle is annoyed')
  })
})
