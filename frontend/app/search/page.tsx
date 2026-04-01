'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  fetchMatchesByDate,
  fetchMatchesByPlayer,
  fetchPlayerNames
} from '@/lib/api'
import MatchList from '@/components/MatchList'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_MATCH_DATE = '2026-02-16'

type Tab = 'date' | 'player'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // --- State from URL ---
  const [tab, setTab] = useState<Tab>(
    (searchParams.get('type') as Tab) || 'date'
  )

  const [date, setDate] = useState('')
  const [hasDateSearched, setHasDateSearched] = useState(false)
  const [playerInput, setPlayerInput] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [hasPlayerSearched, setHasPlayerSearched] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync Tab to URL
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('type', newTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    // Clean up other tab state
    if (newTab === 'date') {
      resetPlayer()
      setHasPlayerSearched(false)
      setPlayerInput('')
      setSelectedPlayer('')
    } else {
      resetDate()
      setHasDateSearched(false)
      setDate('')
    }
  }

  useEffect(() => {
    fetchPlayerNames()
      .then(setPlayerNames)
      .catch((err) => console.error('Failed to load player names:', err))
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Infinite Scroll Hooks
  const dateFetchFn = useCallback(
    (page: number) => fetchMatchesByDate(date, page),
    [date]
  )
  const {
    matches: dateMatches,
    hasMore: dateHasMore,
    isLoading: dateIsLoading,
    isLoadingMore: dateIsLoadingMore,
    loadMatches: loadDateMatches,
    reset: resetDate
  } = useInfiniteScroll({ fetchFn: dateFetchFn, enabled: hasDateSearched })

  const playerFetchFn = useCallback(
    (page: number) => fetchMatchesByPlayer(selectedPlayer, page),
    [selectedPlayer]
  )
  const {
    matches: playerMatches,
    hasMore: playerHasMore,
    isLoading: playerIsLoading,
    isLoadingMore: playerIsLoadingMore,
    loadMatches: loadPlayerMatches,
    reset: resetPlayer
  } = useInfiniteScroll({ fetchFn: playerFetchFn, enabled: hasPlayerSearched })

  const handleDateSearch = () => {
    if (!date) return
    resetDate()
    setHasDateSearched(true)
    loadDateMatches(1)
  }

  const handlePlayerSelect = (name: string) => {
    setPlayerInput(name)
    setSelectedPlayer(name)
    setShowDropdown(false)
  }

  const handlePlayerSearch = () => {
    if (!selectedPlayer) return
    resetPlayer()
    setHasPlayerSearched(true)
    loadPlayerMatches(1)
  }

  const filteredPlayers = playerNames.filter((n) =>
    n.toLowerCase().includes(playerInput.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="py-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Search</h1>
        <p className="text-gray-500">Find matches by date or player</p>
      </div>

      <div className="sticky top-18.75 z-40 bg-gray-100 pb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTabChange('date')}
            className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${tab === 'date' ? 'bg-yellow-400 text-gray-900' : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'}`}
          >
            By Date
          </button>
          <button
            onClick={() => handleTabChange('player')}
            className={`px-4 py-2 rounded font-medium text-sm transition cursor-pointer ${tab === 'player' ? 'bg-yellow-400 text-gray-900' : 'bg-indigo-600 text-white hover:bg-yellow-400 hover:text-gray-900'}`}
          >
            By Player
          </button>
        </div>

        {tab === 'date' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  min={FIRST_MATCH_DATE}
                  max={TODAY}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800"
                />
              </div>
              <button
                onClick={handleDateSearch}
                disabled={!date || dateIsLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded font-medium text-sm disabled:opacity-50"
              >
                {dateIsLoading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>
        )}

        {tab === 'player' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative" ref={dropdownRef}>
                <label className="block text-xs text-gray-500 mb-1">
                  Player name
                </label>
                <input
                  type="text"
                  value={playerInput}
                  onChange={(e) => {
                    setPlayerInput(e.target.value)
                    setSelectedPlayer('')
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Type name..."
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800"
                />
                {showDropdown && filteredPlayers.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredPlayers.map((name) => (
                      <li
                        key={name}
                        onMouseDown={() => handlePlayerSelect(name)}
                        className="px-3 py-2 text-sm text-gray-800 hover:bg-indigo-50 cursor-pointer"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handlePlayerSearch}
                disabled={!selectedPlayer || playerIsLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded font-medium text-sm disabled:opacity-50"
              >
                {playerIsLoading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        {tab === 'date' ? (
          !hasDateSearched ? (
            <p className="text-center text-gray-400 py-12">Select a date</p>
          ) : dateIsLoading ? (
            <p className="text-center text-gray-400 py-12">Loading...</p>
          ) : dateMatches.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No matches found</p>
          ) : (
            <MatchList
              matches={dateMatches}
              isLoadingMore={dateIsLoadingMore}
              hasMore={dateHasMore}
            />
          )
        ) : !hasPlayerSearched ? (
          <p className="text-center text-gray-400 py-12">Select a player</p>
        ) : playerIsLoading ? (
          <p className="text-center text-gray-400 py-12">Loading...</p>
        ) : playerMatches.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No matches found</p>
        ) : (
          <MatchList
            matches={playerMatches}
            highlightPlayer={selectedPlayer}
            isLoadingMore={playerIsLoadingMore}
            hasMore={playerHasMore}
            alwaysLeft
          />
        )}
      </div>
    </div>
  )
}
