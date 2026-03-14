import type { Match } from '../types/rps.js'
import { EventSource } from 'eventsource'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const API_BASE = process.env.RPS_API_BASE
const TOKEN = process.env.RPS_API_TOKEN

if (!API_BASE) throw new Error('RPS_API_BASE is not defined in .env')
if (!TOKEN) throw new Error('RPS_API_TOKEN is not defined in .env')

interface ApiResponse {
  data: Match[]
  cursor?: string
}

// History and live matches are kept separate to avoid sort issues
// on large arrays where V8's TimSort fast-path breaks down.
// Live matches are always newer so they're simply prepended, no sort needed.
interface Cache {
  history: Match[] // fetched from /history, stable, saved to disk
  live: Match[] // from SSE stream, grows at runtime, resets on restart
  fetchedAt: number
}

let cache: Cache | null = null

// Prevents multiple simultaneous full fetches if fetchAllMatches
// is called concurrently before the first fetch completes
let fetchInProgress: Promise<Cache> | null = null

const CACHE_DIR = './cache'
const CACHE_FILE = join(CACHE_DIR, 'matches.json')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Normalize match data on ingest to handle API inconsistencies:
// - time can be a UTC string, seconds, or milliseconds
// - played values can be mixed case (e.g. "Scissors" instead of "SCISSORS")
const normalizeMatch = (match: Match): Match => ({
  ...match,
  time:
    typeof match.time === 'string'
      ? new Date(match.time as string).getTime()
      : (match.time as number) < 10_000_000_000
        ? (match.time as number) * 1000
        : (match.time as number),
  playerA: {
    ...match.playerA,
    played: match.playerA.played.toUpperCase()
  },
  playerB: {
    ...match.playerB,
    played: match.playerB.played.toUpperCase()
  }
})

// Load history cache from disk if it exists
// This avoids re-fetching 300+ pages on every server restart
const loadDiskCache = async (): Promise<Cache | null> => {
  try {
    if (!existsSync(CACHE_FILE)) return null
    const raw = await readFile(CACHE_FILE, 'utf-8')
    const saved = JSON.parse(raw) as Cache
    console.log(
      `Disk cache loaded , ${saved.history.length} history matches (age: ${Math.round((Date.now() - saved.fetchedAt) / 60000)}min)`
    )
    return saved
  } catch (err) {
    console.warn('Failed to load disk cache:', err)
    return null
  }
}

// Only history is persisted to disk, live matches reset on restart
// and are refilled by the SSE stream
const saveDiskCache = async (data: Cache): Promise<void> => {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(
      CACHE_FILE,
      JSON.stringify({
        history: data.history,
        live: [],
        fetchedAt: data.fetchedAt
      })
    )
    console.log(`Disk cache saved, ${data.history.length} history matches`)
  } catch (err) {
    console.warn('Failed to save disk cache:', err)
  }
}

// Fetch a single page from the API with exponential backoff retry
// The Reaktor API is intentionally unreliable, 429, 500, 503 are common
// Retries indefinitely with increasing wait times up to 60s max
const fetchPage = async (endpoint: string): Promise<ApiResponse> => {
  let retries = 0

  while (true) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      })

      // Rate limit or server errors, wait and retry same page
      if (res.status === 429 || res.status === 500 || res.status === 503) {
        retries++
        const wait = Math.min(5000 * retries, 60000)
        console.warn(
          `${res.status} on ${endpoint} (attempt ${retries}), waiting ${wait / 1000}s...`
        )
        await sleep(wait)
        continue
      }

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)

      retries = 0
      return (await res.json()) as ApiResponse
    } catch (err) {
      // Network level errors (timeout, DNS, etc), also retry with backoff
      retries++
      const wait = Math.min(5000 * retries, 60000)
      console.error(
        `Network error (attempt ${retries}), waiting ${wait / 1000}s...`,
        err
      )
      await sleep(wait)
    }
  }
}

// Full paginated fetch from the API, slow, only runs when no valid cache exists
// Uses a promise lock to prevent duplicate concurrent fetches
const fetchFull = async (): Promise<Cache> => {
  if (fetchInProgress) {
    console.log('Fetch already in progress , waiting for it to complete')
    return fetchInProgress
  }

  fetchInProgress = (async () => {
    console.log('Fetching all matches from API...')
    const all: Match[] = []
    let endpoint = '/history'
    let page = 1

    while (true) {
      console.log(`Fetching page ${page}...`)
      const json = await fetchPage(endpoint)
      // update cache incrementally, preserve existing live matches
      cache = { history: all, live: cache?.live ?? [], fetchedAt: Date.now() }
      // Normalize each match on ingest so all downstream code gets clean data
      all.push(...json.data.map(normalizeMatch))
      console.log(
        `Page ${page} fetched , ${json.data.length} matches (total so far: ${all.length})`
      )

      if (!json.cursor) break
      endpoint = json.cursor
      page++

      // Small delay between pages to avoid triggering rate limits
      await sleep(200)
    }

    const newCache: Cache = { history: all, live: [], fetchedAt: Date.now() }
    cache = newCache
    await saveDiskCache(cache)
    fetchInProgress = null
    return cache
  })()

  return fetchInProgress
}

// Returns all matches as [live, ...history] , live first, no sort needed
// since live matches are always newer than history matches
export const fetchAllMatches = async (): Promise<Match[]> => {
  const dedup = (matches: Match[]): Match[] => {
    const seen = new Set<string>()
    return matches.filter((m) => {
      if (seen.has(m.gameId)) return false
      seen.add(m.gameId)
      return true
    })
  }

  // 1. fastest, already in memory from this session
  if (cache) {
    return dedup([...cache.live, ...cache.history])
  }
  // 2. fast, load from disk
  const diskCache = await loadDiskCache()
  if (diskCache) {
    cache = { ...diskCache, live: [] }
    return dedup([...cache.live, ...cache.history])
  }
  // 3. slow, no cache at all, kick off full fetch but return empty immediately
  if (!fetchInProgress) {
    fetchFull()
  }
  return []
}

// Connect to the Reaktor live SSE stream
// New matches are prepended to the live array, no sort needed
// Disk cache updated every 100 live matches to stay fresh on restart
export const startLiveStream = (onMatch: (match: Match) => void): void => {
  let liveMatchCount = 0

  const connect = () => {
    // Standard EventSource doesn't support custom headers
    // The eventsource npm package allows passing a custom fetch with Bearer token
    const eventSource = new EventSource(`${API_BASE}/live`, {
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          headers: {
            ...init?.headers,
            Authorization: `Bearer ${TOKEN}`
          }
        })
    })

    eventSource.onopen = () => {
      console.log('SSE connected to live stream')
    }

    eventSource.onmessage = (event) => {
      try {
        // Normalize live matches the same way as history matches
        const match = normalizeMatch(JSON.parse(event.data) as Match)

        if (cache) {
          // Prepend so newest live matches are always at the front
          cache.live.unshift(match)
          liveMatchCount++

          // Persist to disk every 100 live matches
          // so restarts don't lose too much recent data
          if (liveMatchCount % 100 === 0) {
            console.log(`Persisting ${liveMatchCount} live matches to disk...`)
            saveDiskCache(cache)
          }
        } else {
          // Shouldn't happen since fetchAllMatches is awaited before
          // startLiveStream is called in app.ts , but just in case
          console.warn(
            'Live match received but cache not yet populated , skipping'
          )
        }

        onMatch(match)
      } catch (err) {
        console.error('Failed to parse live event:', err)
      }
    }

    // SSE connection dropped, reconnect after 5s
    // This handles network blips and Reaktor API restarts
    eventSource.onerror = (err) => {
      console.error('SSE connection lost, reconnecting in 5s...', err)
      eventSource.close()
      setTimeout(connect, 5000)
    }
  }

  connect()
}
