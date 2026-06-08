'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { fetchAchievementsBulkBadges, fetchUnifiedLeaderboard } from '@/lib/api'
import GemIcon from '@/components/icons/GemIcon'
import { formatPoints, getAmountColor, getDisplayTierClass } from '@/lib/format'
import Link from 'next/link'
import { BadgeData, LeaderboardEntry } from '@/types/rps'
import { IdentityBadges } from '@/components/badges/IdentityBadges'
import { logger } from '@/lib/logger'
import { useUserStore } from '../stores/userStore'

type Tab = 'daily' | 'weekly' | 'alltime' | 'laps' | 'speedrun' | 'achievements'
type SortKey =
  | 'points'
  | 'gained'
  | 'peak'
  | 'wins'
  | 'losses'
  | 'winrate'
  | 'laps'
  | 'fastest'
  | 'achievements'
type SortDir = 'asc' | 'desc'

const DEFAULT_SORT: Record<Tab, SortKey> = {
  daily: 'points',
  weekly: 'gained',
  alltime: 'peak',
  laps: 'laps',
  speedrun: 'fastest',
  achievements: 'achievements'
}

const TAB_LABELS: Record<Tab, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  alltime: 'All Time',
  laps: 'Total',
  speedrun: 'Speedrun',
  achievements: 'Achievements'
}

const EMPTY_MESSAGES: Record<Tab, string> = {
  daily: 'No bets placed today yet, be the first to claim the top spot!',
  weekly: 'Season just started, be the first to claim the weekly crown!',
  alltime: 'No predictors yet, jump in and make history!',
  laps: 'No one has ascended yet. Be the first to reach 999 OVG.',
  speedrun: 'No completed laps to rank yet.',
  achievements: 'No achievements earned yet. Be the first.'
}

const isLapsTab = (t: Tab) => t === 'laps' || t === 'speedrun'
const isAchievementsTab = (t: Tab) => t === 'achievements'

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
        {/* Level 1: Main Category Pillars */}
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

        {/* Level 2: Conditional Sub-Tabs */}
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
                    {TAB_LABELS[t]}
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
                    {TAB_LABELS[t]}
                  </button>
                ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-2 py-3 text-gray-400 font-bold text-xs uppercase w-12 whitespace-nowrap">
                    #
                  </th>
                  <th className="text-left px-3 py-3 text-gray-400 font-bold text-xs uppercase">
                    Player
                  </th>

                  {isLapsTab(tab) ? (
                    <>
                      {th(
                        'Laps',
                        'laps',
                        'text-center',
                        'hidden min-[600px]:table-cell'
                      )}
                      {tab === 'speedrun' &&
                        th(
                          'Fastest Lap',
                          'fastest',
                          'text-center',
                          'hidden min-[600px]:table-cell'
                        )}
                      {th(
                        'Points',
                        'points',
                        'text-right',
                        'hidden min-[600px]:table-cell'
                      )}
                      {th(
                        'Peak',
                        'peak',
                        'text-right',
                        'hidden min-[600px]:table-cell'
                      )}
                    </>
                  ) : isAchievementsTab(tab) ? (
                    <th className="px-3 py-3 text-right text-gray-400 font-bold text-xs uppercase hidden min-[600px]:table-cell">
                      Achievements
                    </th>
                  ) : (
                    <>
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
                    </>
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
                    const isMe = entry.shortId === myShortId
                    const gainedBI = BigInt(entry.gained ?? '0')
                    const entryBadges = isMe
                      ? myBadges
                      : badgeMap[entry.shortId] || []
                    const hasRainbow = entryBadges.some(
                      (b) => b.rarity === 'RAINBOW'
                    )
                    const hasMythical =
                      !hasRainbow &&
                      entryBadges.some((b) => b.rarity === 'MYTHICAL')
                    const prestigeClass = hasRainbow
                      ? 'row-prestige-rainbow'
                      : hasMythical
                        ? 'row-prestige-mythical'
                        : ''

                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-all duration-700 relative ${
                          prestigeClass
                            ? prestigeClass
                            : isMe
                              ? 'bg-purple-50'
                              : 'bg-white'
                        }`}
                      >
                        <td className="px-2 py-3 align-top text-gray-400 font-bold text-xs w-12 whitespace-nowrap bg-transparent">
                          {index === 0 ? '🏆' : index + 1}
                        </td>

                        <td className="px-1 min-[600px]:px-3 py-3">
                          <div className="flex flex-col">
                            {/* Row 1: Nickname + YOU label */}
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profile/${entry.shortId}`}
                                className={`font-black transition hover:underline decoration-purple-400 underline-offset-4 ${
                                  isMe ? 'text-purple-600' : 'text-gray-900'
                                }`}
                              >
                                {entry.nickname ?? entry.userId.slice(0, 8)}
                              </Link>
                              {isMe && (
                                <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                                  YOU
                                </span>
                              )}
                            </div>

                            {/* Row 2: Badge Cluster (Handles Dev check automatically) */}
                            <IdentityBadges
                              linkedinUrl={entry.linkedinUrl}
                              showLinkedinBadge={
                                isMe
                                  ? myStoreShowLinkedin
                                  : entry.showLinkedinBadge
                              }
                              badges={
                                isMe ? myBadges : badgeMap[entry.shortId] || []
                              }
                              size="sm"
                              targetShortId={entry.shortId}
                            />

                            {/* Mobile stats row */}
                            <div className="flex flex-col min-[600px]:hidden mt-3 gap-0.5 text-[10px]">
                              {isLapsTab(tab) ? (
                                <>
                                  <div className="flex gap-2 text-gray-400 font-bold uppercase tracking-wider">
                                    <div className="w-10">Laps</div>
                                    {tab === 'speedrun' && (
                                      <div className="w-16">Fastest</div>
                                    )}
                                    <div className="w-14">Pts</div>
                                    <div className="w-14">Peak</div>
                                  </div>
                                  <div className="flex gap-2 font-medium items-center">
                                    <div className="w-10 text-indigo-600 font-black">
                                      {entry.laps ?? 0}
                                    </div>
                                    {tab === 'speedrun' && (
                                      <div className="w-16 text-gray-600 font-bold">
                                        {entry.fastestLapBets != null
                                          ? `${entry.fastestLapBets}b`
                                          : '—'}
                                      </div>
                                    )}
                                    <div
                                      className={`w-14 font-bold ${getDisplayTierClass(entry.points, entry.pointStylePreference)}`}
                                    >
                                      {formatPoints(entry.points).display}
                                    </div>
                                    <div
                                      className={`w-14 font-bold ${getAmountColor(entry.peakPoints)}`}
                                    >
                                      {formatPoints(entry.peakPoints).display}
                                    </div>
                                  </div>
                                </>
                              ) : isAchievementsTab(tab) ? (
                                <div className="flex gap-2 font-medium items-center mt-1 text-[10px]">
                                  <span className="text-indigo-600 font-black">
                                    {entry.achievementCount ?? 0}
                                  </span>
                                  <span className="text-gray-400 font-bold uppercase tracking-wider">
                                    achievements
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-2 text-gray-400 font-bold uppercase tracking-wider">
                                    <div className="w-6">W</div>
                                    <div className="w-6">L</div>
                                    <div className="w-14">Pts</div>
                                    <div className="w-14">Gain</div>
                                    <div className="w-14">Peak</div>
                                  </div>
                                  <div className="flex gap-2 font-medium items-center">
                                    <div className="w-6 text-green-600 font-bold">
                                      {entry.wins}
                                    </div>
                                    <div className="w-6 text-red-500 font-bold">
                                      {entry.losses}
                                    </div>
                                    <div className="w-14 font-bold flex items-center gap-0.5">
                                      <GemIcon
                                        size={8}
                                        className="shrink-0 text-gray-400"
                                      />
                                      <span
                                        className={getDisplayTierClass(
                                          entry.points,
                                          entry.pointStylePreference
                                        )}
                                      >
                                        {formatPoints(entry.points).display}
                                      </span>
                                    </div>
                                    <div
                                      className={`w-14 font-bold ${gainedBI >= 0n ? 'text-green-500' : 'text-red-500'}`}
                                    >
                                      {gainedBI >= 0n ? '+' : ''}
                                      {
                                        formatPoints(entry.gained ?? '0')
                                          .display
                                      }
                                    </div>
                                    <div
                                      className={`w-14 font-bold ${getAmountColor(entry.peakPoints)}`}
                                    >
                                      {formatPoints(entry.peakPoints).display}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Desktop cells */}
                        {isLapsTab(tab) ? (
                          <>
                            <td className="hidden min-[600px]:table-cell px-3 py-3 text-center font-black text-indigo-600">
                              {entry.laps ?? 0}
                            </td>
                            {tab === 'speedrun' && (
                              <td className="hidden min-[600px]:table-cell px-3 py-3 text-center font-bold text-gray-600">
                                {entry.fastestLapBets != null
                                  ? `${entry.fastestLapBets} bets`
                                  : '—'}
                              </td>
                            )}
                            <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                              <span
                                className={getDisplayTierClass(
                                  entry.points,
                                  entry.pointStylePreference
                                )}
                              >
                                {formatPoints(entry.points).display}
                              </span>
                            </td>
                            <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                              <span
                                className={getAmountColor(entry.peakPoints)}
                              >
                                {formatPoints(entry.peakPoints).display}
                              </span>
                            </td>
                          </>
                        ) : isAchievementsTab(tab) ? (
                          <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-black text-indigo-600">
                            {entry.achievementCount ?? 0}
                          </td>
                        ) : (
                          <>
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
                              <span
                                className={getDisplayTierClass(
                                  entry.points,
                                  entry.pointStylePreference
                                )}
                              >
                                {formatPoints(entry.points).display}
                              </span>
                            </td>
                            <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                              <span
                                className={
                                  gainedBI >= 0n
                                    ? 'text-green-600'
                                    : 'text-red-500'
                                }
                              >
                                {gainedBI >= 0n ? '+' : ''}
                                {formatPoints(entry.gained ?? '0').display}
                              </span>
                            </td>
                            <td className="hidden min-[600px]:table-cell px-3 py-3 text-right font-bold">
                              <span
                                className={getAmountColor(entry.peakPoints)}
                              >
                                {formatPoints(entry.peakPoints).display}
                              </span>
                            </td>
                          </>
                        )}
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
