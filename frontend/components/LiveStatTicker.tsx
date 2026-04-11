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
    <div className="bg-gray-50/80 border-x border-b border-gray-100 rounded-b-xl py-1.5 px-3 mb-2 flex items-center gap-2 shadow-sm">
      <div className="shrink-0">
        <span className="text-[9px] text-cyan-600 font-black uppercase tracking-wider">
          Daily
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1.5fr_0.6fr] items-center flex-1 gap-1 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[7px] text-gray-400 uppercase font-bold tracking-tight leading-none mb-0.5">
            Vol
          </span>
          <span
            className={`text-[9px] font-black whitespace-nowrap tracking-tighter truncate ${getAmountColor(stats.totalVolume)}`}
          >
            {formatPoints(stats.totalVolume).display}
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[7px] text-gray-400 uppercase font-bold tracking-tight leading-none mb-0.5">
            Pay
          </span>
          <span
            className={`text-[9px] font-black whitespace-nowrap tracking-tighter truncate ${stats.dailyPayout >= 0n ? 'text-green-600' : 'text-red-500'}`}
          >
            {stats.dailyPayout >= 0n ? '+' : ''}
            {formatPoints(stats.dailyPayout).display}
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[7px] text-gray-400 uppercase font-bold tracking-tight leading-none mb-0.5">
            MVP
          </span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[9px] font-black text-purple-700 truncate">
              {stats.mvp?.nickname || '---'}
            </span>
            {stats.mvp && (
              <span
                className={`text-[8px] font-bold whitespace-nowrap tracking-tighter shrink-0 ${getAmountColor(stats.mvp.gain)}`}
              >
                +{formatPoints(stats.mvp.gain).display}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end min-w-0">
          <div className="flex items-center gap-0.5 mb-0.5">
            <span className="text-[7px] text-gray-400 uppercase font-bold tracking-tight leading-none">
              Win%
            </span>
            <span className="h-1 w-1 rounded-full bg-green-500 shrink-0" />
          </div>
          <span className="text-[9px] font-black text-indigo-600 leading-none">
            {stats.winRate}%
          </span>
        </div>
      </div>
    </div>
  )
}
