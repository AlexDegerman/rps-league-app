import { fetchAllMatches } from '../utils/apiClient.js'
import type { Match } from '../types/rps.js'

export const getLatestMatches = async (page: number, limit: number): Promise<{
  matches: Match[]
  total: number
  hasMore: boolean
}> => {
  const all = await fetchAllMatches()
  const start = (page - 1) * limit
  return {
    matches: all.slice(start, start + limit),
    total: all.length,
    hasMore: start + limit < all.length
  }
}