'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useSound } from '@/hooks/useSound'
import type { WorldBossType } from '@/types/rps'
import { drainBurstEvents } from '@/lib/worldBossFeed'
import SoundIcon from '@/components/icons/SoundIcon'
import SoundControlPopover from '@/components/ui/SoundControlPopover'

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
          setTimeout(
            () =>
              setSlots((s) =>
                s.map((slot) =>
                  slot.id === slotId ? { ...slot, active: false } : slot
                )
              ),
            1300
          )
        }
        return next
      })
    }, 100)
    return () => clearInterval(interval)
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
  const oracleVolume = useUIStore((s) => s.oracleVolume)
  const setOracleVolume = useUIStore((s) => s.setOracleVolume)
  const {
    soundOn,
    toggleSound,
    volume,
    setVolume,
    playBossAttack,
    playBossTakeDmg
  } = useSound()
  const [showSoundPopover, setShowSoundPopover] = useState(false)
  const soundBtnRef = useRef<HTMLButtonElement>(null)
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

  useEffect(() => {
    const id = setTimeout(() => setAnimState('idle'), 1400)
    return () => clearTimeout(id)
  }, [])

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
      if (!bossType || animLockRef.current) return
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
          setShowHitFlash(false)
          setAnimState('pain')
          setTimeout(() => {
            setAnimState('idle')
            animLockRef.current = false
          }, 280)
        }, 400)
      } else {
        playBossAttack(bossType)
        setShowMissFlash(true)
        setOwnResultText({ text: 'BLOCKED', cls: 'miss' })

        setTimeout(() => {
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

  // Show 100% HP bar until the first participant joins (bossMaxHp === 0 means
  // no one has registered yet; HP is calculated dynamically from participants).
  const displayHpPct = bossMaxHp === 0 ? 100 : hpPct

  // Format damage as % of boss max HP
  const fmtDmgPct = (dmg: number) =>
    bossMaxHp > 0 ? `${((dmg / bossMaxHp) * 100).toFixed(1)}%` : `${dmg}`

  return (
    <div className="world-boss-arena">
      {showMissFlash && <div className="boss-miss-flash" />}

      {/* Top row: HP + sound control */}
      <div className="boss-top-row">
        <div className="boss-hp-section">
          <div className="boss-type-label">{bossType}</div>
          <div className="boss-hp-bar">
            <div
              className={`boss-hp-fill boss-${bossClass}`}
              style={{ width: `${displayHpPct}%` }}
            />
          </div>
          <div className="boss-hp-pct">
            {bossMaxHp === 0
              ? '100% HP remaining'
              : `${Math.round(hpPct)}% HP remaining`}
          </div>
        </div>

        <div className="boss-sound-area">
          <button
            ref={soundBtnRef}
            className="boss-sound-btn"
            onClick={() => setShowSoundPopover((p) => !p)}
          >
            <SoundIcon muted={!soundOn} />
          </button>
          {showSoundPopover && (
            <SoundControlPopover
              soundOn={soundOn}
              volume={volume}
              oracleVolume={oracleVolume}
              onVolumeChange={setVolume}
              onOracleVolumeChange={setOracleVolume}
              onToggleSound={toggleSound}
              anchorRef={soundBtnRef}
              onClose={() => setShowSoundPopover(false)}
            />
          )}
        </div>
      </div>

      {/* Mid row: boss model + damage ranking */}
      <div
        className="boss-mid-row"
        style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}
      >
        <div
          className="boss-model-area"
          ref={modelAreaRef}
          style={{
            height: '100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            width: '100%'
          }}
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
          className="boss-ranking-panel"
          style={{ minWidth: '80px', width: 'auto' }}
        >
          <div className="boss-ranking-title">⚔ DMG RANK</div>
          {topDamagers.length > 0 ? (
            topDamagers.map((d) => (
              <div
                key={d.userId}
                className="boss-rank-row top-rank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1.1',
                  gap: '4px',
                  width: '100%'
                }}
              >
                <span className="boss-rank-num" style={{ flexShrink: 0 }}>
                  #{d.rank}
                </span>
                <span
                  className="boss-rank-name"
                  style={{
                    fontSize: '0.52rem',
                    opacity: 0.7,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'inline-block',
                    maxWidth: 'clamp(42px, 20vw - 35px, 140px)'
                  }}
                  title={d.nickname || 'Player'}
                >
                  {d.nickname || 'Player'}
                </span>
                <span
                  className="boss-rank-dmg"
                  style={{
                    flexShrink: 0,
                    fontSize: '0.52rem'
                  }}
                >
                  {fmtDmgPct(d.damageDealt)}
                </span>
              </div>
            ))
          ) : (
            <div className="boss-rank-row">
              <span
                style={{
                  fontSize: '0.44rem',
                  opacity: 0.4,
                  textTransform: 'uppercase'
                }}
              >
                No hits yet
              </span>
            </div>
          )}
          {myRank !== null && myRank > 3 && (
            <div
              className="boss-rank-row my-rank"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <span className="boss-rank-num">#{myRank}</span>
              <span
                className="boss-rank-name"
                style={{
                  fontSize: '0.52rem',
                  opacity: 0.8,
                  textTransform: 'uppercase',
                  margin: '0 4px'
                }}
              >
                You
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: participant count + strike count + countdown */}
      <div className="boss-footer-row">
        <div className="boss-strike-counter">
          {/* participantCount = unique players who have predicted at least once */}
          <span className={`boss-strike-number ${strikeFlash ? 'bump' : ''}`}>
            {(participantCount ?? 0).toLocaleString()}
          </span>
          <span className="boss-strike-label">Players Striking</span>
        </div>
        <div className="boss-strike-counter">
          <span className={`boss-strike-number ${strikeFlash ? 'bump' : ''}`}>
            {strikeCount.toLocaleString()}
          </span>
          <span className="boss-strike-label">Total Strikes</span>
        </div>
        <div className="boss-countdown">
          <span className="boss-countdown-num">{timeLeft}</span>
          <span className="boss-strike-label">seconds left</span>
        </div>
      </div>
    </div>
  )
})
