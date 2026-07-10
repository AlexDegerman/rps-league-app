const CACHE_TTL = 1000 * 60 * 5

interface CacheEntry {
  result: string
  source: string
  timestamp: number
}

const queryCache = new Map<string, CacheEntry>()

export interface CacheHit {
  result: string
  source: string
}

export function getCached(key: string): CacheHit | null {
  const entry = queryCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    queryCache.delete(key)
    return null
  }
  return { result: entry.result, source: entry.source }
}

export function setCache(key: string, result: string, source: string): void {
  queryCache.set(key, { result, source, timestamp: Date.now() })
}

export function pruneCache(): void {
  const now = Date.now()
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) queryCache.delete(key)
  }
}

if (process.env.NODE_ENV !== 'test') {
  setInterval(pruneCache, 1000 * 60 * 60)
}
