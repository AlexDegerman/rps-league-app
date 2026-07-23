'use client'

import { useEffect, useState, memo, useRef } from 'react'
import { useAnimatedBigIntVal } from '@/hooks/useAnimatedBigInt'
import { formatPoints } from '@/lib/format'
import { useRelicStore } from '@/app/stores/relicStore'
import { useUIStore } from '@/app/stores/uiStore'
import type { RelicDef } from '@/lib/relics'
import { useSound } from '@/hooks/useSound'

type ChestRarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHICAL'
  | 'RAINBOW'

export interface ChestResult {
  chestRarity: ChestRarity
  pointReward: bigint
  relicDrop: RelicDef | null
  twinRelicDrop: RelicDef | null
  twinFortune: boolean
  twinFortuneReward: bigint | null
}

const CHEST_STYLES: Record<
  ChestRarity,
  { bg: string; border: string; glow: string; label: string }
> = {
  COMMON: {
    bg: 'rgba(100,116,139,.15)',
    border: 'rgba(148,163,184,.5)',
    glow: 'rgba(148,163,184,.5)',
    label: 'Common Chest'
  },
  RARE: {
    bg: 'rgba(37,99,235,.15)',
    border: 'rgba(96,165,250,.6)',
    glow: 'rgba(96,165,250,.7)',
    label: 'Rare Chest'
  },
  EPIC: {
    bg: 'rgba(126,34,206,.15)',
    border: 'rgba(192,132,252,.6)',
    glow: 'rgba(168,85,247,.7)',
    label: 'Epic Chest'
  },
  LEGENDARY: {
    bg: 'rgba(161,98,7,.15)',
    border: 'rgba(251,191,36,.65)',
    glow: 'rgba(245,158,11,.8)',
    label: 'Legendary Chest'
  },
  MYTHICAL: {
    bg: 'rgba(153,27,27,.15)',
    border: 'rgba(248,113,113,.6)',
    glow: 'rgba(239,68,68,.8)',
    label: 'Mythical Chest'
  },
  RAINBOW: {
    bg: 'rgba(168,85,247,.15)',
    border: 'rgba(216,180,254,.65)',
    glow: 'rgba(255,255,255,.9)',
    label: '🌈 RAINBOW CHEST'
  }
}

const RAY_COUNT = 8
const RAY_INDEXES = Array.from({ length: RAY_COUNT })

const ChestBox = memo(function ChestBox({
  rarity,
  pointReward,
  isOpen,
  isTwin,
  relicDrop
}: {
  rarity: ChestRarity
  pointReward: bigint
  isOpen: boolean
  isTwin?: boolean
  relicDrop?: ChestResult['relicDrop']
}) {
  const style = CHEST_STYLES[rarity]
  const isRainbow = rarity === 'RAINBOW'
  const animPts = useAnimatedBigIntVal(isOpen ? pointReward : 0n, 800, true)
  const { display } = formatPoints(animPts)
  const rainbowColors = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(34, 211, 238, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(236, 72, 153, 0.8)'
  ]

  return (
    <div
      className="flex flex-col items-center gap-3 relative"
      style={{
        animation: 'chest-drop 0.7s cubic-bezier(0.22,1,0.36,1) forwards'
      }}
    >
      {/* Rotating rays */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          animation: 'ray-spin 12s linear infinite',
          transformOrigin: 'center',
          willChange: 'transform'
        }}
      >
        {RAY_INDEXES.map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: '2px',
              height: '120px',
              background: `linear-gradient(to top, transparent, ${
                isRainbow ? rainbowColors[i] : style.glow
              }, transparent)`,
              transform: `rotate(${i * (360 / RAY_COUNT)}deg) translateY(-60px)`,
              opacity: isOpen ? 0.75 : 0.35,
              transformOrigin: 'bottom center',
              willChange: 'transform'
            }}
          />
        ))}
      </div>

      {/* Chest body */}
      <div
        className={`relative w-24 h-20 rounded-xl border flex items-center justify-center overflow-hidden ${
          isRainbow ? 'animate-rainbow-chest' : ''
        }`}
        style={
          isRainbow
            ? undefined
            : {
                background: style.bg,
                borderColor: style.border,
                boxShadow: `0 0 24px ${style.glow}`
              }
        }
      >
        {/* Lid */}
        <div
          className="absolute top-0 left-0 right-0 h-8 rounded-t-xl border-b flex items-center justify-center"
          style={{
            background: style.bg,
            borderColor: style.border,
            transformOrigin: 'top center',
            transform: isOpen ? 'rotateX(-110deg)' : 'rotateX(0deg)',
            transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)'
          }}
        >
          <span
            style={{
              fontSize: '0.45rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '.15em',
              color: style.border
            }}
          >
            {isTwin ? 'BONUS CHEST' : style.label}
          </span>
        </div>
        {/* Point amount */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-0.5">
          {isOpen && (
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 900,
                color: '#86efac',
                textShadow: '0 0 12px rgba(134,239,172,.9)'
              }}
            >
              +{display}
            </span>
          )}
        </div>
      </div>

      {/* Relic drop indicator */}
      {isOpen && relicDrop && (
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            isRainbow ? 'animate-rainbow-relic-badge' : ''
          }`}
          style={
            isRainbow
              ? undefined
              : {
                  borderColor: 'rgba(168,85,247,.4)',
                  background: 'rgba(168,85,247,.1)'
                }
          }
        >
          <span
            className={isRainbow ? 'animate-rainbow-text' : ''}
            style={
              isRainbow
                ? {
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '.12em'
                  }
                : {
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    color: '#d8b4fe',
                    textTransform: 'uppercase',
                    letterSpacing: '.12em'
                  }
            }
          >
            🧿 {relicDrop.rarity}: {relicDrop.name}
          </span>
        </div>
      )}
    </div>
  )
})

export default function WorldBossChestOpening({
  result,
  onComplete
}: {
  result: ChestResult
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<'drop' | 'open' | 'twin' | 'done'>('drop')
  const pushRelicToQueue = useRelicStore((s) => s.pushToDropQueue)
  const enqueuePopup = useUIStore((s) => s.enqueuePopup)
  const { playMirageCataclysm } = useSound()
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    if (!hasPlayedRef.current) {
      playMirageCataclysm()
      hasPlayedRef.current = true
    }
  }, [playMirageCataclysm])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('open'), 900)
    const t2 = result.twinFortune
      ? setTimeout(() => setPhase('twin'), 1800)
      : null
    const t3 = setTimeout(
      () => {
        // Queue both relics, twin relic queued second, different key guaranteed by backend
        if (result.relicDrop) {
          pushRelicToQueue(result.relicDrop)
          enqueuePopup({ id: `boss-relic-${Date.now()}`, kind: 'relic_drop' })
        }
        if (result.twinRelicDrop) {
          pushRelicToQueue(result.twinRelicDrop)
          enqueuePopup({
            id: `boss-twin-relic-${Date.now()}`,
            kind: 'relic_drop'
          })
        }
        setPhase('done')
      },
      result.twinFortune ? 3400 : 2200
    )

    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [result, pushRelicToQueue, enqueuePopup])

  useEffect(() => {
    if (phase !== 'done') return
    const id = setTimeout(onComplete, 600)
    return () => clearTimeout(id)
  }, [phase, onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className="flex flex-col items-center gap-6">
        <p
          style={{
            fontSize: '.7rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '.3em',
            color: 'rgba(216,180,254,.7)'
          }}
        >
          Encounter Reward
        </p>

        <div className="flex gap-8 items-end">
          <ChestBox
            rarity={result.chestRarity}
            pointReward={result.pointReward}
            isOpen={phase !== 'drop'}
            relicDrop={result.relicDrop}
          />
          {result.twinFortune && result.twinFortuneReward && (
            <div
              style={{
                opacity: phase === 'twin' || phase === 'done' ? 1 : 0,
                transition:
                  'opacity .4s ease, transform .5s cubic-bezier(.22,1,.36,1)',
                transform:
                  phase === 'twin' || phase === 'done'
                    ? 'translateX(0)'
                    : 'translateX(40px)'
              }}
            >
              <ChestBox
                rarity={result.chestRarity}
                pointReward={result.twinFortuneReward}
                isOpen={phase === 'twin' || phase === 'done'}
                isTwin
                relicDrop={result.twinRelicDrop}
              />
            </div>
          )}
        </div>

        <button
          onClick={onComplete}
          style={{
            fontSize: '.55rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '.2em',
            color: 'rgba(168,85,247,.4)',
            padding: '6px 16px',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none'
          }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
