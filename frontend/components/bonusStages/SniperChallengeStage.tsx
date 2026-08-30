'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../../app/stores/gameStore'
import { postBonusAction, claimBonusWinnings } from '../../lib/api'
import { getOrCreateUser } from '../../lib/user'
import { useNeonSound } from '../../hooks/useNeonSound'

type Zone = 'bullseye' | 'clean' | 'hit' | 'near' | 'miss'

const ZONE_LABEL: Record<Zone, string> = {
  bullseye: '🎯 Perfect Bullseye',
  clean: 'Clean Hit',
  hit: 'Hit',
  near: 'Near Miss',
  miss: 'Miss'
}

const PAYOUTS: Record<Zone, number> = {
  bullseye: 10,
  clean: 8,
  hit: 6,
  near: 4,
  miss: 2
}

export default function SniperChallengeStage() {
  const bonusGridState = useGameStore((s) => s.bonusGridState)
  const updateBonusReward = useGameStore((s) => s.updateBonusReward)
  const setBonusFinalPayout = useGameStore((s) => s.setBonusFinalPayout)
  const { playNeonReward, playNeonComplete, playLoss, playChain } =
    useNeonSound()

  // Restore reconnect state
  const reconnect = bonusGridState as {
    fired?: boolean
    startTimestamp?: number
    sweepDurationMs?: number
  } | null

  const [hasStarted, setHasStarted] = useState(reconnect?.fired !== undefined)
  const [fired, setFired] = useState(reconnect?.fired ?? false)
  const [resolvedZone, setResolvedZone] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(false)
  const [reticlePos, setReticlePos] = useState(50) // Start the reticle at the center

  const rafRef = useRef<number | null>(null)
  const startTsRef = useRef<number>(reconnect?.startTimestamp ?? 0)

  // Reticle sweep duration
  const sweepDurRef = useRef<number>(1800)

  // Animate the reticle with requestAnimationFrame
  const animateReticle = useCallback(function animate() {
    if (startTsRef.current === 0) {
      startTsRef.current = Date.now()
    }
    const elapsed = Date.now() - startTsRef.current
    const cyclePos = (elapsed % sweepDurRef.current) / sweepDurRef.current
    const crosshairPos = 0.5 + 0.5 * Math.sin(2 * Math.PI * cyclePos)
    setReticlePos(crosshairPos * 100)
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (hasStarted && !fired) {
      rafRef.current = requestAnimationFrame(animateReticle)
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [hasStarted, fired, animateReticle])

  // Automatically start the game on mount
  useEffect(() => {
    if (reconnect?.fired !== undefined) return

    const initGame = async () => {
      const { userId } = getOrCreateUser()
      try {
        const result = await postBonusAction(userId, {
          action: 'START'
        })
        setHasStarted(true)

        const session = result?.session as {
          gridState?: { startTimestamp?: number }
        } | null
        const serverStart = session?.gridState?.startTimestamp
        startTsRef.current =
          typeof serverStart === 'number' ? serverStart : Date.now()
      } catch (err) {
        console.error('[SniperChallenge] start error', err)
      }
    }
    initGame()
  }, [reconnect])

  const fire = async () => {
    if (fired || loading || !hasStarted) return
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const tapTimestampMs = Date.now()
    const { userId } = getOrCreateUser()
    playChain(['slam', 'solar_flare_explosion'])
    setFired(true)
    setLoading(true)
    try {
      const result = await postBonusAction(userId, {
        action: 'FIRE',
        tapTimestampMs
      })
      if (!result?.session) return
      const session = result.session as {
        accumulatedPayout: string
        gridState: { resolvedZone: string } | null
      }
      const zone = (session.gridState?.resolvedZone ?? 'miss') as Zone
      setResolvedZone(zone)
      updateBonusReward(BigInt(session.accumulatedPayout))

      const zoneMultMap: Record<Zone, number> = {
        bullseye: 10,
        clean: 8,
        hit: 6,
        near: 4,
        miss: 2
      }
      const zoneMult = zoneMultMap[zone] ?? 2
      setTimeout(() => {
        if (zone === 'miss') {
          playLoss()
          return
        }
        playNeonReward(zoneMult)
        if (zone === 'bullseye') {
          setTimeout(() => playNeonComplete(true), 400)
        }
      }, 400)

      const claimResult = await claimBonusWinnings(userId)
      if (claimResult?.finalPayout) {
        const metricText = ZONE_LABEL[zone]
        setBonusFinalPayout(BigInt(claimResult.finalPayout), metricText)
      }
    } catch (err) {
      console.error('[SniperChallenge] fire error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stage-container stage-sniper-challenge py-1! px-3! gap-1.5!">
      <div className="stage-title g-qg no-pseudo mt-0! mb-0.5! leading-none">
        🎯 SNIPER CHALLENGE
      </div>

      {/* Target arena */}
      {!resolvedZone && (
        <div className="sf-arena relative w-full h-45 bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="absolute top-4 left-0 right-0 text-center px-4 select-none z-10 animate-fade-in">
            <p className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider leading-relaxed">
              Tap FIRE when the reticle aligns with the bullseye
            </p>
          </div>

          <div className="sniper-target relative w-24 h-24 flex items-center justify-center">
            <div
              className="sniper-ring absolute rounded-full border border-slate-800!"
              style={{ width: '96px', height: '96px' }}
            />
            <div
              className="sniper-ring absolute rounded-full border border-slate-800!"
              style={{ width: '64px', height: '64px' }}
            />
            <div
              className="sniper-ring absolute rounded-full border border-slate-800!"
              style={{ width: '32px', height: '32px' }}
            />
            <div
              className="sniper-bullseye bg-red-500!"
              style={{ width: '24px', height: '24px', borderRadius: '50%' }}
            />
          </div>

          {/* Sweeping reticle */}
          {hasStarted && (
            <div
              className="sniper-reticle text-red-500! leading-none font-bold absolute"
              style={{
                left: `${15 + reticlePos * 0.7}%`,
                transform: 'translateX(-50%)'
              }}
            >
              ⊕
            </div>
          )}
        </div>
      )}

      {!resolvedZone && (
        <button
          onClick={fire}
          disabled={fired || loading || !hasStarted}
          className="sniper-fire-btn w-full py-2.5 rounded-full bg-red-600 border border-red-400 text-white font-black text-sm uppercase tracking-widest cursor-pointer hover:bg-red-500 active:scale-95 shadow-[0_0_12px_rgba(239,68,68,0.3)] select-none"
        >
          {loading ? 'Processing...' : '🔫 FIRE'}
        </button>
      )}

      {/* Payout reference */}
      {!resolvedZone && hasStarted && (
        <div className="grid grid-cols-5 gap-1.5 w-full mt-1 px-1">
          {Object.entries(PAYOUTS).map(([zone, mult]) => (
            <div
              key={zone}
              className="py-1 px-1.5 rounded-lg border border-slate-100 bg-slate-50/50 text-center select-none"
            >
              <div className="text-[8px] text-slate-500 uppercase tracking-wider leading-none">
                {zone}
              </div>
              <div className="text-[9px] font-black text-slate-800 mt-0.5 leading-none">
                +{mult}x
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result display */}
      {resolvedZone && (
        <div className="flex flex-col items-center gap-2 mt-4 w-full select-none my-1">
          <p className="text-[1.1rem] font-extrabold text-slate-800 uppercase leading-none">
            {ZONE_LABEL[resolvedZone]}
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-none">
            {resolvedZone === 'bullseye'
              ? 'Jackpot : Perfect shot executed'
              : 'Target neutralized : Cushion payout awarded'}
          </p>
        </div>
      )}
    </div>
  )
}
