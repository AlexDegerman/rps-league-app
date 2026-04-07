import { useState, useRef, useCallback, useEffect } from 'react'
import type { Match } from '@/types/rps'

interface UseInfiniteScrollProps {
  fetchFn: (page: number) => Promise<{ matches: Match[]; hasMore: boolean }>
  enabled?: boolean
}

export const useInfiniteScroll = ({
  fetchFn,
  enabled = true
}: UseInfiniteScrollProps) => {
  const [matches, setMatches] = useState<Match[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const pageRef = useRef(1)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadMatches = useCallback(
    async (targetPage: number) => {
      if (targetPage === 1) setIsLoading(true)
      else setIsLoadingMore(true)

      try {
        const data = await fetchFn(targetPage)
        setMatches((prev) => {
          if (targetPage === 1) return data.matches
          // Dedup by gameId to guard against SSE races delivering a match
          // both via polling and the live stream simultaneously
          const existingIds = new Set(prev.map((m) => m.gameId))
          const unique = data.matches.filter((m) => !existingIds.has(m.gameId))
          return [...prev, ...unique]
        })
        setHasMore(data.hasMore)
      } catch (err) {
        console.error('Failed to load matches:', err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [fetchFn]
  )

  const loadNextPage = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || !enabled) return
    pageRef.current += 1
    loadMatches(pageRef.current)
  }, [isLoading, isLoadingMore, hasMore, enabled, loadMatches])

  const reset = useCallback(() => {
    pageRef.current = 1
    setMatches([])
    setHasMore(true)
  }, [])

  // After initial load, check if the page is too short to trigger scroll events —
  // if so, proactively fetch the next page to fill the viewport
  const checkIfMoreNeeded = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || !enabled) return
    if (document.documentElement.offsetHeight <= window.innerHeight * 1.2) {
      loadNextPage()
    }
  }, [isLoading, isLoadingMore, hasMore, enabled, loadNextPage])

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    // Debounce at 150ms to avoid firing on every pixel of scroll momentum
    scrollTimeoutRef.current = setTimeout(() => {
      if (isLoading || isLoadingMore || !hasMore || !enabled) return
      const scrollPos = window.innerHeight + window.scrollY
      const docHeight = document.documentElement.offsetHeight
      if (scrollPos >= docHeight * 0.8) loadNextPage()
    }, 150)
  }, [isLoading, isLoadingMore, hasMore, enabled, loadNextPage])

  useEffect(() => {
    if (matches.length > 0) {
      const timer = setTimeout(checkIfMoreNeeded, 500)
      return () => clearTimeout(timer)
    }
  }, [matches.length, checkIfMoreNeeded])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [handleScroll])

  return {
    matches,
    setMatches,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMatches,
    loadNextPage,
    reset
  }
}
