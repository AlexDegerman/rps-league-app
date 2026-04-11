'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { fetchUnifiedLeaderboard } from '@/lib/api'
import GemIcon from '@/components/icons/GemIcon'
import { getUserId } from '@/lib/user'
import { formatPoints, getAmountColor } from '@/lib/format'
import Link from 'next/link'
import { LeaderboardEntry } from '@/types/rps'
import { LinkedInBadge } from '@/components/LinkedInBadge'

type Tab = 'daily' | 'weekly' | 'alltime'
type SortKey = 'points' | 'gained' | 'peak' | 'wins' | 'losses' | 'winrate'
type SortDir = 'asc' | 'desc'

// Each tab defaults to its most meaningful sort column
const DEFAULT_SORT: Record<Tab, SortKey> = {
  daily: 'points',
  weekly: 'gained',
  alltime: 'peak'
}

const TAB_LABELS: Record<Tab, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  alltime: 'All Time'
}

const EMPTY_MESSAGES: Record<Tab, string> = {
  daily: 'No bets placed today yet, be the first to claim the top spot!',
  weekly: 'Season just started, be the first to claim the weekly crown!',
  alltime: 'No predictors yet, jump in and make history!'
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-300 ml-1">↕</span>
  return (
    <span className="text-purple-400 ml-1">{dir === 'desc' ? '↓' : '↑'}</span>
  )
}

function LeaderboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [tab, setTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'daily'
  )
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) || DEFAULT_SORT[tab]
  )
  const [dir, setDir] = useState<SortDir>(
    (searchParams.get('dir') as SortDir) || 'desc'
  )
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  // Defer localStorage read to avoid SSR mismatch
  useEffect(() => {
    setMyUserId(getUserId())
  }, [])

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([k, v]) => newParams.set(k, v))
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const load = useCallback(async (t: Tab, s: SortKey, d: SortDir) => {
    setIsLoading(true)
    try {
      setData(await fetchUnifiedLeaderboard(t, s, d))
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load(tab, sort, dir)
  }, [tab, sort, dir, load])

  const handleTab = (t: Tab) => {
    const newSort = DEFAULT_SORT[t]
    setTab(t)
    setSort(newSort)
    setDir('desc')
    updateUrl({ tab: t, sort: newSort, dir: 'desc' })
  }

  const handleSort = (col: SortKey) => {
    // Clicking the active column flips direction; clicking a new column defaults to desc
    const newDir: SortDir = sort === col && dir === 'desc' ? 'asc' : 'desc'
    setSort(col)
    setDir(newDir)
    updateUrl({ tab, sort: col, dir: newDir })
  }

  const th = (
    label: string,
    col: SortKey,
    align = 'text-right',
    extraClasses = ''
  ) => (
    <th
      className={`px-3 py-3 font-bold text-xs uppercase tracking-wide cursor-pointer select-none ${align} ${sort === col ? 'text-purple-600' : 'text-gray-400'} hover:text-purple-500 transition ${extraClasses}`}
      onClick={() => handleSort(col)}
    >
      {label}
      <SortArrow active={sort === col} dir={dir} />
    </th>
  )

  return (
    <div className="max-w-4xl mx-auto px-4">

      <div className="flex gap-2 mb-4">
        <button className="px-6 py-2 rounded font-bold text-xs uppercase bg-yellow-400 text-gray-900 shadow-sm">
          Predictors
        </button>
        <Link
          href="/leaderboard/players"
          className="px-6 py-2 rounded font-bold text-xs uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          Players
        </Link>
      </div>

      <div className="sticky top-16 z-40 bg-gray-100 pb-4">
        <div className="flex gap-2">
          {(['daily', 'weekly', 'alltime'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`px-3 py-1.5 rounded font-bold text-[10px] uppercase transition ${
                tab === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-3 py-3 text-gray-400 font-bold text-xs uppercase w-10">
                    #
                  </th>
                  <th className="text-left px-3 py-3 text-gray-400 font-bold text-xs uppercase">
                    Player
                  </th>
                  {th(
                    'W',
                    'wins',
                    'text-center',
                    'hidden min-[600px]:table-cell'
                  )}
                  {th(
                    'L',
                    'losses',
                    'text-center',
                    'hidden min-[600px]:table-cell'
                  )}
                  {th(
                    'Win%',
                    'winrate',
                    'text-center',
                    'hidden min-[680px]:table-cell'
                  )}
                  {th(
                    'Points',
                    'points',
                    'text-right',
                    'hidden min-[600px]:table-cell'
                  )}
                  {th(
                    'Gained',
                    'gained',
                    'text-right',
                    'hidden min-[600px]:table-cell'
                  )}
                  {th(
                    tab === 'daily'
                      ? 'Daily Peak'
                      : tab === 'weekly'
                        ? 'Weekly Peak'
                        : 'All Time Peak',
                    'peak',
                    'text-right',
                    'hidden min-[600px]:table-cell'
                  )}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 px-4 text-center">
                      <p className="text-gray-500 font-medium italic">
                        {EMPTY_MESSAGES[tab]}
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.map((entry, index) => {
                    const isMe = entry.userId === myUserId
                    const gainedBI = BigInt(entry.gained)

                    return (
                      <tr
                        key={entry.userId}
                        className={`border-b border-gray-50 ${isMe ? 'bg-purple-50' : ''}`}
                      >
                        <td className="px-3 py-3 align-top text-gray-400 font-bold text-xs">
                          {index === 0 ? '🏆' : index + 1}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/profile/${entry.shortId}`}
                                className={`font-medium transition hover:underline decoration-purple-400 underline-offset-4 text-current! ${
                                  isMe
                                    ? 'text-purple-600! font-bold'
                                    : 'text-indigo-600 hover:text-indigo-800'
                                }`}
                              >
                                {entry.nickname ?? entry.userId.slice(0, 8)}
                              </Link>
                              {isMe && (
                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                                  YOU
                                </span>
                              )}
                              {entry.linkedinUrl && (
                                <LinkedInBadge
                                  url={entry.linkedinUrl}
                                  size="sm"
                                />
                              )}
                            </div>

                            {/* Mobile stats grid — hidden at 600px+ where the table columns take over */}
                            <div className="flex flex-col min-[600px]:hidden mt-2 gap-0.5 text-[10px]">
                              <div className="grid grid-cols-14 gap-1 text-gray-400 font-bold uppercase tracking-wider text-left">
                                <div className="col-span-2">W</div>
                                <div className="col-span-2">L</div>
                                <div className="hidden min-[380px]:block min-[380px]:col-span-2">
                                  Win%
                                </div>
                                <div className="col-span-4 min-[380px]:col-span-3">
                                  Pts
                                </div>
                                <div className="col-span-4 min-[380px]:col-span-3">
                                  Gain
                                </div>
                                <div className="col-span-2 text-right">
                                  Peak
                                </div>
                              </div>
                              <div className="grid grid-cols-14 gap-1 font-medium text-left items-center">
                                <div className="col-span-2 text-green-600 font-bold truncate">
                                  {entry.wins}
                                </div>
                                <div className="col-span-2 text-red-500 font-bold truncate">
                                  {entry.losses}
                                </div>
                                <div className="hidden min-[380px]:block min-[380px]:col-span-2 text-indigo-500 font-bold">
                                  {entry.winRate}%
                                </div>
                                <div
                                  className={`col-span-4 min-[380px]:col-span-3 font-bold flex items-center gap-0.5 whitespace-nowrap ${getAmountColor(entry.points)}`}
                                >
                                  <GemIcon size={8} className="shrink-0" />
                                  {formatPoints(entry.points)}
                                </div>
                                <div
                                  className={`col-span-4 min-[380px]:col-span-3 font-bold whitespace-nowrap ${gainedBI >= 0n ? 'text-green-500' : 'text-red-500'}`}
                                >
                                  {gainedBI >= 0n ? '+' : ''}
                                  {formatPoints(entry.gained)}
                                </div>
                                <div
                                  className={`col-span-2 font-bold whitespace-nowrap text-right ${getAmountColor(entry.peakPoints)}`}
                                >
                                  {formatPoints(entry.peakPoints)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="hidden min-[600px]:table-cell px-3 py-3 text-center text-green-600 font-bold">
                          {entry.wins}
                        </td>
                        <td className="hidden min-[600px]:table-cell px-3 py-3 text-center text-red-500">
                          {entry.losses}
                        </td>
                        <td className="hidden min-[680px]:table-cell px-3 py-3 text-center text-indigo-500 font-bold">
                          {entry.winRate}%
                        </td>

                        <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                          <span className={getAmountColor(entry.points)}>
                            {formatPoints(entry.points)}
                          </span>
                        </td>
                        <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                          <span
                            className={
                              gainedBI >= 0n ? 'text-green-600' : 'text-red-500'
                            }
                          >
                            {gainedBI >= 0n ? '+' : ''}
                            {formatPoints(entry.gained)}
                          </span>
                        </td>

                        <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                          <span className={getAmountColor(entry.peakPoints)}>
                            {formatPoints(entry.peakPoints)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
          Loading...
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  )
}
