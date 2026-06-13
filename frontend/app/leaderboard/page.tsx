'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { fetchAchievementsBulkBadges, fetchUnifiedLeaderboard } from '@/lib/api'
import Link from 'next/link'
import { BadgeData, LeaderboardEntry } from '@/types/rps'
import { logger } from '@/lib/logger'
import { useUserStore } from '../stores/userStore'
import {
  Tab,
  SortKey,
  SortDir,
  DEFAULT_SORT
} from '@/components/leaderboard/constants'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'

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
  const [badgeMap, setBadgeMap] = useState<Record<string, BadgeData[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  const {
    shortId: myShortId,
    myBadges,
    showLinkedinBadge: myStoreShowLinkedin
  } = useUserStore()

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
      const entries = await fetchUnifiedLeaderboard(t, s, d)
      setData(entries)
      const shortIds = entries.map((e) => e.shortId)
      const badges = await fetchAchievementsBulkBadges(shortIds)
      if (badges) setBadgeMap(badges)
    } catch (err) {
      logger.error(
        'Failed to load leaderboard',
        err instanceof Error ? err : undefined
      )
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
    const newDir: SortDir = sort === col && dir === 'desc' ? 'asc' : 'desc'
    setSort(col)
    setDir(newDir)
    updateUrl({ tab, sort: col, dir: newDir })
  }

  const isPointsCategory = ['daily', 'weekly', 'alltime'].includes(tab)
  const isLapsCategory = ['laps', 'speedrun'].includes(tab)

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Main Mode Toggle */}
      <div className="flex bg-gray-200/50 p-1 rounded-lg gap-1 mb-4 w-fit">
        <button className="px-6 py-2 rounded-md font-bold text-xs uppercase bg-yellow-400 text-gray-900 shadow-sm">
          Predictors
        </button>
        <Link
          href="/leaderboard/players"
          className="px-6 py-2 rounded-md font-bold text-xs uppercase text-gray-500 hover:text-indigo-600 transition"
        >
          Players
        </Link>
      </div>

      <div className="sticky top-16 z-40 bg-gray-100 pb-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => handleTab('daily')}
            className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase transition border ${
              isPointsCategory
                ? 'bg-purple-600 text-white border-transparent shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Points
          </button>
          <button
            onClick={() => handleTab('laps')}
            className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase transition border ${
              isLapsCategory
                ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Laps
          </button>
          <button
            onClick={() => handleTab('achievements')}
            className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase transition border ${
              tab === 'achievements'
                ? 'bg-yellow-500 text-white border-transparent shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Achievements
          </button>
        </div>

        {(isPointsCategory || isLapsCategory) && (
          <div className="flex gap-1 p-1 bg-gray-200/50 rounded-lg w-fit animate-in fade-in slide-in-from-top-1 duration-200">
            {isPointsCategory
              ? (['daily', 'weekly', 'alltime'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTab(t)}
                    className={`px-3 py-1 rounded-md font-bold text-[10px] uppercase transition ${
                      tab === t
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t === 'daily'
                      ? 'Daily'
                      : t === 'weekly'
                        ? 'Weekly'
                        : 'All Time'}
                  </button>
                ))
              : (['laps', 'speedrun'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTab(t)}
                    className={`px-3 py-1 rounded-md font-bold text-[10px] uppercase transition ${
                      tab === t
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t === 'laps' ? 'Total' : 'Speedrun'}
                  </button>
                ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <LeaderboardTable
          data={data}
          isLoading={isLoading}
          tab={tab}
          sort={sort}
          dir={dir}
          onSort={handleSort}
          myShortId={myShortId}
          myBadges={myBadges}
          myStoreShowLinkedin={myStoreShowLinkedin}
          badgeMap={badgeMap}
        />
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
