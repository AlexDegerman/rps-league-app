'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { useUserStore } from '@/app/stores/userStore'
import { useUIStore } from '@/app/stores/uiStore'
import type { Match, VisualMode } from '@/types/rps'
import PendingMatchCard from '@/components/game/PendingMatchCard'
import MatchList from '@/components/game/MatchList'
import { getOrCreateUser, isUserValid } from '@/lib/user'
import { unlockOracle } from '@/lib/oracleTTS'
import { postPrediction } from '@/lib/api'
import { logger } from '@/lib/logger'

interface MatchFeedProps {
  visualMode: VisualMode
  matches: Match[]
  isLoadingMore: boolean
  hasMore: boolean
  backendReady: boolean
  persistentError: string | null
  isDuplicate: boolean
  showConnectionWarning: boolean
  isOffline: boolean
}

function MatchFeedComponent({
  visualMode,
  matches,
  isLoadingMore,
  hasMore,
  backendReady,
  persistentError,
  isDuplicate,
  showConnectionWarning,
  isOffline
}: MatchFeedProps) {
  const pendingMatches = useGameStore((s) => s.pendingMatches)
  const predictions = useGameStore((s) => s.predictions)
  const serverOffset = useGameStore((s) => s.serverOffset)
  const festivalModeKey = useGameStore((s) => s.festivalModeKey)
  const oracleSide = useGameStore((s) => s.oracleSide)
  const winStreak = useUserStore((s) => s.winStreak)

  const [now, setNow] = useState(0)

  useEffect(() => {
    Promise.resolve().then(() => {
      setNow(Date.now())
    })

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handlePick = useCallback(async (gameId: string, playerName: string) => {
    unlockOracle()
    const user = getOrCreateUser()
    const { betAmount: currentBet } = useUserStore.getState()
    if (!isUserValid(user) || !user.nickname || currentBet <= 0n) return

    const currentNotification = useUIStore.getState().notification
    if (currentNotification === 'new_visitor') {
      localStorage.setItem('rps_welcomed', '1')
      useUIStore.setState({ notification: null })
    }

    useGameStore.getState().setPrediction(gameId, {
      gameId,
      pick: playerName,
      confirmed: false,
      totalMultiplier: 1
    })

    let succeeded = false
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const { ok, data } = await postPrediction(
        {
          userId: user.userId,
          gameId,
          pick: playerName,
          betAmount: currentBet.toString(),
          nickname: user.nickname,
          shortId: user.shortId
        },
        controller.signal
      )

      clearTimeout(timeout)

      if (ok && data?.success === true) {
        succeeded = true
        if (currentNotification === 'oracle') {
          useUIStore.setState({ notification: null })
          useGameStore.getState().setOracleSide(null)
        }
        useGameStore.getState().updatePrediction(gameId, { confirmed: true })
      } else {
        useUIStore.getState().triggerError(data?.error || 'MATCH ALREADY ENDED')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger.warn('Prediction POST aborted (timeout)', {
          gameId,
          playerName
        })
        useUIStore.getState().triggerError('CONNECTION TOO SLOW')
      } else {
        logger.error(
          'Prediction POST failed',
          err instanceof Error ? err : undefined,
          { gameId, playerName }
        )
        useUIStore.getState().triggerError('CONNECTION FAILED')
      }
    } finally {
      if (!succeeded) useGameStore.getState().deletePrediction(gameId)
    }
  }, [])

  return (
    <div className="min-h-[60vh]">
      {!backendReady ? (
        <div className="text-center py-20 animate-pulse text-gray-400 text-sm">
          Connecting to live stream…
        </div>
      ) : (
        <>
          {persistentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-xs font-bold text-red-900 uppercase">
                {persistentError}
              </p>
            </div>
          )}

          {isDuplicate && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <p className="text-xs font-bold text-amber-900 uppercase">
                RPS League is open in another tab. Close this tab to continue.
              </p>
            </div>
          )}

          {showConnectionWarning && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-xs font-bold text-red-900 uppercase">
                {isOffline
                  ? 'No Internet Connection.'
                  : 'Server having issues.'}
              </p>
            </div>
          )}

          {pendingMatches
            .filter((pm) => {
              if (now === 0) return true
              return pm.expiresAt - (now + serverOffset) > -5000
            })
            .map((pending) => (
              <PendingMatchCard
                key={pending.gameId}
                pending={pending}
                prediction={predictions.get(pending.gameId) ?? null}
                onPick={handlePick}
                serverOffset={serverOffset}
                winStreak={winStreak}
                visualMode={visualMode}
                festivalModeKey={festivalModeKey}
                oracleSide={oracleSide}
              />
            ))}

          <MatchList
            matches={matches}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            predictions={predictions}
            winStreak={winStreak}
            visualMode={visualMode}
            festivalModeKey={festivalModeKey}
          />
        </>
      )}
    </div>
  )
}

const MatchFeed = React.memo(MatchFeedComponent)
MatchFeed.displayName = 'MatchFeed'
export default MatchFeed
