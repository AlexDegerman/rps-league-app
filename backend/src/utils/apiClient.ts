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

interface Cache {
  data: Match[]
  fetchedAt: number
}

// In-memory cache, lost on restart, but fastest to access
let cache: Cache | null = null

// 24 hour TTL, disk cache older than this triggers a full re-fetch
const CACHE_TTL = 24 * 60 * 60_000
const CACHE_DIR = './cache'
const CACHE_FILE = join(CACHE_DIR, 'matches.json')

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Load cache from disk if it exists and hasn't expired
// This avoids re-fetching 300+ pages on every server restart
const loadDiskCache = async (): Promise<Cache | null> => {
  try {
    if (!existsSync(CACHE_FILE)) return null
    const raw = await readFile(CACHE_FILE, 'utf-8')
    const saved = JSON.parse(raw) as Cache
    if (Date.now() - saved.fetchedAt > CACHE_TTL) {
      console.log('Disk cache expired , will re-fetch')
      return null
    }
    console.log(`Disk cache loaded , ${saved.data.length} matches (age: ${Math.round((Date.now() - saved.fetchedAt) / 60000)}min)`)
    return saved
  } catch (err) {
    console.warn('Failed to load disk cache:', err)
    return null
  }
}

// Persist current cache to disk so restarts don't lose live match data
// Called once after initial full fetch, then every 100 live matches
const saveDiskCache = async (data: Cache): Promise<void> => {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(data))
    console.log(`Disk cache saved , ${data.data.length} matches`)
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
        console.warn(`${res.status} on ${endpoint} (attempt ${retries}), waiting ${wait / 1000}s...`)
        await sleep(wait)
        continue
      }

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)

      retries = 0 // reset on success
      return await res.json() as ApiResponse

    } catch (err) {
      // Network level errors (timeout, DNS, etc) , also retry with backoff
      retries++
      const wait = Math.min(5000 * retries, 60000)
      console.error(`Network error (attempt ${retries}), waiting ${wait / 1000}s...`, err)
      await sleep(wait)
    }
  }
}

// Main data access function used by all services
// Priority: memory cache → disk cache → full API fetch
export const fetchAllMatches = async (): Promise<Match[]> => {
  // 1. fastest, already in memory from this session
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    console.log(`Memory cache hit , ${cache.data.length} matches`)
    return cache.data
  }

  // 2. fast, load from disk, avoids full re-fetch on restart
  const diskCache = await loadDiskCache()
  if (diskCache) {
    cache = diskCache
    return cache.data
  }

  // 3. slow, full paginated fetch from API (300+ pages, several minutes)
  // Only happens when no valid cache exists
  console.log('Fetching all matches from API...')
  const all: Match[] = []
  let endpoint = '/history'
  let page = 1

  while (true) {
    console.log(`Fetching page ${page}...`)
    const json = await fetchPage(endpoint)

    all.push(...json.data)
    console.log(`Page ${page} fetched , ${json.data.length} matches (total so far: ${all.length})`)

    if (!json.cursor) break
    endpoint = json.cursor
    page++

    // Small delay between pages to avoid triggering rate limits
    await sleep(200)
  }

  cache = { data: all, fetchedAt: Date.now() }
  await saveDiskCache(cache)
  return cache.data
}

// Connect to the Reaktor live SSE stream
// New matches are appended to the in-memory cache in real time
// Disk cache is updated every 100 live matches to stay reasonably fresh
export const startLiveStream = (onMatch: (match: Match) => void): void => {
  let liveMatchCount = 0

  const connect = () => {
    // Standard EventSource doesn't support custom headers
    // The eventsource npm package allows passing a custom fetch with Bearer token
    const eventSource = new EventSource(`${API_BASE}/live`, {
      fetch: (url, init) => fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${TOKEN}`
        }
      })
    })

    eventSource.onmessage = (event) => {
      try {
        const match = JSON.parse(event.data) as Match

        if (cache) {
          cache.data.push(match)
          liveMatchCount++

          // Persist to disk every 100 live matches
          // so restarts don't lose too much recent data
          if (liveMatchCount % 100 === 0) {
            console.log(`Persisting ${liveMatchCount} live matches to disk...`)
            saveDiskCache(cache)
          }
        } else {
          // This shouldn't happen since we await fetchAllMatches before
          // calling startLiveStream in app.ts, but just in case
          console.warn('Live match received but cache not yet populated , skipping append')
        }

        onMatch(match)
      } catch (err) {
        console.error('Failed to parse live event:', err)
      }
    }

    // SSE connection dropped , reconnect after 5s
    // This handles network blips and Reaktor API restarts
    eventSource.onerror = (err) => {
      console.error('SSE connection lost, reconnecting in 5s...', err)
      eventSource.close()
      setTimeout(connect, 5000)
    }
  }

  connect()
}