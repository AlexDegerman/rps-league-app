'use client'

import { useEffect, useState } from 'react'
import { useIdleStore } from '@/app/stores/idleStore'
import { useGameStore } from '@/app/stores/gameStore'
import { useUserStore } from '@/app/stores/userStore'
import { postPrediction } from '@/lib/api'
import { getOrCreateUser, isUserValid } from '@/lib/user'

export function useIdleBet() {
  const {
    idleSide,
    isEligible,
    isProcessing,
    setIsProcessing,
    processedGameIds,
    markProcessed
  } = useIdleStore()

  const { pendingMatches, serverOffset, setPrediction } = useGameStore()
  const { betAmount } = useUserStore()

  // Track visibility state to force resume when tabbing back
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibility = () =>
      setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    // 1. HARD GUARDS
    if (!isVisible) return // Pauses on other tabs/minimized
    if (!idleSide || !isEligible || isProcessing) return

    const user = getOrCreateUser()
    if (!isUserValid(user) || betAmount <= 0n) return

    // 2. FIND TARGET MATCH
    const target = pendingMatches.find((pm) => !processedGameIds.has(pm.gameId))
    if (!target) return

    // 3. TIME CHECK (Don't bet if < 1s left)
    const timeLeft = target.expiresAt - (Date.now() + serverOffset)
    if (timeLeft < 1000) {
      markProcessed(target.gameId)
      return
    }

    // 4. EXECUTION
    const playerName = idleSide === 'left' ? target.playerA : target.playerB

    // Lock and update UI state immediately
    markProcessed(target.gameId)
    setIsProcessing(true)

    setPrediction(target.gameId, {
      gameId: target.gameId,
      pick: playerName,
      confirmed: false
    })

    console.log(`[IdleBet] 🚀 Auto-betting ${idleSide} for RoyalSilverFalcon`)

    postPrediction({
      userId: user.userId,
      gameId: target.gameId,
      pick: playerName,
      betAmount: betAmount.toString(),
      nickname: user.nickname!,
      shortId: user.shortId
    })
      .then(({ ok }) => {
        if (ok) {
          setPrediction(target.gameId, {
            gameId: target.gameId,
            pick: playerName,
            confirmed: true
          })
        }
      })
      .catch(() => {})
      .finally(() => {
        // Short lockout to prevent rapid fire
        setTimeout(() => setIsProcessing(false), 300)
      })
  }, [
    pendingMatches,
    idleSide,
    isEligible,
    isProcessing,
    betAmount,
    processedGameIds,
    isVisible,
    markProcessed,
    setIsProcessing,
    serverOffset,
    setPrediction
  ])
}
