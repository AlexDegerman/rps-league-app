'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateTime, formatPoints, getDisplayTierClass } from '@/lib/format'
import GemIcon from '@/components/icons/GemIcon'
import MoveIcon from '@/components/icons/MoveIcon'
import { fetchUserBetHistory } from '@/lib/api'
import {
  Match,
  PredictionRecord,
  BonusTier,
  BetHistoryEntry
} from '@/types/rps'
import { BONUS_TIER_STYLES, FLASH_EVENT_CARD } from '@/lib/constants'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

type Tab = 'recent' | 'wins' | 'multipliers'

const TAB_LABELS: Record<Tab, string> = {
  recent: 'Recent',
  wins: 'Biggest Wins',
  multipliers: 'Best Multipliers'
}

// --- SUB-COMPONENTS ---

function StreakBadge({ streakMult }: { streakMult: number }) {
  if (streakMult <= 1) return null

  const isInferno = streakMult >= 5
  const isFever = streakMult >= 2 && streakMult < 5

  return (
    <div className="flex items-center justify-center relative z-30">
      <div
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-black text-[8px] uppercase tracking-widest shadow-lg transition-all ${
          isInferno
            ? 'card-inferno bg-orange-950/90 border-orange-500'
            : isFever
              ? 'card-fever bg-green-950/90 border-green-500'
              : 'bg-gray-950/90 border-gray-500'
        }`}
      >
        <span
          className={`flex items-center gap-1 ${
            isInferno
              ? 'inferno-shimmer-text streak-fire-text'
              : 'streak-shimmer-text'
          }`}
        >
          <span>{isInferno ? '🔥' : '⚡'}</span>
          <span>
            {streakMult}x {isInferno ? 'Inferno' : 'Fever'}
          </span>
        </span>
      </div>
    </div>
  )
}

function FlashEventBadge({
  flashEventType,
  flashMult
}: {
  flashEventType: string | null
  flashMult: number
}) {
  if (!flashEventType) return null
  const cfg = FLASH_EVENT_CARD[flashEventType]
  if (!cfg) return null

  return (
    <div className="flex items-center justify-center relative z-30">
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-black text-[8px] uppercase tracking-widest shadow-sm ${flashEventType === 'LUNAR' ? 'bg-slate-900 border-blue-400 text-blue-100' : ''} ${flashEventType === 'ELECTRIC' ? 'bg-purple-950 border-purple-400 text-purple-100' : ''} ${flashEventType === 'CARDS' ? 'bg-yellow-900 border-yellow-400 text-yellow-100' : ''} ${flashEventType === 'HELLFIRE' ? 'bg-red-950 border-red-500 text-red-100' : ''}`}
      >
        <span className="text-[10px] leading-none">{cfg.emoji}</span>
        <span>{cfg.label}</span>
        {flashMult > 1 && (
          <span className="opacity-70 ml-0.5">{flashMult}x</span>
        )}
      </div>
    </div>
  )
}

function TotalMultiplierHeader({
  bonusMultiplier,
  flashMult,
  streakMult,
  isWin
}: {
  bonusMultiplier: number
  flashMult: number
  streakMult: number
  isWin: boolean
}) {
  if (!isWin) return null
  const b = bonusMultiplier > 0 ? bonusMultiplier / 100 : 1
  const f = flashMult > 1 ? flashMult : 1
  const s = streakMult > 1 ? streakMult : 1

  const totalMult = b * f * s
  if (totalMult < 1.01) return null

  return (
    <div className="flex items-center justify-center relative z-30">
      <span className="text-[9px] px-2 py-0.5 font-black uppercase tracking-widest rounded border-2 border-purple-500 bg-white text-purple-600 shadow-md">
        {totalMult.toFixed(1)}× TOTAL
      </span>
    </div>
  )
}

function BonusBadge({
  tier,
  multiplier
}: {
  tier: string | null
  multiplier: number
}) {
  if (!tier || multiplier === 0) return null
  const style = BONUS_TIER_STYLES[tier as BonusTier] ?? BONUS_TIER_STYLES.COMMON
  const auraClass = `aura-${tier.toLowerCase()}`
  return (
    <div
      className={`badge-aura-wrapper ${auraClass} inline-flex items-center relative z-30`}
    >
      <span
        className={`text-[9px] px-2 py-0.5 font-black uppercase tracking-tight rounded border shadow-sm ${tier === 'LEGENDARY' ? 'text-yellow-600 border-yellow-400 bg-white' : 'bg-white border-black/10 text-gray-950'}`}
      >
        <span className={style.color}>{style.label}</span>{' '}
        {(multiplier / 100).toFixed(1)}×
      </span>
    </div>
  )
}

function BetRow({
  entry,
  rank,
  stylePreference
}: {
  entry: BetHistoryEntry
  rank?: number
  stylePreference: string | null
}) {
  console.log(
    `Game: ${entry.playerAName} vs ${entry.playerBName} | ID: ${entry.gameId}`
  )
  const isWin = entry.result === 'WIN'
  const isLoss = entry.result === 'LOSE'
  const gainLossBig = BigInt(entry.gainLoss ?? '0')
  const absGainLoss = gainLossBig < 0n ? -gainLossBig : gainLossBig
  const pickedA = entry.pick === entry.playerAName

  const amountAnimationClass = getDisplayTierClass(absGainLoss, stylePreference)
  const tierKey = (
    entry.bonusTier && entry.bonusTier in BONUS_TIER_STYLES
      ? entry.bonusTier
      : 'COMMON'
  ) as BonusTier
  const flashCfg = entry.flashEventType
    ? FLASH_EVENT_CARD[entry.flashEventType]
    : null

  const cardClass = isWin
    ? flashCfg
      ? flashCfg.cardClass
      : (BONUS_TIER_STYLES[tierKey]?.cardClass ?? '')
    : 'bg-white border-gray-100 shadow-sm'

  return (
    <li
      className={`relative overflow-hidden w-full p-2.5 rounded-3xl border-2 transition-all ${cardClass}`}
    >
      <div className="absolute top-2 right-2 z-40">
        <span className="text-[7px] font-black text-gray-400 uppercase tabular-nums bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-black/5">
          {formatDateTime(entry.createdAt)}
        </span>
      </div>

      {rank !== undefined && (
        <div className="absolute top-2 left-2 z-40">
          <span className="text-base leading-none">
            {rank === 0 ? (
              '🏆'
            ) : rank === 1 ? (
              '🥈'
            ) : rank === 2 ? (
              '🥉'
            ) : (
              <span className="text-[9px] font-black text-gray-400 bg-white/40 px-1 rounded shadow-sm border border-black/5">
                #{rank + 1}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center justify-center pt-1">
        <TotalMultiplierHeader
          bonusMultiplier={entry.bonusMultiplier}
          flashMult={entry.flashMult ?? 1}
          streakMult={entry.streakMult ?? 1}
          isWin={isWin}
        />

        <div className="flex gap-2 flex-wrap justify-center mt-1.5 relative z-30">
          <StreakBadge streakMult={entry.streakMult} />

          <BonusBadge
            tier={entry.bonusTier}
            multiplier={entry.bonusMultiplier}
          />
          {isWin && entry.flashEventType && (
            <FlashEventBadge
              flashEventType={entry.flashEventType}
              flashMult={entry.flashMult ?? 1}
            />
          )}
        </div>

        <div className="flex items-center justify-center relative py-2.5 pl-4">
          <span className="absolute left-0 text-xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] z-30 select-none">
            {isWin ? '+' : isLoss ? '-' : ''}
          </span>

          <div className="flex items-center gap-1.5 relative">
            {(() => {
              const { display, full, capped } = formatPoints(absGainLoss)
              return (
                <span
                  className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tighter ${amountAnimationClass} ${isLoss ? 'brightness-90 saturate-150' : ''}`}
                  title={capped ? full : undefined}
                >
                  {display}
                </span>
              )
            })()}
            <GemIcon size={16} className="relative z-10" />
          </div>
        </div>

        <div className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-gray-950 shadow-lg relative z-30 ring-1 ring-white/10 -mt-0.5">
          <span className="text-[6px] font-black text-white/40 uppercase tracking-widest leading-none">
            Stake:
          </span>
          <span className="text-[9px] font-black text-white leading-none">
            {formatPoints(entry.betAmount).display}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-3 py-1.5 border-t border-gray-100/40 relative z-20">
        <div className="flex items-center gap-1.5 min-w-0">
          <MoveIcon
            move={entry.playerAPlayed}
            size={14}
            className={pickedA ? 'text-indigo-600' : 'text-gray-300'}
          />
          <span
            className={`text-[10px] font-black uppercase truncate max-w-17.5 ${pickedA ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            {(entry.playerAName || '???').split(' ')[0]}
          </span>
        </div>
        <span className="text-[8px] font-black text-black italic shrink-0">
          VS
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[10px] font-black uppercase text-right truncate max-w-17.5 ${!pickedA ? 'text-indigo-600' : 'text-gray-500'}`}
          >
            {(entry.playerBName || '???').split(' ')[0]}
          </span>
          <MoveIcon
            move={entry.playerBPlayed}
            size={14}
            className={!pickedA ? 'text-indigo-600' : 'text-gray-300'}
          />
        </div>
      </div>
    </li>
  )
}

// --- MAIN COMPONENT ---

function useTabFetchFn(userId: string | null, tab: Tab) {
  return useCallback(
    async (page: number) => {
      if (!userId) return { matches: [], total: 0, hasMore: false }
      const data = await fetchUserBetHistory(userId, page, tab)
      const predMap = new Map<string, PredictionRecord>(
        data.predictions.map((p: PredictionRecord) => [p.gameId, p])
      )
      const entries: BetHistoryEntry[] = data.matches.map((m: Match) => {
        const pred = predMap.get(m.gameId)
        return {
          id: pred?.id ?? 0,
          gameId: m.gameId,
          pick: pred?.pick ?? '',
          result: (pred?.result as 'WIN' | 'LOSE') ?? null,
          createdAt: pred?.createdAt ?? m.time,
          betAmount: pred?.betAmount ?? '0',
          gainLoss: pred?.gainLoss ?? '0',
          bonusTier: pred?.bonusTier ?? null,
          bonusMultiplier: Number(pred?.bonusMultiplier ?? 0),
          flashEventType: pred?.flashEventType ?? null,
          flashMult: Number(pred?.flashMult ?? 1),
          streakMult: Number(pred?.streakMultiplier ?? 1),
          playerAName: m.playerA.name,
          playerBName: m.playerB.name,
          playerAPlayed: m.playerA.played,
          playerBPlayed: m.playerB.played
        }
      })
      return {
        matches: entries as unknown as Match[],
        total: data.total,
        hasMore: data.hasMore
      }
    },
    [userId, tab]
  )
}

export default function BetHistory({
  userId,
  stylePreference
}: {
  userId: string | null
  stylePreference: string | null
}) {
  const [tab, setTab] = useState<Tab>('recent')
  const fetchFn = useTabFetchFn(userId, tab)
  const { matches, isLoading, isLoadingMore, hasMore, loadMatches, reset } =
    useInfiniteScroll({ fetchFn, enabled: !!userId })

  useEffect(() => {
    reset()
    if (userId) loadMatches(1)
  }, [tab, userId, reset, loadMatches])

  const bets = matches as unknown as BetHistoryEntry[]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex p-1 bg-gray-100 rounded-2xl gap-1 mb-4">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
              tab === t
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="relative min-h-100">
        {isLoading && bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">
            Loading History
          </div>
        ) : bets.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-4xl py-20 flex flex-col items-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
            Empty Record
          </div>
        ) : (
          <ul className="space-y-3">
            {bets.map((bet, i) => (
              <BetRow
                key={`${bet.gameId}-${bet.id}`}
                entry={bet}
                rank={tab !== 'recent' ? i : undefined}
                stylePreference={stylePreference}
              />
            ))}
            {isLoadingMore && (
              <li className="text-center py-6 text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 animate-pulse">
                Loading More
              </li>
            )}
            {!hasMore && bets.length > 0 && (
              <li className="text-center py-6 text-[9px] font-black uppercase tracking-widest text-gray-200">
                End of Record
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
