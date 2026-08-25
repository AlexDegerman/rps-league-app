import { vi, beforeEach, afterEach } from 'vitest'

vi.mock('../utils/db.js', () => ({
  default: {
    query: vi.fn()
  }
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-04-02T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

export const mockDbResponse = <T>(
  rows: T[]
): {
  rows: T[]
  rowCount: number
  command: string
  oid: number
  fields: unknown[]
} => ({
  rows,
  rowCount: rows.length,
  command: 'SELECT',
  oid: 0,
  fields: []
})