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
          if (!data) return

          setStats({
            totalVolume: BigInt(data.totalVolume),
            dailyPayout: BigInt(data.dailyPayout),
            totalBets: data.totalBets ?? 0,
            winRate: data.winRate ?? 0,
            mvp: data.mvp
              ? {
                  nickname: data.mvp.nickname,
                  gain: BigInt(data.mvp.gain)
                }
              : null
          })
        })
        .catch(console.error)
    }

    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) return null

  return (
    <div className="bg-gray-50/80 border-x border-b border-gray-100 rounded-b-xl py-1.5 px-3 mb-2 flex items-center gap-4 shadow-sm">
      <div className="flex items-center shrink-0">
        <span className="text-[9px] text-cyan-600 font-black uppercase tracking-wider">
          Daily
        </span>
      </div>

      <div className="flex items-center justify-between flex-1 gap-2">
        <div className="flex flex-col items-center min-w-0">
          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight mb-0.5">
            Vol
          </span>
          <span
            className={`text-[10px] font-black leading-none whitespace-nowrap tracking-tighter ${getAmountColor(stats.totalVolume)}`}
          >
            {formatPoints(stats.totalVolume)}
          </span>
        </div>

        <div className="flex flex-col items-center min-w-0">
          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight mb-0.5">
            Pay
          </span>
          <span
            className={`text-[10px] font-black leading-none whitespace-nowrap tracking-tighter ${stats.dailyPayout >= 0n ? 'text-green-600' : 'text-red-500'}`}
          >
            {stats.dailyPayout >= 0n ? '+' : ''}
            {formatPoints(stats.dailyPayout)}
          </span>
        </div>

        <div className="flex flex-col items-center min-w-0">
          <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight mb-0.5">
            MVP
          </span>
          <div className="flex items-center gap-1 leading-none">
            <span className="text-[10px] font-black text-purple-700 truncate max-w-12 sm:max-w-16">
              {stats.mvp?.nickname || '---'}
            </span>
            {stats.mvp && (
              <span
                className={`text-[9px] font-bold whitespace-nowrap tracking-tighter ${getAmountColor(stats.mvp.gain)}`}
              >
                +{formatPoints(stats.mvp.gain)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center min-w-0 shrink-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tight">
              Win%
            </span>
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
    </div>
  )
}
