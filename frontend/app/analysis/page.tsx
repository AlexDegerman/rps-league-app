'use client'

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
  'Is the house bleeding money or printing it?',
  'Analyze the current risk-to-reward ratio for the Top 5 leaders.',
  'What is the current "Heat Map" of moves in the latest matches?',
  'Based on the total league volume, how high are the stakes right now?',
  'Compare the dominance of the #1 ranked player against the rest of the Top 5.'
]

export default function AnalysisPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResult, setCurrentResult] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [currentSource, setCurrentSource] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('aiQueryHistory')
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

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {currentResult && (
        <div className="p-8 mb-10 bg-white rounded-3xl border-2 border-indigo-500 shadow-2xl relative overflow-hidden">
          {/* Source Badge */}
          {currentSource && (
            <div className="absolute top-4 right-4">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                  currentSource === 'active_match_history'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : currentSource === 'predictor_leaderboard'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {currentSource.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">
              Oracle Insight
            </span>
          </div>

          <p className="text-xl text-gray-800 leading-relaxed font-medium italic">
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
                onClick={() => setCurrentResult(item.result)}
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
