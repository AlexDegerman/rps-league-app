'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { useNeonSound } from '../../hooks/useNeonSound'

const STAGE_DURATION_MS = 5_000
const BASE_SPAWN_INTERVAL = 400
const BASE_NODE_LIFETIME = 950
const MAX_NODES_ON_SCREEN = 5

interface Node {
  id: number
  x: number // percentage 0-100
  y: number // percentage 0-100
  spawnedAt: number
  size: number
}

const getMultiplierForSeconds = (seconds: number): number => {
  if (seconds >= 4.8) return 10
  if (seconds >= 3.8) return 8
  if (seconds >= 2.8) return 6
  if (seconds >= 1.3) return 4
  return 2
}

export default function SurgeFrenzyStage() {
  const bonusLastBet = useGameStore((s) => s.bonusLastBet)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)

  const [nodes, setNodes] = useState<Node[]>([])
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(STAGE_DURATION_MS / 1000)
  const [hasStarted, setHasStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [startNode] = useState(() => ({
    x: 15 + Math.random() * 70,
    y: 45 + Math.random() * 40
  }))

  const { playNeonReward, playNeonComplete, playLoss, playElectric } =
    useNeonSound()

  const comboRef = useRef(0)
  const nodeIdRef = useRef(0)
  const endedRef = useRef(false)
  const gameTimeLeftRef = useRef(STAGE_DURATION_MS / 1000)
  const milestonesPlayedRef = useRef<Set<number>>(new Set())

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const spawnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const decayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnerRef = useRef<() => void>(() => {})
  const bonusActionQueueRef = useRef<Promise<unknown>>(Promise.resolve())

  // Keep comboRef synchronized so async callbacks always read the latest combo.
  useEffect(() => {
    comboRef.current = combo
  }, [combo])

  // Keep the ref synchronized so endGame can read the latest timer value.
  useEffect(() => {
    gameTimeLeftRef.current = timeLeft
  }, [timeLeft])

  const endGame = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    setGameOver(true)
    setLoading(true)

    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current)
    if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current)
    if (decayIntervalRef.current) clearInterval(decayIntervalRef.current)

    const { userId } = getOrCreateUser()
    try {
      // Sync final state to the server before claiming the authoritative payout.
      await bonusActionQueueRef.current

      await postBonusAction(userId, {
        action: 'END',
        comboAfterTap: comboRef.current
      })
      const claimResult = await claimBonusWinnings(userId)
      if (claimResult?.finalPayout) {
        const secondsSurvived = Number(
          (STAGE_DURATION_MS / 1000 - gameTimeLeftRef.current).toFixed(1)
        )
        const mult = getMultiplierForSeconds(secondsSurvived)
        const isMax = mult >= 10
        const metricText = isMax
          ? `Survived Full Storm : ${secondsSurvived}s`
          : `Frenzied For : ${secondsSurvived}s`

        setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
        if (isMax) {
          setTimeout(() => playNeonComplete(true), 400)
        }
      }
    } catch (err) {
      console.error('[SurgeFrenzy] end error', err)
    } finally {
      setLoading(false)
    }
  }, [setBonusFinalPayout, playNeonComplete])

  // Continuously spawn energy nodes until the stage ends or the arena reaches its node limit.
  const queueNextSpawn = useCallback(() => {
    if (endedRef.current || gameTimeLeftRef.current <= 0) return

    spawnTimeoutRef.current = setTimeout(() => {
      setNodes((prev) => {
        if (prev.length >= MAX_NODES_ON_SCREEN) return prev

        let x = 12 + Math.random() * 76
        let y = 12 + Math.random() * 76
        let attempts = 0

        // Avoid spawning nodes too close to existing active targets.
        const isTooClose = (cx: number, cy: number, activeNodes: Node[]) => {
          return activeNodes.some((n) => {
            const dx = cx - n.x
            const dy = cy - n.y
            return Math.sqrt(dx * dx + dy * dy) < 18
          })
        }

        while (attempts < 10 && isTooClose(x, y, prev)) {
          x = 12 + Math.random() * 76
          y = 12 + Math.random() * 76
          attempts++
        }

        const size = 64

        return [
          ...prev,
          { id: nodeIdRef.current++, x, y, spawnedAt: Date.now(), size }
        ]
      })
      spawnerRef.current()
    }, BASE_SPAWN_INTERVAL)
  }, [])

  // Keep the ref pointed at the latest spawner callback for recursive scheduling.
  useEffect(() => {
    spawnerRef.current = queueNextSpawn
  }, [queueNextSpawn])

  // Check node expiry frequently enough to end the stage on the first missed node.
  useEffect(() => {
    if (!hasStarted || gameOver) return

    decayIntervalRef.current = setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)

      setNodes((prev) => {
        const expired = prev.filter(
          (n) => currentTime - n.spawnedAt >= BASE_NODE_LIFETIME + 100
        )
        if (expired.length > 0) {
          // The first missed node immediately ends the frenzy.
          playLoss()
          endGame()
          return []
        }
        return prev.filter(
          (n) => currentTime - n.spawnedAt < BASE_NODE_LIFETIME + 100
        )
      })
    }, 50)

    return () => {
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current)
    }
  }, [hasStarted, gameOver, playLoss, endGame])

  const startFrenzy = () => {
    setHasStarted(true)
    playElectric()
    setCombo(1)
    comboRef.current = 1
    setNodes([])
    milestonesPlayedRef.current.clear()

    // Register the initial node tap before the frenzy begins.
    const { userId } = getOrCreateUser()

    bonusActionQueueRef.current = bonusActionQueueRef.current
      .then(() =>
        postBonusAction(userId, {
          action: 'TAP',
          comboAfterTap: 1
        })
      )
      .catch(() => {})

    updateBonusReward(bonusLastBet * BigInt(2))

    countdownIntervalRef.current = setInterval(() => {
      const nextTime = Number(
        Math.max(0, gameTimeLeftRef.current - 0.1).toFixed(1)
      )

      gameTimeLeftRef.current = nextTime

      setTimeLeft(nextTime)

      const survived = Number((STAGE_DURATION_MS / 1000 - nextTime).toFixed(1))

      if (nextTime <= 0) {
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current)

        setNodes((prev) => {
          const currentTime = Date.now()
          const hasExpiredNode = prev.some(
            (node) => currentTime - node.spawnedAt >= BASE_NODE_LIFETIME + 100
          )

          if (hasExpiredNode) {
            playLoss()
            endGame()
            return []
          }

          if (!milestonesPlayedRef.current.has(10)) {
            milestonesPlayedRef.current.add(10)
            playNeonReward(10)
          }

          endGame()
          return prev
        })

        return
      }

      if (survived >= 1.3 && !milestonesPlayedRef.current.has(4)) {
        milestonesPlayedRef.current.add(4)
        playNeonReward(4)
      } else if (survived >= 2.8 && !milestonesPlayedRef.current.has(6)) {
        milestonesPlayedRef.current.add(6)
        playNeonReward(6)
      } else if (survived >= 3.8 && !milestonesPlayedRef.current.has(8)) {
        milestonesPlayedRef.current.add(8)
        playNeonReward(8)
      }
    }, 100)

    queueNextSpawn()
  }

  const tapNode = (nodeId: number) => {
    if (gameOver || loading) return
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))

    const newCombo = comboRef.current + 1
    setCombo(newCombo)
    comboRef.current = newCombo
    playElectric()

    const secondsSurvived = Number(
      (STAGE_DURATION_MS / 1000 - gameTimeLeftRef.current).toFixed(1)
    )

    const { userId } = getOrCreateUser()
    
    // Queue the node tap to preserve server-side action ordering.
    bonusActionQueueRef.current = bonusActionQueueRef.current
      .then(() =>
        postBonusAction(userId, {
          action: 'TAP',
          comboAfterTap: newCombo
        })
      )
      .catch(() => {})

    const multiplier = getMultiplierForSeconds(secondsSurvived)
    updateBonusReward(bonusLastBet * BigInt(multiplier))
  }

  // Clear active timers when the stage unmounts.
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current)
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current)
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current)
    }
  }, [])

  const secondsSurvived = Number(
    (STAGE_DURATION_MS / 1000 - timeLeft).toFixed(1)
  )
  const currentMultiplier = getMultiplierForSeconds(secondsSurvived)

  return (
    <div className="stage-container stage-surge-frenzy py-1! px-3! gap-1.5!">
      <div className="stage-title g-ocqg no-pseudo mt-0! mb-0.5! leading-none">
        ⚡ SURGE FRENZY
      </div>

      <div className="sf-hud bg-slate-50! border border-slate-100! rounded-xl">
        <div className="sf-timer">
          <span className="sf-timer-label text-slate-500! font-bold">Time</span>
          <span
            className={`sf-timer-value text-slate-800! font-extrabold ${timeLeft <= 2 ? 'sf-timer-urgent text-red-600!' : ''}`}
          >
            {timeLeft.toFixed(1)}s
          </span>
        </div>
        <div className="sf-combo">
          <span className="sf-combo-label text-slate-500! font-bold">
            Combo
          </span>
          <span
            className={`sf-combo-value text-slate-800! font-extrabold ${combo >= 15 ? 'text-green-600!' : ''}`}
          >
            x{combo}
          </span>
        </div>
        <div className="sf-mult">
          <span className="sf-mult-label text-slate-500! font-bold">
            Reward
          </span>
          <span className="sf-mult-value text-green-600! font-extrabold">
            +{currentMultiplier}x
          </span>
        </div>
      </div>

      <div className="sf-timer-bar">
        <div
          className="sf-timer-fill"
          style={{
            width: `${(timeLeft / 5) * 100}%`,
            transition: 'width 0.1s linear'
          }}
        />
      </div>

      {!gameOver && (
        <div className="sf-arena relative w-full h-60 bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden">
          {!hasStarted && (
            <div className="absolute top-4 left-0 right-0 text-center px-4 select-none z-10 animate-fade-in">
              <p className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider leading-relaxed">
                Tap energy nodes instantly to survive
                <br />
                <span className="text-[8px] text-red-400 font-bold block mt-0.5">
                  First miss ends the game
                </span>
              </p>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-3">
                Tap the node to begin
              </p>
            </div>
          )}

          {!hasStarted ? (
            <button
              onClick={startFrenzy}
              className="absolute rounded-full cursor-pointer flex items-center justify-center select-none border-none"
              style={{
                left: `${startNode.x}%`,
                top: `${startNode.y}%`,
                width: '64px',
                height: '64px',
                transform: 'translate(-50%, -50%)',
                background:
                  'radial-gradient(circle at 35% 35%, #00d4ff 10%, #0064c8 90%)',
                boxShadow: '0 0 24px rgba(0, 212, 255, 0.8)'
              }}
              aria-label="Tap to Start"
            >
              <span className="text-white text-xs font-black">⚡</span>
            </button>
          ) : (
            nodes.map((node) => {
              const age = now - node.spawnedAt
              const opacity = Math.max(0.1, 1 - age / BASE_NODE_LIFETIME)

              return (
                <button
                  key={node.id}
                  onClick={() => tapNode(node.id)}
                  className="absolute rounded-full cursor-pointer flex items-center justify-center select-none border-none animate-in fade-in zoom-in duration-100"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: `${node.size}px`,
                    height: `${node.size}px`,
                    transform: 'translate(-50%, -50%)',
                    opacity: opacity,
                    background:
                      'radial-gradient(circle at 35% 35%, #00d4ff 10%, #0064c8 90%)',
                    boxShadow: '0 0 16px rgba(0, 212, 255, 0.6)'
                  }}
                  aria-label="Tap energy node"
                >
                  <span className="text-white text-xs font-black pointer-events-none select-none">
                    ⚡
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}

      {gameOver && (
        <div className="stage-result">
          <p className="sf-final-combo text-sm font-semibold text-slate-500">
            Final combo: x{combo} → +{currentMultiplier}x
          </p>
          <p className="stage-resolving text-xs text-slate-400 font-bold">
            {loading ? 'Calculating reward...' : 'Collecting...'}
          </p>
        </div>
      )}

      {!gameOver && hasStarted && (
        <div className="grid grid-cols-4 gap-1.5 w-full mt-1 px-1">
          {[1.3, 2.8, 3.8, 4.8].map((t) => {
            const isMilestoneActive = secondsSurvived >= t
            return (
              <div
                key={t}
                className={`py-1 px-1.5 rounded-lg border text-center transition-all duration-300 ${
                  isMilestoneActive
                    ? 'border-green-500 bg-green-50/20 text-green-600 font-bold'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="text-[8px] uppercase tracking-wider leading-none">
                  {t.toFixed(1)}s
                </div>
                <div className="text-[9px] font-black mt-0.5 leading-none">
                  +{getMultiplierForSeconds(t)}x
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
