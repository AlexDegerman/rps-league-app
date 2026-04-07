'use client'

import { useState, useEffect } from 'react'
import { fetchDailyStats } from '@/lib/api'
import { formatPoints, getAmountColor } from '@/lib/format'

interface DailyStats {
  totalVolume: bigint
  dailyPayout: bigint
  winRate: number
  totalBets: number
  mvp: { nickname: string; gain: bigint } | null
}

export default function LiveStatsTicker() {
  const [stats, setStats] = useState<DailyStats | null>(null)

  useEffect(() => {
    const load = () => {
      fetchDailyStats()
        .then((data) => {
          setStats({
            ...data,
            totalVolume: BigInt(data.totalVolume),
            dailyPayout: BigInt(data.dailyPayout),
            mvp: data.mvp ? { ...data.mvp, gain: BigInt(data.mvp.gain) } : null
          })
        })
        .catch(console.error)
    }

    load()
    // Refresh every 15s — frequent enough to feel live without hammering the DB
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) return null

  return (
    <div className="bg-gray-50/80 border-x border-b border-gray-100 rounded-b-xl py-1.5 px-4 mb-2 flex items-center justify-between gap-2 shadow-sm">
      <div className="flex flex-col min-w-0">
        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight mb-0.5">
          Today&apos;s Vol
        </span>
        <span
          className={`text-[10px] font-black leading-none truncate ${getAmountColor(stats.totalVolume)}`}
        >
          {formatPoints(stats.totalVolume)}
        </span>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight mb-0.5">
          Today&apos;s Pay
        </span>
        <span
          className={`text-[10px] font-black leading-none truncate ${stats.dailyPayout >= 0n ? 'text-green-600' : 'text-red-500'}`}
        >
          {stats.dailyPayout >= 0n ? '+' : ''}
          {formatPoints(stats.dailyPayout)}
        </span>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight mb-0.5">
          Daily MVP
        </span>
        <div className="flex items-center gap-1 leading-none">
          <span className="text-[10px] font-black text-purple-700 truncate max-[400px]:max-w-12.5 max-w-25">
            {stats.mvp?.nickname || '---'}
          </span>
          {stats.mvp && (
            <span
              className={`text-[9px] font-bold ${getAmountColor(stats.mvp.gain)}`}
            >
              +{formatPoints(stats.mvp.gain)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight">
            Win Rate
          </span>
          {/* Pulsing dot signals the stats are live-updated */}
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
        </div>
        <span className="text-[10px] font-black text-indigo-600 leading-none">
          {stats.winRate}%
        </span>
      </div>
    </div>
  )
}
