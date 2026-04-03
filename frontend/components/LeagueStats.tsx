'use client'

import { useState, useEffect } from 'react'
import { fetchDailyStats } from '@/lib/api'
import { formatPoints, getAmountColor } from '@/lib/format'

export default function LeagueStats() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const load = () => {
      fetchDailyStats()
        .then(setStats)
        .catch(console.error)
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-2 border-t border-gray-100 pt-2 w-fit">
      {/* Header Row */}
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
          📈 Today&apos;s Volume:{' '}
          <span className="text-gray-600">
            {stats ? formatPoints(stats.totalVolume) : '...'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="text-[10px] font-black text-purple-600 hover:bg-purple-100 transition-colors uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-100"
        >
          {isOpen ? '▴ HIDE' : '▾ STATS'}
        </button>
      </div>

      {isOpen && stats && (
        <div className="mt-1 p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm min-w-[240px]">
          {/* Row 1: Payout and MVP */}
          <div className="flex justify-between items-start gap-4 mb-2">
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 whitespace-nowrap">
                Daily Payout
              </p>
              <p className={`text-[11px] font-black ${
                stats.dailyPayout >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {stats.dailyPayout >= 0 ? '+' : ''}{formatPoints(stats.dailyPayout)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 whitespace-nowrap">
                Daily MVP
              </p>
              {stats.mvp ? (
                <p className="text-[11px] font-black text-purple-700 whitespace-nowrap">
                  {stats.mvp.nickname}{' '}
                  <span className={getAmountColor(stats.mvp.gain)}>
                    +{formatPoints(stats.mvp.gain)}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 italic">None</p>
              )}
            </div>
          </div>

          {/* Row 2: Bets and Win Rate */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 whitespace-nowrap">
                Daily Bets
              </p>
              <p className="text-[11px] font-black text-gray-600">
                {stats.totalBets.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5 whitespace-nowrap">
                Community Win %
              </p>
              <p className="text-[11px] font-black text-indigo-600">
                {stats.winRate}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}