'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateTime, formatPoints, getAmountColor } from '@/lib/format'
import GemIcon from '@/components/icons/GemIcon'
import MoveIcon from '@/components/icons/MoveIcon'
import { fetchUserBetHistory } from '@/lib/api'
import { Match, PredictionRecord } from '@/types/rps'

// Types & Constants

export interface BetHistoryEntry {
  id: number
  gameId: string
  pick: string
  result: 'WIN' | 'LOSE' | null
  createdAt: number
  betAmount: string
  gainLoss: string
  bonusTier: string | null
  bonusMultiplier: number
  playerAName: string
  playerBName: string
  playerAPlayed: 'ROCK' | 'PAPER' | 'SCISSORS'
  playerBPlayed: 'ROCK' | 'PAPER' | 'SCISSORS'
}

type Tab = 'recent' | 'wins' | 'multipliers'

const TAB_LABELS: Record<Tab, string> = {
  recent: 'Recent',
  wins: 'Biggest Wins',
  multipliers: 'Best Multipliers'
}

const BONUS_TIER_STYLES: Record<
  string,
  { label: string; color: string; bg: string; cardClass: string }
> = {
  LEGENDARY: {
    label: 'Legendary',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    cardClass: 'card-legendary-premium'
  },
  EPIC: {
    label: 'Epic',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    cardClass:
      'border-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-gradient-to-br from-white via-purple-50/30 to-white'
  },
  RARE: {
    label: 'Rare',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    cardClass: 'border-blue-100 shadow-sm bg-slate-50'
  },
  COMMON: {
    label: 'Common',
    color: 'text-slate-600',
    bg: 'bg-slate-100/50',
    cardClass: 'card-grey-wash'
  }
}

// Sub-Components

function BonusBadge({
  tier,
  multiplier
}: {
  tier: string | null
  multiplier: number
}) {
  if (!tier || multiplier === 0) return null

  const style = BONUS_TIER_STYLES[tier] ?? BONUS_TIER_STYLES.COMMON
  const displayMult = (multiplier / 100).toFixed(1)
  const isHighTier = tier === 'LEGENDARY' || tier === 'EPIC'

  const auraClass = `aura-${tier.toLowerCase()}`

  return (
    <div className={`badge-aura-wrapper ${auraClass} inline-flex items-center`}>
      <span
        className={`
          ${isHighTier ? 'text-[14px] px-4 py-1.5' : 'text-[12px] px-3 py-1'} 
          font-black uppercase tracking-tight rounded-full border-2 
          ${tier === 'LEGENDARY' ? 'text-yellow-400 border-yellow-500 bg-[#fdfcf0]' : `${style.color} ${style.bg} border-black/5`}
          relative z-10 inline-flex items-center justify-center transition-colors duration-500
        `}
      >
        {style.label} {displayMult}×
      </span>
    </div>
  )
}

function BetRow({ entry, rank }: { entry: BetHistoryEntry; rank?: number }) {
  const isWin = entry.result === 'WIN'
  const isLoss = entry.result === 'LOSE'

  const gainLossBig = BigInt(entry.gainLoss ?? '0')
  const stakeBig = BigInt(entry.betAmount ?? '0')
  const pickedA = entry.pick === entry.playerAName

  const absGainLoss = gainLossBig < 0n ? -gainLossBig : gainLossBig

  const amountAnimationClass = isLoss
    ? 'text-red-500 font-black'
    : getAmountColor(absGainLoss)

  const tierKey =
    entry.bonusTier && entry.bonusTier in BONUS_TIER_STYLES
      ? (entry.bonusTier as keyof typeof BONUS_TIER_STYLES)
      : 'COMMON'

  const tierStyle = BONUS_TIER_STYLES[tierKey]

  return (
    <li
      className={`relative overflow-hidden w-full p-3.5 rounded-4xl border-2 transition-all 
        ${isWin ? tierStyle?.cardClass : 'bg-slate-50 border-slate-100 opacity-90'}`}
    >
      <div className="flex justify-between items-start">
        <div className="min-h-6">
          {rank !== undefined && (
            <span className="text-lg font-black text-gray-400">
              {rank === 0
                ? '🏆'
                : rank === 1
                  ? '🥈'
                  : rank === 2
                    ? '🥉'
                    : `#${rank + 1}`}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-gray-500 tabular-nums uppercase">
          {formatDateTime(entry.createdAt)}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-0.5">
        <BonusBadge tier={entry.bonusTier} multiplier={entry.bonusMultiplier} />

        <div className="flex items-center justify-center gap-3 mt-1">
          <span
            className={`text-4xl min-[425px]:text-5xl font-black tabular-nums tracking-tighter ${amountAnimationClass}`}
          >
            {isWin ? '+' : isLoss ? '-' : ''}
            {formatPoints(gainLossBig < 0n ? -gainLossBig : gainLossBig)}
          </span>
          <div className="w-6 h-6 min-[425px]:w-8 min-[425px]:h-8">
            <GemIcon size={32} />
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/3">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
            Stake:
          </span>
          <span className={getAmountColor(stakeBig)}>
            {formatPoints(entry.betAmount)}
          </span>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-2.5 border-t border-gray-100/50">
        <div className="flex items-center gap-2 min-[425px]:gap-4">
          <MoveIcon
            move={entry.playerAPlayed}
            size={24}
            className={pickedA ? 'text-indigo-600' : 'text-gray-300'}
          />
          <div className="flex flex-col">
            <span
              className={`text-[11px] min-[425px]:text-[13px] font-black uppercase tracking-tight leading-none ${pickedA ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              {(entry.playerAName || 'Unknown').split(' ')[0]}
            </span>
            {pickedA && (
              <span className="text-[7px] min-[425px]:text-[8px] font-black text-indigo-400/60 mt-0.5">
                YOUR PICK
              </span>
            )}
          </div>
        </div>

        <span className="text-[9px] min-[425px]:text-[10px] font-black text-gray-200 italic">
          VS
        </span>

        <div className="flex items-center gap-2 min-[425px]:gap-4 justify-end text-right">
          <div className="flex flex-col">
            <span
              className={`text-[11px] min-[425px]:text-[13px] font-black uppercase tracking-tight leading-none ${!pickedA ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              {(entry.playerBName || 'Unknown').split(' ')[0]}
            </span>
            {!pickedA && (
              <span className="text-[7px] min-[425px]:text-[8px] font-black text-indigo-400/60 mt-0.5">
                YOUR PICK
              </span>
            )}
          </div>
          <MoveIcon
            move={entry.playerBPlayed}
            size={24}
            className={!pickedA ? 'text-indigo-600' : 'text-gray-300'}
          />
        </div>
      </div>
    </li>
  )
}

// Main Component

export default function BetHistory({ userId }: { userId: string | null }) {
  const [tab, setTab] = useState<Tab>('recent')
  const [bets, setBets] = useState<BetHistoryEntry[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadPage = useCallback(
    async (pageNum: number, currentTab: Tab, append = false) => {
      if (!userId) return
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      try {
        const data = await fetchUserBetHistory(userId, pageNum, currentTab)
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
            bonusMultiplier: pred?.bonusMultiplier ?? 0,
            playerAName: m.playerA.name,
            playerBName: m.playerB.name,
            playerAPlayed: m.playerA.played,
            playerBPlayed: m.playerB.played
          }
        })

        setBets((prev) => (append ? [...prev, ...entries] : entries))
        setHasMore(data.hasMore)
        setPage(pageNum)
      } catch (err) {
        console.error('Bet history fetch failed:', err)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    loadPage(1, tab)
  }, [tab, loadPage])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex p-1 bg-gray-100 rounded-2xl gap-1 mb-6">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
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
          <div className="flex flex-col items-center justify-center py-20 animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
            Loading History
          </div>
        ) : bets.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-4xl py-20 flex flex-col items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Empty Record
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-4">
              {bets.map((bet, i) => (
                <BetRow
                  key={`${bet.gameId}-${bet.id}`}
                  entry={bet}
                  rank={tab !== 'recent' ? i : undefined}
                />
              ))}
            </ul>

            {hasMore && (
              <button
                onClick={() => !isLoadingMore && loadPage(page + 1, tab, true)}
                disabled={isLoadingMore}
                className="w-full mt-6 py-4 rounded-3xl bg-white border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all"
              >
                {isLoadingMore ? 'Streaming Data...' : 'Load More Results'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
