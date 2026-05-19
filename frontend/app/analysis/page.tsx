'use client'

import InfoIcon from '@/components/icons/InfoIcon'
import { logger } from '@/lib/logger'
import { useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface HistoryItem {
  id: number
  query: string
  result: string
  source?: string
  timestamp: number
}

const SUGGESTIONS = [
  'Is the house bleeding money?',
  'Risk-reward ratio for Top 5?',
  'Move heat map, latest matches?',
  'How high are the stakes now?',
  '#1 player vs the rest of Top 5?',
  'Who has the longest win streak?'
]

const SOURCE_STYLES: Record<string, string> = {
  active_match_history: 'bg-blue-50 text-blue-600 border-blue-200',
  predictor_leaderboard: 'bg-amber-50 text-amber-600 border-amber-200',
  league_telemetry: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  flash_event_stats: 'bg-purple-50 text-purple-600 border-purple-200'
}

export default function AnalysisPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResult, setCurrentResult] = useState<string | null>(null)
  const [currentSource, setCurrentSource] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false)
  const [placeholder, setPlaceholder] = useState('Ask the Oracle...')

  useEffect(() => {
    const handleResize = () => {
      setPlaceholder(
        window.innerWidth < 640
          ? 'Ask the Oracle...'
          : 'Ask about streaks, volume, or players...'
      )
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('aiQueryHistory')
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const handleAsk = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault()
    const activeQuery = overrideQuery || query
    if (!activeQuery.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setCurrentResult(data.result)
      setCurrentSource(data.source)

      // Keep only the 5 most recent queries - avoids unbounded localStorage growth
      const newHistory: HistoryItem[] = [
        {
          id: Date.now(),
          query: activeQuery,
          result: data.result,
          source: data.source,
          timestamp: Date.now()
        },
        ...history
      ].slice(0, 5)

      setHistory(newHistory)
      localStorage.setItem('aiQueryHistory', JSON.stringify(newHistory))
      if (!overrideQuery) setQuery('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred'
      logger.error('Oracle query failed', err instanceof Error ? err : undefined, {
        query: activeQuery
        })
        setError(message)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('aiQueryHistory')
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest">
            Powered by Gemini
          </span>

          <div className="relative group flex items-center">
            <button
              type="button"
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
              onBlur={() => setShowPrivacyInfo(false)}
              className="text-indigo-300 hover:text-indigo-600 transition-colors p-1 outline-none sm:pointer-events-none"
              aria-label="Privacy information"
            >
              <InfoIcon />
            </button>

            <div
              className={`absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mb-2
                w-48 sm:w-56 p-2.5 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-xl
                transition-opacity duration-200 z-50 text-center tracking-wide leading-relaxed
                ${showPrivacyInfo ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto`}
            >
              Prompts are logged for safety monitoring. IP addresses are masked
              and no personal data is stored.
              <div className="absolute right-2 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">The Oracle</h1>
      </div>

      <div className="relative mb-6">
        <div
          className="overflow-x-auto sm:overflow-x-visible pb-1 scrollbar-none"
          style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}
        >
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap pr-12 sm:pr-0">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleAsk(undefined, s)}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm whitespace-nowrap shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-12 bg-linear-to-l from-white to-transparent sm:hidden" />
      </div>

      <form onSubmit={handleAsk} className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 pr-24 sm:p-5 sm:pr-32 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none text-base sm:text-lg shadow-xl"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-3 top-3 bottom-3 px-6 bg-gray-900 text-white font-bold rounded-xl hover:bg-indigo-600 disabled:bg-gray-200 transition-all"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {currentResult && (
        <div className="p-6 sm:p-8 mb-10 bg-white rounded-3xl border-2 border-indigo-500 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">
                Oracle Insight
              </span>
            </div>

            {currentSource && (
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border self-start sm:self-auto ${
                  SOURCE_STYLES[currentSource] ??
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {currentSource.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <p className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium italic">
            &quot;{currentResult}&quot;
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Recent Prophecies
            </h2>
            <button
              onClick={clearHistory}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase font-bold"
            >
              Clear
            </button>
          </div>

          <div className="grid gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group"
                onClick={() => {
                  setCurrentResult(item.result)
                  setCurrentSource(item.source ?? null)
                }}
              >
                <p className="text-xs font-bold text-gray-400 mb-1">
                  Q: {item.query}
                </p>
                <p className="text-sm text-gray-600 line-clamp-1 group-hover:text-gray-900">
                  {item.result}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
