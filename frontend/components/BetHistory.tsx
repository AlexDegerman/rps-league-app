'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateTime, formatPoints, getAmountColor } from '@/lib/format'
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

// Sub-Components

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
    <div className="flex items-center justify-center mt-1">
      <div
        className={`
          inline-flex items-center gap-1.5 px-3 py-1
          rounded-full border-2 font-black text-[11px] uppercase tracking-widest
          ${flashEventType === 'LUNAR' ? 'bg-slate-900/80 border-blue-300/60' : ''}
          ${flashEventType === 'ELECTRIC' ? 'bg-purple-950/80 border-purple-400/60' : ''}
          ${flashEventType === 'CARDS' ? 'bg-yellow-950/80 border-yellow-400/60' : ''}
          ${flashEventType === 'HELLFIRE' ? 'bg-red-950/80 border-red-500/60' : ''}
        `}
      >
        <span className="text-sm leading-none">{cfg.emoji}</span>
        <span className={cfg.textClass}>{cfg.label}</span>
        {flashMult > 1 && (
          <span
            className={`
              text-[9px] font-black px-1.5 py-0.5 rounded-full
              ${flashEventType === 'LUNAR' ? 'bg-blue-900 text-blue-200' : ''}
              ${flashEventType === 'ELECTRIC' ? 'bg-purple-900 text-purple-200' : ''}
              ${flashEventType === 'CARDS' ? 'bg-yellow-900 text-yellow-200' : ''}
              ${flashEventType === 'HELLFIRE' ? 'bg-red-900 text-red-200' : ''}
            `}
          >
            {cfg.multLabel}
          </span>
        )}
      </div>
    </div>
  )
}

function TotalMultiplierHeader({
  bonusMultiplier,
  flashMult,
  isWin
}: {
  bonusMultiplier: number
  flashMult: number
  isWin: boolean
}) {
  if (!isWin) return null

  const bonusMult = bonusMultiplier > 0 ? bonusMultiplier / 100 : 1
  const effectiveFlash = flashMult > 1 ? flashMult : 1
  const totalMult = bonusMult * effectiveFlash

  if (totalMult < 1.01) return null

  const tier =
    totalMult >= 10 ? 'LEGENDARY' :
    totalMult >= 5  ? 'EPIC' :
    totalMult >= 2  ? 'RARE' :
    'COMMON'

  const isHighTier = tier === 'LEGENDARY' || tier === 'EPIC'
  const auraClass = `aura-${tier.toLowerCase()}`

  const tierColors: Record<string, string> = {
    LEGENDARY: 'text-yellow-400 border-yellow-500 bg-[#fdfcf0]',
    EPIC:      'text-purple-500 border-purple-400/60 bg-purple-50',
    RARE:      'text-blue-500 border-blue-400/60 bg-blue-50',
    COMMON:    'text-gray-500 border-gray-300 bg-gray-50',
  }

  return (
    <div className="flex items-center justify-center mb-1">
      <div className={`badge-aura-wrapper ${auraClass} inline-flex items-center`}>
        <span
          className={`
            ${isHighTier ? 'text-[15px] px-4 py-1.5' : 'text-[13px] px-3 py-1'}
            font-black uppercase tracking-tight rounded-full border-2
            ${tierColors[tier]}
            relative z-10 inline-flex items-center gap-1 transition-colors duration-500
          `}
        >
          {totalMult.toFixed(1)}× TOTAL
        </span>
      </div>
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

  const tierKey = tier as BonusTier
  const style = BONUS_TIER_STYLES[tierKey] ?? BONUS_TIER_STYLES.COMMON

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

  const tierKey = (
    entry.bonusTier && entry.bonusTier in BONUS_TIER_STYLES
      ? entry.bonusTier
      : 'COMMON'
  ) as BonusTier

  const tierStyle = BONUS_TIER_STYLES[tierKey]
  const flashCfg = entry.flashEventType
    ? FLASH_EVENT_CARD[entry.flashEventType]
    : null

  const cardClass = isWin
    ? flashCfg
      ? flashCfg.cardClass
      : tierStyle?.cardClass
    : 'bg-slate-50 border-slate-100 opacity-90'

  return (
    <li
      className={`relative overflow-hidden w-full p-3.5 rounded-4xl border-2 transition-all ${cardClass}`}
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

      <TotalMultiplierHeader
        bonusMultiplier={entry.bonusMultiplier}
        flashMult={entry.flashMult ?? 1}
        isWin={isWin}
      />

      {isWin && entry.flashEventType && (
        <FlashEventBadge
          flashEventType={entry.flashEventType}
          flashMult={entry.flashMult ?? 1}
        />
      )}

      <div className="flex flex-col items-center justify-center py-0.5">
        <BonusBadge tier={entry.bonusTier} multiplier={entry.bonusMultiplier} />

        <div className="flex items-center justify-center gap-3 mt-1">
          {(() => {
            const { display, full, capped } = formatPoints(
              gainLossBig < 0n ? -gainLossBig : gainLossBig
            )
            return (
              <span
                className={`text-4xl min-[425px]:text-5xl font-black tabular-nums tracking-tighter ${amountAnimationClass}`}
                title={capped ? full : undefined}
                style={{ position: 'relative' }}
              >
                {isWin ? '+' : isLoss ? '-' : ''}
                {display}
              </span>
            )
          })()}
          <div className="w-6 h-6 min-[425px]:w-8 min-[425px]:h-8">
            <GemIcon size={32} />
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/3">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
            Stake:
          </span>
          <span className={getAmountColor(stakeBig)}>
            {formatPoints(entry.betAmount).display}
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
          bonusMultiplier: pred?.bonusMultiplier ?? 0,
          flashEventType: pred?.flashEventType ?? null,
          flashMult: pred?.flashMult ?? 1,
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

// Main Component

export default function BetHistory({ userId }: { userId: string | null }) {
  const [tab, setTab] = useState<Tab>('recent')

  const fetchFn = useTabFetchFn(userId, tab)

  const { matches, isLoading, isLoadingMore, hasMore, loadMatches, reset } =
    useInfiniteScroll({ fetchFn, enabled: !!userId })

  // Reset and reload whenever tab or userId changes
  useEffect(() => {
    reset()
    if (userId) loadMatches(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userId])

  const bets = matches as unknown as BetHistoryEntry[]

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
          <ul className="space-y-4">
            {bets.map((bet, i) => (
              <BetRow
                key={`${bet.gameId}-${bet.id}`}
                entry={bet}
                rank={tab !== 'recent' ? i : undefined}
              />
            ))}
            {isLoadingMore && (
              <li className="text-center py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 animate-pulse">
                Loading More
              </li>
            )}
            {!hasMore && bets.length > 0 && (
              <li className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-gray-200">
                End of Record
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
