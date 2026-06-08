'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  CATEGORY_ORDER,
  CATEGORY_HIDDEN,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  RARITY_LABEL,
  RARITY_BADGE_STYLE,
  getHighestEarnedPerCategory,
  ACHIEVEMENT_BADGE_MAP
} from '@/lib/achievements'
import { fetchUserAchievements, updateUserBadges } from '@/lib/api'
import {
  AchievementEntry,
  AchievementRarity,
  AchievementStats
} from '@/types/rps'
import { useUserStore } from '@/app/stores/userStore'

interface AchievementMenuProps {
  onBadgeUpdate?: () => void
}

export default function AchievementMenu({
  onBadgeUpdate
}: AchievementMenuProps) {
  const params = useParams()
  const targetShortId = params.shortId as string

  const {
    shortId: myShortId,
    showLinkedinBadge,
    refreshBadges
  } = useUserStore()
  const isOwnProfile = myShortId === targetShortId
  const maxSlots = showLinkedinBadge ? 4 : 5

  const [achievements, setAchievements] = useState<AchievementEntry[]>([])
  const [userStats, setUserStats] = useState<AchievementStats | null>(null)
  const [displayedBadges, setDisplayedBadges] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  )

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      const data = await fetchUserAchievements(targetShortId)
      if (data && isMounted) {
        setAchievements(data.achievements || [])
        setUserStats(data.stats)
        setDisplayedBadges(data.displayedBadges || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [targetShortId])

  const earnedSet = useMemo(
    () => new Set(achievements.filter((a) => a.earned).map((a) => a.code)),
    [achievements]
  )

  const selectableBadges = useMemo(() => {
    const list = getHighestEarnedPerCategory(earnedSet)

    // Ghost Badge Recovery: If a low-tier badge is selected, show it so it can be removed
    displayedBadges.forEach((code) => {
      if (
        code !== 'SYS_LINKEDIN' &&
        code !== 'SYS_DEV' &&
        !list.some((b) => b.code === code)
      ) {
        const ghost = ACHIEVEMENT_BADGE_MAP[code]
        if (ghost) list.push(ghost)
      }
    })
    return list
  }, [earnedSet, displayedBadges])

  const toggleBadge = useCallback(
    (code: string) => {
      setDisplayedBadges((prev) => {
        if (prev.includes(code)) return prev.filter((c) => c !== code)
        if (prev.length >= maxSlots) return prev
        return [...prev, code]
      })
    },
    [maxSlots]
  )

  const handleSave = async () => {
    setSaveStatus('saving')
    const result = await updateUserBadges(targetShortId, displayedBadges)
    if (result) {
      setSaveStatus('saved')
      if (isOwnProfile) await refreshBadges()
      if (onBadgeUpdate) onBadgeUpdate()
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('idle')
    }
  }

  const visibleAchievements = useMemo(
    () =>
      achievements.filter((a) =>
        CATEGORY_HIDDEN.has(a.category) ? a.earned : true
      ),
    [achievements]
  )

  const categoryStats = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => {
      const items = visibleAchievements.filter((a) => a.category === cat)
      return {
        id: cat,
        label: CATEGORY_LABELS[cat],
        icon: CATEGORY_ICONS[cat],
        earnedCount: items.filter((a) => a.earned).length,
        total: items.length
      }
    }).filter((c) => c.total > 0)
  }, [visibleAchievements])

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {isOwnProfile && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Badge Display
              </h4>
              <p className="text-[11px] font-bold text-indigo-600 mt-1">
                {displayedBadges.length} / {maxSlots} Achievement Slots
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saveStatus === 'saved'
                ? '✓ Saved'
                : saveStatus === 'saving'
                  ? '...'
                  : 'Save'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectableBadges.map((badge) => (
              <button
                key={badge.code}
                onClick={() => toggleBadge(badge.code)}
                className={`px-2 py-1 rounded-md border text-[9px] font-black transition-all flex items-center gap-1 ${displayedBadges.includes(badge.code) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200 shadow-xs' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'}`}
              >
                <span>{badge.icon}</span> {badge.code}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Categories
          </span>
          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
            {earnedSet.size} Total
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-none snap-start p-3 rounded-xl border text-left transition-all min-w-25 ${activeCategory === 'all' ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100'}`}
          >
            <p className="text-[10px] font-black uppercase opacity-60">All</p>
            <p className="text-xs font-black">Overview</p>
          </button>
          {categoryStats.map((cat) => (
            <button
              key={cat!.id}
              onClick={() => setActiveCategory(cat!.id)}
              className={`flex-none snap-start p-3 rounded-xl border text-left transition-all min-w-32.5 ${activeCategory === cat!.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-100'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-base">{cat!.icon}</span>
                <span className="text-[9px] font-bold opacity-70">
                  {cat!.earnedCount}/{cat!.total}
                </span>
              </div>
              <p className="text-[10px] font-black uppercase truncate">
                {cat!.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 pb-10 mt-2">
        {CATEGORY_ORDER.map((catId) => {
          if (activeCategory !== 'all' && activeCategory !== catId) return null
          const items = visibleAchievements.filter((a) => a.category === catId)
          if (items.length === 0) return null
          return (
            <div
              key={catId}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {CATEGORY_LABELS[catId]}
                </h3>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="flex flex-col gap-2">
                {items
                  .sort((a, b) =>
                    a.earned === b.earned ? 0 : a.earned ? -1 : 1
                  )
                  .map((ach) => (
                    <AchievementCard
                      key={ach.code}
                      ach={ach}
                      stats={userStats}
                      totalEarned={earnedSet.size}
                    />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AchievementCard({
  ach,
  stats,
  totalEarned
}: {
  ach: AchievementEntry
  stats: AchievementStats | null
  totalEarned: number
}) {
  const getProgress = () => {
    if (ach.earned) return { current: 1, target: 1, percent: 100 }
    const textTargetMatch = ach.requirement
      .replace(/x\d+/g, '')
      .match(/(\d[\d,]*)/)
    const target = textTargetMatch
      ? parseInt(textTargetMatch[0].replace(/,/g, ''))
      : 1
    const isCountable =
      /wins|laps|activations|achievements|days|festivals|times/i.test(
        ach.requirement
      )
    const isMilestone =
      ach.category === 'Dimensional' ||
      !isCountable ||
      target <= 1 ||
      ['SLAY', 'REBL', 'AUTO', 'FND', 'DREM', 'STRM', 'BOOM'].includes(ach.code)
    if (isMilestone) return { current: 0, target: 1, percent: 0 }
    let current = 0
    if (stats) {
      if (ach.category === 'Combatants') current = stats.wins ?? 0
      if (ach.category === 'Momentum') current = stats.maxWinStreak ?? 0
      if (ach.category === 'Prestige') current = stats.laps ?? 0
      if (ach.category === 'Multiplier') current = stats.biggestMatchMult ?? 0
      if (ach.category === 'Lunar') current = stats.lunarCaught ?? 0
      if (ach.category === 'Electric') current = stats.electricCaught ?? 0
      if (ach.category === 'Hellfire') current = stats.hellfireCaught ?? 0
      if (ach.category === 'Cards') current = stats.cardsCaught ?? 0
      if (ach.code === 'PITY') current = stats.totalPitiesEarned ?? 0
      if (ach.category === 'OracleProphecy')
        current = stats.oracleMaxStreak ?? 0
      if (ach.category === 'Reliquary') current = stats.uniqueRelicsOwned ?? 0
      if (ach.code === 'DREM') current = stats.maxConsecutiveFlashEvents ?? 0
      if (ach.category === 'OracleProphecy')
        current = stats.oracleMaxStreak ?? 0
      if (ach.category === 'Festival')
        current = ach.code.startsWith('FES')
          ? (stats.festivalsTriggered ?? 0)
          : (stats.festivalsParticipated ?? 0)
      if (ach.category === 'Collector') current = totalEarned ?? 0
    }
    return {
      current: current || 0,
      target,
      percent: Math.min(Math.round(((current || 0) / target) * 100), 99)
    }
  }
  const prog = getProgress()
  const isRainbow = ach.rarity === 'RAINBOW'
  return (
    <div
      className={`flex flex-col p-3 rounded-xl border transition-all ${ach.earned ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-transparent'}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center text-xl border ${ach.earned ? (isRainbow ? 'rainbow-badge-bg border-purple-200' : 'bg-gray-50 border-transparent') : 'bg-white border-gray-100 grayscale contrast-125 opacity-40'}`}
        >
          {ach.icon}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black truncate ${ach.earned ? 'text-gray-900' : 'text-gray-400'}`}
            >
              {ach.name}
            </span>
            {ach.earned && (
              <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded-sm bg-indigo-50 text-indigo-500">
                Unlocked
              </span>
            )}
          </div>
          <p
            className={`text-[10px] font-medium leading-tight mt-0.5 ${ach.earned ? 'text-gray-500' : 'text-gray-400/80'}`}
          >
            {ach.requirement}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-tighter ${ach.earned ? (isRainbow ? 'rainbow-badge-bg border-purple-300 text-purple-900' : RARITY_BADGE_STYLE[ach.rarity as AchievementRarity]) : 'bg-white border-gray-200 text-gray-300'}`}
          >
            {ach.code}
          </div>
          <span className="text-[7px] font-bold text-gray-300 uppercase tracking-tighter">
            {RARITY_LABEL[ach.rarity as AchievementRarity]}
          </span>
        </div>
      </div>
      {!ach.earned && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1 px-0.5">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
              Goal Progress
            </span>
            <span className="text-[8px] font-black text-gray-400 uppercase">
              {prog.current} / {prog.target}
            </span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 transition-all duration-1000"
              style={{ width: `${prog.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
