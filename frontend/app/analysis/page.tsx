'use client'

import { useState, useEffect } from 'react'

// 1. Centralize the API Base
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// 2. Proper Type for History
interface HistoryItem {
  id: number
  query: string
  result: string
  timestamp: number
}

const SUGGESTIONS = [
  'Who is the most aggressive player today?',
  'What is the most overused move in the arena right now?',
  'Which player is on a winning streak?',
  'Who are the top 3 predictors to follow?',
  'Is the house bleeding money or printing it?'
]

export default function AnalysisPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResult, setCurrentResult] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

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
      // Use the API_BASE here
      const res = await fetch(`${API_BASE}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'The Oracle is silent...')

      setCurrentResult(data.result)

      if (!overrideQuery) {
        const newHistory: HistoryItem[] = [
          {
            id: Date.now(),
            query: activeQuery,
            result: data.result,
            timestamp: Date.now()
          },
          ...history
        ].slice(0, 5)
        setHistory(newHistory)
        localStorage.setItem('aiQueryHistory', JSON.stringify(newHistory))
        setQuery('')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-4">
          Powered by Gemini 1.5
        </span>
        <h1 className="text-4xl font-black text-gray-900 mb-2">The Oracle</h1>
        <p className="text-gray-500">
          Real-time betting telemetry & player analysis.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleAsk(undefined, s)}
            className="text-xs bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleAsk} className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about streaks, volume, or players..."
          className="w-full p-5 pr-28 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-lg shadow-xl"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-3 top-3 bottom-3 px-6 bg-gray-900 text-white font-bold rounded-xl hover:bg-indigo-600 disabled:bg-gray-200 transition-all"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>

      {/* Error state is now being read here */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {currentResult && (
        <div className="p-8 mb-10 bg-white rounded-3xl border-2 border-indigo-500 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">
              Live Insight
            </span>
          </div>
          <p className="text-xl text-gray-800 leading-relaxed font-medium italic">
            &quot;{currentResult}&quot;
          </p>
        </div>
      )}

      {/* History rendering code... */}
    </div>
  )
}
