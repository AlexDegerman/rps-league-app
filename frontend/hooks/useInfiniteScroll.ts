import { useState, useRef, useCallback, useEffect } from 'react'
import type { Match } from '@/types/rps'
import { logger } from '@/lib/logger'

interface UseInfiniteScrollProps {
  fetchFn: (
    page: number
  ) => Promise<{ matches: Match[]; hasMore: boolean } | null>
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
  const generationRef = useRef(0)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef({ isLoading, isLoadingMore, hasMore, enabled })

  useEffect(() => {
    stateRef.current = { isLoading, isLoadingMore, hasMore, enabled }
  })

  const loadMatches = useCallback(
    async (targetPage: number) => {
      const generation = generationRef.current
      if (targetPage === 1) setIsLoading(true)
      else setIsLoadingMore(true)

      try {
        const data = await fetchFn(targetPage)
        if (generationRef.current !== generation) return

        if (!data) {
          setHasMore(false)
          return
        }

        setMatches((prev) => {
          if (targetPage === 1) return data.matches
          // Dedup by gameId to guard against SSE races delivering a match
          // both via polling and the live stream simultaneously
          const existingIds = new Set(prev.map((m) => m.gameId))
          const unique = data.matches.filter((m) => !existingIds.has(m.gameId))
          return [...prev, ...unique]
        })

        setHasMore(data.hasMore ?? false)
      } catch (err) {
        if (generationRef.current === generation) {
          logger.warn('Failed to load matches', { error: String(err) })
        }
      } finally {
        if (generationRef.current === generation) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [fetchFn]
  )

  const loadNextPage = useCallback(() => {
    const {
      isLoading: l,
      isLoadingMore: lm,
      hasMore: h,
      enabled: e
    } = stateRef.current
    if (l || lm || !h || !e) return
    pageRef.current += 1
    loadMatches(pageRef.current)
  }, [loadMatches])

  const reset = useCallback(() => {
    generationRef.current++
    pageRef.current = 1
    setMatches([])
    setHasMore(true)
  }, [])

  // After initial load, check if the page is too short to trigger scroll events -
  // if so, proactively fetch the next page to fill the viewport
  const checkIfMoreNeeded = useCallback(() => {
    const {
      isLoading: l,
      isLoadingMore: lm,
      hasMore: h,
      enabled: e
    } = stateRef.current
    if (l || lm || !h || !e) return
    if (document.documentElement.offsetHeight <= window.innerHeight * 1.2) {
      loadNextPage()
    }
  }, [loadNextPage])

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    // Debounce at 150ms to avoid firing on every pixel of scroll momentum
    scrollTimeoutRef.current = setTimeout(() => {
      const {
        isLoading: l,
        isLoadingMore: lm,
        hasMore: h,
        enabled: e
      } = stateRef.current
      if (l || lm || !h || !e) return
      const scrollPos = window.innerHeight + window.scrollY
      const docHeight = document.documentElement.offsetHeight
      if (scrollPos >= docHeight * 0.8) loadNextPage()
    }, 150)
  }, [loadNextPage])

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
