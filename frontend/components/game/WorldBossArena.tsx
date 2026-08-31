'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { useSound } from '@/hooks/useSound'
import { drainBurstEvents } from '@/lib/worldBossFeed'
import SoundControlButton from '@/components/ui/SoundControlButton'
import { WorldBossType } from '@/types/worldboss'

type BossAnimState = 'assembling' | 'idle' | 'wince' | 'pain' | 'dying'

const HexurionModel = memo(function HexurionModel({
  animState
}: {
  animState: BossAnimState
}) {
  const floatClass = ['idle', 'wince', 'pain'].includes(animState) ? 'idle' : ''
  const modelClasses = [
    ['assembling', 'idle'].includes(animState) ? 'rotating' : '',
    animState === 'assembling' ? 'assembling' : '',
    animState === 'wince' ? 'wince' : '',
    animState === 'pain' ? 'pain' : '',
    animState === 'dying' ? 'dying' : ''
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={`hexurion-container ${floatClass}`}>
      <div className={`hexurion-model ${modelClasses}`}>
        <div className="hex-prism hex-outer" />
        <div className="hex-prism hex-mid" />
        <div className="hex-prism hex-inner" />
        <div className="hex-core-dot" />
      </div>
    </div>
  )
})

const OrphionModel = memo(function OrphionModel({
  animState
}: {
  animState: BossAnimState
}) {
  return (
    <div className={`orphion-container ${animState}`}>
      <div className="orphion-ring orphion-ring-outer" />
      <div className="orphion-ring orphion-ring-mid" />
      <div className="orphion-ring orphion-ring-inner" />
      <div className="orphion-core" />
    </div>
  )
})

const FRACTURON_CELLS = Array.from({ length: 49 }, (_, idx) => {
  const row = Math.floor(idx / 7),
    col = idx % 7
  const dist = Math.abs(row - 3) + Math.abs(col - 3)
  return { idx, visible: dist <= 3, edge: dist === 3 }
})

const FracturonModel = memo(function FracturonModel({
  animState
}: {
  animState: BossAnimState
}) {
  return (
    <div className={`fracturon-container ${animState}`}>
      <div className="fracturon-grid">
        {FRACTURON_CELLS.map(({ idx, visible, edge }) => (
          <div
            key={idx}
            className={[
              'fracturon-cell',
              !visible ? 'invisible' : '',
              edge && visible ? 'edge' : ''
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  )
})

const ApexionModel = memo(function ApexionModel({
  animState
}: {
  animState: BossAnimState
}) {
  return (
    <div className={`apexion-container ${animState}`}>
      <div className="apexion-pyramid" />
      <div className="apexion-shadow" />
    </div>
  )
})

const BossModel = memo(function BossModel({
  bossType,
  animState
}: {
  bossType: WorldBossType
  animState: BossAnimState
}) {
  switch (bossType) {
    case 'HEXURION':
      return <HexurionModel animState={animState} />
    case 'ORPHION':
      return <OrphionModel animState={animState} />
    case 'FRACTURON':
      return <FracturonModel animState={animState} />
    case 'APEXION':
      return <ApexionModel animState={animState} />
    default:
      return null
  }
})

interface DmgSlot {
  id: number
  content: string
  x: number
  y: number
  usedAt: number
  active: boolean
  isCrit: boolean
}

const POOL_SIZE = 20

const DamageNumberPool = memo(function DamageNumberPool({
  containerRef
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [slots, setSlots] = useState<DmgSlot[]>(() =>
    Array.from({ length: POOL_SIZE }, (_, i) => ({
      id: i,
      content: '',
      isCrit: false,
      x: 0,
      y: 0,
      usedAt: 0,
      active: false
    }))
  )
  
  useEffect(() => {
    const activeTimeouts: ReturnType<typeof setTimeout>[] = []

    const interval = setInterval(() => {
      const events = drainBurstEvents()
      if (!events.length) return
      const w = containerRef.current?.offsetWidth ?? 160
      const h = containerRef.current?.offsetHeight ?? 180
      setSlots((prev) => {
        const next = [...prev]
        for (const ev of events) {
          const freeIdx = next.findIndex((s) => !s.active)
          const targetIdx =
            freeIdx !== -1
              ? freeIdx
              : next.reduce(
                  (oldest, s, i) =>
                    s.usedAt < next[oldest].usedAt ? i : oldest,
                  0
                )
          next[targetIdx] = {
            id: next[targetIdx].id,
            content:
              ev.damage >= 3
                ? 'CRIT'
                : ev.damage === 2
                  ? 'STRIKE'
                  : ev.damage === 1
                    ? 'HIT'
                    : 'BLOCKED',
            isCrit: ev.damage > 1,
            x: 14 + Math.random() * (w - 50),
            y: 14 + Math.random() * (h - 50),
            usedAt: Date.now(),
            active: true
          }
          const slotId = next[targetIdx].id
          const tId = setTimeout(() => {
            setSlots((s) =>
              s.map((slot) =>
                slot.id === slotId ? { ...slot, active: false } : slot
              )
            )
            const tIdx = activeTimeouts.indexOf(tId)
            if (tIdx !== -1) activeTimeouts.splice(tIdx, 1)
          }, 1300)
          activeTimeouts.push(tId)
        }
        return next
      })
    }, 100)

    return () => {
      clearInterval(interval)
      activeTimeouts.forEach(clearTimeout)
    }
  }, [containerRef])

  return (
    <div className="boss-damage-pool">
      {slots.map((slot) =>
        slot.active ? (
          <span
            key={slot.id}
            className={`boss-dmg-number${slot.isCrit ? ' crit' : ''}`}
            style={{
              left: slot.x,
              top: slot.y,
              animation: 'dmg-float 1.2s ease-out forwards'
            }}
          >
            {slot.content}
          </span>
        ) : null
      )}
    </div>
  )
})

export default memo(function WorldBossArena({
  serverOffset
}: {
  serverOffset: number
}) {
  const bossType = useGameStore((s) => s.worldBossType)
  const hpPct = useGameStore((s) => s.worldBossHpPct)
  const bossMaxHp = useGameStore((s) => s.worldBossMaxHp)
  const strikeCount = useGameStore((s) => s.worldBossStrikeCount)
  const topDamagers = useGameStore((s) => s.worldBossTopDamagers)
  const myRank = useGameStore((s) => s.worldBossMyRank)
  const endsAt = useGameStore((s) => s.worldBossEncounterEndsAt)
  const lastHitResult = useGameStore((s) => s.lastBossHitResult)
  const lastBossHitDamage = useGameStore((s) => s.lastBossHitDamage)
  const clearLastHit = useGameStore((s) => s.clearLastBossHitResult)
  const participantCount = useGameStore((s) => s.worldBossParticipantCount)
  const { playBossAttack, playBossTakeDmg } = useSound()
  const [animState, setAnimState] = useState<BossAnimState>('assembling')
  const [timeLeft, setTimeLeft] = useState(60)
  const [showMissFlash, setShowMissFlash] = useState(false)
  const [showHitFlash, setShowHitFlash] = useState(false)
  const [ownResultText, setOwnResultText] = useState<{
    text: string
    cls: string
  } | null>(null)
  const [strikeFlash, setStrikeFlash] = useState(false)
  const modelAreaRef = useRef<HTMLDivElement>(null)
  const animLockRef = useRef(false)
  const hpPctRef = useRef(hpPct)

  useEffect(() => {
    hpPctRef.current = hpPct
  }, [hpPct])

  useEffect(() => {
    const id = setTimeout(() => setAnimState('idle'), 1400)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (hpPct <= 0 && bossMaxHp > 0) {
      setAnimState('dying')
    }
  }, [hpPct, bossMaxHp])

  useEffect(() => {
    if (!endsAt) return
    const tick = () =>
      setTimeLeft(
        Math.max(0, Math.ceil((endsAt - (Date.now() + serverOffset)) / 1000))
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt, serverOffset])

  const prevStrikeRef = useRef(strikeCount)
  useEffect(() => {
    if (strikeCount === prevStrikeRef.current) return
    prevStrikeRef.current = strikeCount
    setStrikeFlash(true)
    const id = setTimeout(() => setStrikeFlash(false), 120)
    return () => clearTimeout(id)
  }, [strikeCount])

  const triggerHitAnim = useCallback(
    (result: 'HIT' | 'MISS', damage: number = 1) => {
      if (!bossType || animLockRef.current || hpPctRef.current <= 0) return
      animLockRef.current = true

      if (result === 'HIT') {
        playBossTakeDmg(bossType)
        setAnimState('wince')
        setShowHitFlash(true)

        const isCrit = damage >= 3
        const isDouble = damage === 2
        setOwnResultText({
          text: isCrit ? 'CRIT' : isDouble ? 'STRIKE' : 'HIT',
          cls: isCrit ? 'hit-crit' : 'hit'
        })

        setTimeout(() => {
          if (hpPctRef.current <= 0) return
          setShowHitFlash(false)
          setAnimState('pain')
          setTimeout(() => {
            if (hpPctRef.current <= 0) return
            setAnimState('idle')
            animLockRef.current = false
          }, 280)
        }, 400)
      } else {
        playBossAttack(bossType)
        setShowMissFlash(true)
        setOwnResultText({ text: 'BLOCKED', cls: 'miss' })

        setTimeout(() => {
          if (hpPctRef.current <= 0) return
          setShowMissFlash(false)
          animLockRef.current = false
        }, 400)
      }

      // Clear result text after animation finishes
      setTimeout(() => setOwnResultText(null), 1800)
    },
    [bossType, playBossAttack, playBossTakeDmg]
  )

  useEffect(() => {
    if (!lastHitResult) return
    triggerHitAnim(lastHitResult, lastBossHitDamage)
    clearLastHit()
  }, [lastHitResult, lastBossHitDamage, triggerHitAnim, clearLastHit])

  if (!bossType) return null

  const bossClass = bossType.toLowerCase()

  const getBossTierClass = (type: WorldBossType): string => {
    const mapping: Record<WorldBossType, string> = {
      HEXURION: 'boss-tier-hex-lattice boss-tier-hex-breach',
      ORPHION: 'boss-tier-orph-orbit boss-tier-orph-horizon',
      FRACTURON: 'boss-tier-frac-matrix boss-tier-frac-corrupt',
      APEXION: 'boss-tier-apex-kinetic boss-tier-apex-zenith'
    }
    return mapping[type] || ''
  }

  // Show 100% HP bar until the first participant joins (bossMaxHp === 0 means
  // no one has registered yet; HP is calculated dynamically from participants).
  const displayHpPct = bossMaxHp === 0 ? 100 : hpPct

  // Format damage as % of boss max HP
  const fmtDmgPct = (dmg: number) =>
    bossMaxHp > 0 ? `${((dmg / bossMaxHp) * 100).toFixed(1)}%` : `${dmg}`

  return (
    <div
      className={`relative w-full bg-[radial-gradient(ellipse_at_50%_60%,rgba(20,10,40,0.98)_0%,rgba(5,3,15,1)_100%)] rounded-3xl border border-[rgba(168,85,247,0.2)] flex flex-col gap-2.5 p-3.5 overflow-hidden isolation-isolate before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_55%_35%_at_50%_75%,rgba(168,85,247,0.06)_0%,transparent_70%)] before:pointer-events-none before:z-[-1] before:animate-[arena-ambient_4s_ease-in-out_infinite] ${getBossTierClass(bossType)}`}
    >
      {showMissFlash && <div className="boss-miss-flash" />}

      {/* Top row: HP + sound control */}
      <div className="flex items-start gap-2.5 w-full">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="text-[0.58rem] font-black uppercase tracking-[0.28em] text-[rgba(216,180,254,0.75)]">
            {bossType}
          </div>
          <div className="h-2 w-full bg-[rgba(255,255,255,0.04)] rounded-full border border-[rgba(168,85,247,0.18)] overflow-hidden">
            <div
              className={`boss-hp-fill boss-${bossClass}`}
              style={{ width: `${displayHpPct}%` }}
            />
          </div>
          <div className="text-[0.48rem] font-black uppercase tracking-[0.14em] text-[rgba(168,85,247,0.45)]">
            {bossMaxHp === 0
              ? '100% HP remaining'
              : `${Math.round(hpPct)}% HP remaining`}
          </div>
        </div>

        <div className="shrink-0 flex items-start">
          <SoundControlButton className="p-1.75 rounded-full border border-[rgba(168,85,247,0.25)] bg-[rgba(168,85,247,0.08)] text-[rgba(216,180,254,0.7)] cursor-pointer transition-[background,color] duration-150 hover:bg-[rgba(168,85,247,0.18)] hover:text-[rgba(216,180,254,1)] flex items-center justify-center" />
        </div>
      </div>

      {/* Mid row: boss model + damage ranking */}
      <div
        className="flex items-center gap-2.5 w-full"
        style={{ padding: '2px 0' }}
      >
        <div
          className="flex-1 min-w-0 flex items-center justify-center relative overflow-hidden w-full"
          ref={modelAreaRef}
          style={{ height: '100px' }}
        >
          <BossModel bossType={bossType} animState={animState} />

          {showHitFlash && <div className="boss-hit-flash" />}

          {ownResultText && (
            <span className={`boss-result-text ${ownResultText.cls}`}>
              {ownResultText.text}
            </span>
          )}

          <DamageNumberPool containerRef={modelAreaRef} />
        </div>

        <div
          className="flex flex-col gap-1.5 self-center shrink-0"
          style={{ minWidth: '80px', width: 'auto' }}
        >
          <div className="text-[0.46rem] font-black uppercase tracking-[0.2em] text-[rgba(168,85,247,0.4)] text-center">
            ⚔ DMG RANK
          </div>
          {topDamagers.length > 0 ? (
            topDamagers.map((d) => (
              <div
                key={d.userId}
                className="flex items-center justify-center gap-1 px-1.75 py-1 bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.32)] rounded-[10px] text-[0.54rem] font-black text-[#d8b4fe] uppercase tracking-wider w-full leading-[1.1]"
              >
                <span className="text-[0.58rem] opacity-80 shrink-0">
                  #{d.rank}
                </span>
                <span
                  className="text-[0.52rem] opacity-70 whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-[0.02em] inline-block"
                  style={{ maxWidth: 'clamp(42px, 20vw - 35px, 140px)' }}
                  title={d.nickname || 'Player'}
                >
                  {d.nickname || 'Player'}
                </span>
                <span className="shrink-0 text-[0.52rem] tabular-nums">
                  {fmtDmgPct(d.damageDealt)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between gap-1 px-1.75 py-1 bg-[rgba(168,85,247,0.06)] border border-[rgba(168,85,247,0.12)] rounded-[10px] text-[0.54rem] font-black text-[rgba(216,180,254,0.5)] uppercase tracking-wider">
              <span className="text-[0.44rem] opacity-40 uppercase">
                No hits yet
              </span>
            </div>
          )}
          {myRank !== null && myRank > 3 && (
            <div className="flex items-center gap-1 px-1.75 py-1 bg-[rgba(34,211,238,0.06)] border border-[rgba(34,211,238,0.35)] rounded-[10px] text-[0.54rem] font-black text-[#67e8f9] uppercase tracking-wider">
              <span className="text-[0.58rem] opacity-80">#{myRank}</span>
              <span className="text-[0.52rem] opacity-80 uppercase mx-1">
                You
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: participant count + strike count + countdown */}
      <div className="flex items-center justify-between w-full pt-0.5 border-t border-[rgba(168,85,247,0.08)]">
        <div className="flex flex-col items-start gap-px">
          {/* participantCount = unique players who have predicted at least once */}
          <span className={`boss-strike-number ${strikeFlash ? 'bump' : ''}`}>
            {(participantCount ?? 0).toLocaleString()}
          </span>
          <span className="text-[0.46rem] font-black uppercase tracking-[0.2em] text-[rgba(216,180,254,0.35)]">
            Players Striking
          </span>
        </div>
        <div className="flex flex-col items-start gap-px">
          <span className={`boss-strike-number ${strikeFlash ? 'bump' : ''}`}>
            {strikeCount.toLocaleString()}
          </span>
          <span className="text-[0.46rem] font-black uppercase tracking-[0.2em] text-[rgba(216,180,254,0.35)]">
            Total Strikes
          </span>
        </div>
        <div className="flex flex-col items-end gap-px">
          <span className="text-2xl font-black text-[rgba(216,180,254,0.85)] tabular-nums leading-none">
            {timeLeft}
          </span>
          <span className="text-[0.46rem] font-black uppercase tracking-[0.2em] text-[rgba(168,85,247,0.3)]">
            seconds left
          </span>
        </div>
      </div>
    </div>
  )
})
