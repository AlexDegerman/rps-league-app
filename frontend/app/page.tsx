'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchLatestMatches } from '@/lib/api'
import MatchList from '@/components/MatchList'
import type { Match } from '@/types/rps'

const LIMIT = 20

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const pageRef = useRef(1)
  const initialLoadRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadMatches = useCallback(async (targetPage: number) => {
    if (targetPage === 1) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const data = await fetchLatestMatches(targetPage, LIMIT)
      setMatches(prev => {
        if (targetPage === 1) return data.matches
        const existingIds = new Set(prev.map((m: Match) => m.gameId))
        const unique = data.matches.filter((m: Match) => !existingIds.has(m.gameId))
        return [...prev, ...unique]
      })
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Failed to load matches:', err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Poll for new matches every 5 seconds
  useEffect(() => {
    const poll = async () => {
      console.log('Polling for new matches...')
      try {
        const data = await fetchLatestMatches(1, LIMIT)
        setMatches(prev => {
          const existingIds = new Set(prev.map(m => m.gameId))
          const newOnes = data.matches.filter((m: Match) => !existingIds.has(m.gameId))
          if (newOnes.length === 0) return prev
          return [...newOnes, ...prev]
        })
      } catch (err) {
        console.error('Poll failed:', err)
      }
    }

    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [])

  const loadNextPage = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return
    pageRef.current += 1
    loadMatches(pageRef.current)
  }, [isLoading, isLoadingMore, hasMore, loadMatches])

  const checkIfMoreNeeded = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return
    if (document.documentElement.offsetHeight <= window.innerHeight * 1.2) {
      loadNextPage()
    }
  }, [isLoading, isLoadingMore, hasMore, loadNextPage])

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      if (isLoading || isLoadingMore || !hasMore) return
      const scrollPos = window.innerHeight + window.scrollY
      const docHeight = document.documentElement.offsetHeight
      if (scrollPos >= docHeight * 0.8) loadNextPage()
    }, 150)
  }, [isLoading, isLoadingMore, hasMore, loadNextPage])

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      loadMatches(1)
    }
  }, [loadMatches])

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest Matches</h1>
      <p className="text-gray-500 mb-6">Live results from the RPS League</p>

      {isLoading ? (
        <p className="text-center text-gray-400 py-12">Loading matches...</p>
      ) : matches.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No matches found</p>
      ) : (
        <MatchList
          matches={matches}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
      )}
    </div>
  )
}