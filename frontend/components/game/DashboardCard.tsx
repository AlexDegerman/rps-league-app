'use client'

import { useRef, useState } from 'react'
import GemIcon from '@/components/icons/GemIcon'
import InfoIcon from '@/components/icons/InfoIcon'
import CloseIcon from '@/components/icons/CloseIcon'
import RelicSlot from '@/components/relics/RelicSlot'
import SoundIcon from '@/components/icons/SoundIcon'
import SoundControlPopover from '@/components/ui/SoundControlPopover'
import FlashBadge from '@/components/badges/FlashBadge'
import StreakBadge from '@/components/badges/StreakBadge'
import ModeButton from '@/components/ui/ModeButton'
import { useGameStore } from '@/app/stores/gameStore'
import { useUserStore } from '@/app/stores/userStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useSound } from '@/hooks/useSound'
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'
import {
  formatPoints,
  getDisplayTierClass,
  getFullNumberName
} from '@/lib/format'
import { oracleTemplates } from '@/lib/oracleTemplates'
import BetAmountInput from '@/components/ui/BetAmountInput'

const DASHBOARD_BORDER_CLASSES: Record<string, string> = {
  flash_lunar: 'border-blue-200 lunar-ring',
  flash_electric: 'border-purple-400 electric-ring',
  flash_cards: 'border-yellow-400 cards-ring',
  flash_hellfire: 'border-red-500 hellfire-ring',
  global_tidal_surge: 'border-cyan-300 tidal-ring',
  global_solar_flare: 'border-amber-300 solar-ring',
  global_cyclone_blitz: 'border-slate-300 cyclone-ring',
  global_mirage_cataclysm: 'border-purple-300 mirage-ring',
  winstreak_inferno: 'border-orange-400 inferno-ring',
  winstreak_fever: 'border-green-400 fever-ring',
  festival_ghost: 'border-teal-300 ghost-ring',
  festival_safeguard: 'border-slate-300 safeguard-ring',
  festival_resonance: 'border-yellow-300 resonance-ring',
  festival_surge: 'border-cyan-300 surge-ring',
  festival_vault: 'border-indigo-300 vault-ring',
  festival_spark: 'border-purple-300 spark-neon-pulse',
  festival_fever: 'border-orange-400 fever-festival-ring',
  festival_sanguine: 'border-red-900 sanguine-ring'
}

const DASHBOARD_INNER: Record<
  string,
  { inputBorder: string; inputRing: string; label: string; rankPill: string }
> = {
  flash_lunar: {
    inputBorder: 'border-blue-300',
    inputRing: 'focus:ring-blue-300',
    label: 'text-blue-400',
    rankPill: 'bg-blue-100 text-blue-700'
  },
  flash_electric: {
    inputBorder: 'border-purple-400',
    inputRing: 'focus:ring-purple-400',
    label: 'text-purple-500',
    rankPill: 'bg-purple-100 text-purple-700'
  },
  flash_cards: {
    inputBorder: 'border-yellow-400',
    inputRing: 'focus:ring-yellow-400',
    label: 'text-yellow-600',
    rankPill: 'bg-yellow-100 text-yellow-700'
  },
  flash_hellfire: {
    inputBorder: 'border-red-400',
    inputRing: 'focus:ring-red-400',
    label: 'text-red-500',
    rankPill: 'bg-red-100 text-red-700'
  },
  global_tidal_surge: {
    inputBorder: 'border-cyan-300',
    inputRing: 'focus:ring-cyan-400',
    label: 'text-cyan-500',
    rankPill: 'bg-cyan-100 text-cyan-700'
  },
  global_solar_flare: {
    inputBorder: 'border-amber-300',
    inputRing: 'focus:ring-amber-400',
    label: 'text-amber-500',
    rankPill: 'bg-amber-100 text-amber-700'
  },
  global_cyclone_blitz: {
    inputBorder: 'border-slate-300',
    inputRing: 'focus:ring-slate-400',
    label: 'text-slate-500',
    rankPill: 'bg-slate-100 text-slate-700'
  },
  global_mirage_cataclysm: {
    inputBorder: 'border-purple-300',
    inputRing: 'focus:ring-purple-400',
    label: 'text-purple-500',
    rankPill: 'bg-purple-100 text-purple-700'
  },
  winstreak_inferno: {
    inputBorder: 'border-orange-400',
    inputRing: 'focus:ring-orange-400',
    label: 'text-orange-500',
    rankPill: 'bg-orange-100 text-orange-700'
  },
  winstreak_fever: {
    inputBorder: 'border-green-400',
    inputRing: 'focus:ring-green-400',
    label: 'text-green-600',
    rankPill: 'bg-green-100 text-green-700'
  },
  festival_ghost: {
    inputBorder: 'border-teal-300',
    inputRing: 'focus:ring-teal-400',
    label: 'text-teal-500',
    rankPill: 'bg-teal-100 text-teal-700'
  },
  festival_safeguard: {
    inputBorder: 'border-slate-300',
    inputRing: 'focus:ring-slate-400',
    label: 'text-slate-500',
    rankPill: 'bg-slate-100 text-slate-600'
  },
  festival_resonance: {
    inputBorder: 'border-yellow-300',
    inputRing: 'focus:ring-yellow-400',
    label: 'text-yellow-600',
    rankPill: 'bg-yellow-100 text-yellow-700'
  },
  festival_surge: {
    inputBorder: 'border-cyan-300',
    inputRing: 'focus:ring-cyan-400',
    label: 'text-cyan-500',
    rankPill: 'bg-cyan-100 text-cyan-700'
  },
  festival_vault: {
    inputBorder: 'border-indigo-300',
    inputRing: 'focus:ring-indigo-400',
    label: 'text-indigo-500',
    rankPill: 'bg-indigo-100 text-indigo-700'
  },
  festival_spark: {
    inputBorder: 'border-purple-300',
    inputRing: 'focus:ring-purple-400',
    label: 'text-purple-500',
    rankPill: 'bg-purple-100 text-purple-700'
  },
  festival_fever: {
    inputBorder: 'border-orange-400',
    inputRing: 'focus:ring-orange-400',
    label: 'text-orange-500',
    rankPill: 'bg-orange-100 text-orange-700'
  },
  festival_sanguine: {
    inputBorder: 'border-red-800',
    inputRing: 'focus:ring-red-700',
    label: 'text-red-800',
    rankPill: 'bg-red-100 text-red-900'
  }
}

const DEFAULT_INNER = {
  inputBorder: 'border-gray-200',
  inputRing: 'focus:ring-purple-300',
  label: 'text-gray-400',
  rankPill: 'bg-purple-100 text-purple-600'
}

const DASHBOARD_BG: Record<string, string> = {
  flash_lunar:
    'linear-gradient(to bottom, rgba(144,205,244,0.12), rgba(144,205,244,0.32))',
  flash_electric:
    'linear-gradient(to bottom, rgba(159,122,234,0.12), rgba(159,122,234,0.32))',
  flash_cards:
    'linear-gradient(to bottom, rgba(236,201,75,0.10),  rgba(236,201,75,0.30))',
  flash_hellfire:
    'linear-gradient(to bottom, rgba(220,38,38,0.10),   rgba(220,38,38,0.28))',
  global_tidal_surge:
    'linear-gradient(to bottom, rgba(34,211,238,0.10),  rgba(34,211,238,0.30))',
  global_solar_flare:
    'linear-gradient(to bottom, rgba(245,158,11,0.10),  rgba(251,191,36,0.32))',
  global_cyclone_blitz:
    'linear-gradient(to bottom, rgba(148,163,184,0.10), rgba(148,163,184,0.28))',
  global_mirage_cataclysm:
    'linear-gradient(to bottom, rgba(168,85,247,0.10), rgba(217,119,6,0.26))',
  winstreak_inferno:
    'linear-gradient(to bottom, rgba(249,115,22,0.10),  rgba(239,68,68,0.28))',
  winstreak_fever:
    'linear-gradient(to bottom, rgba(34,197,94,0.08),   rgba(34,197,94,0.24))',
  festival_ghost:
    'linear-gradient(to bottom, rgba(77,208,196,0.08),  rgba(77,208,196,0.26))',
  festival_safeguard:
    'linear-gradient(to bottom, rgba(100,116,139,0.08), rgba(100,116,139,0.22))',
  festival_resonance:
    'linear-gradient(to bottom, rgba(236,201,75,0.08),  rgba(236,201,75,0.28))',
  festival_surge:
    'linear-gradient(to bottom, rgba(34,211,238,0.08),  rgba(34,211,238,0.26))',
  festival_vault:
    'linear-gradient(to bottom, rgba(59,91,219,0.08),   rgba(59,91,219,0.26))',
  festival_spark:
    'linear-gradient(to bottom, rgba(168,85,247,0.10),  rgba(168,85,247,0.28))',
  festival_fever:
    'linear-gradient(to bottom, rgba(220,38,38,0.08),   rgba(220,38,38,0.26))',
  festival_sanguine:
    'linear-gradient(to bottom, rgba(127,29,29,0.10),   rgba(127,29,29,0.32))'
}

export default function DashboardCard() {
  const visualMode = useGameStore((s) => s.visualMode)
  const oracleSide = useGameStore((s) => s.oracleSide)
  const festivalModeKey = useGameStore((s) => s.festivalModeKey)
  const flashBuffRemaining = useGameStore((s) => s.flashBuffRemaining)
  const points = useUserStore((s) => s.points)
  const pointsLoaded = useUserStore((s) => s.pointsLoaded)
  const setBetAmount = useUserStore((s) => s.setBetAmount)
  const autoAllIn = useUserStore((s) => s.autoAllIn)
  const setAutoAllIn = useUserStore((s) => s.setAutoAllIn)
  const isHydrated = useUserStore((s) => s.isHydrated)
  const winStreak = useUserStore((s) => s.winStreak)
  const streakMult = useUserStore((s) => s.streakMult)
  const displayNickname = useUserStore((s) => s.displayNickname)
  const dailyRank = useUserStore((s) => s.dailyRank)
  const stylePreference = useUserStore((s) => s.stylePreference)

  const showPointsInfo = useUIStore((s) => s.showPointsInfo)
  const setShowPointsInfo = useUIStore((s) => s.setShowPointsInfo)
  const showPointsExplainer = useUIStore((s) => s.showPointsExplainer)
  const setShowPointsExplainer = useUIStore((s) => s.setShowPointsExplainer)
  const notification = useUIStore((s) => s.notification)
  const setNotification = useUIStore((s) => s.setNotification)
  const oracleVolume = useUIStore((s) => s.oracleVolume)
  const setOracleVolume = useUIStore((s) => s.setOracleVolume)

  const { soundOn, toggleSound, volume, setVolume } = useSound()
  const [showSoundPopover, setShowSoundPopover] = useState(false)
  const soundBtnRef = useRef<HTMLButtonElement>(null)

  const pointsRef = useRef<HTMLSpanElement>(null)
  useAnimatedBigInt(pointsRef, points, stylePreference, 1000)
  const { full, capped } = formatPoints(points)

  const numberName = pointsLoaded ? getFullNumberName(points) : ''
  const shouldShowTooltip =
    showPointsExplainer && numberName && numberName !== 'Points'

  const borderClass =
    (visualMode && DASHBOARD_BORDER_CLASSES[visualMode]) || 'border-gray-100'

  const inner = (visualMode && DASHBOARD_INNER[visualMode]) || DEFAULT_INNER

  const dashBg = (visualMode && DASHBOARD_BG[visualMode]) || null

  return (
    <div
      className={`rounded-xl border shadow-sm p-2 transition-all duration-500 relative ${
        visualMode ? `event-side-${visualMode}` : 'bg-white'
      } ${borderClass}`}
      style={dashBg ? { background: dashBg } : undefined}
    >
      {/* Dynamic particles aligned with visual mode */}
      {visualMode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div
            className={`event-dynamic-particles particles-${visualMode} absolute inset-0`}
          />
        </div>
      )}

      {/* Top section */}
      <div className="mb-1 relative z-30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {/* Points balance rendering */}
            <div className="flex items-center gap-2">
              <div className="relative group flex items-center">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  title={capped ? full : undefined}
                  onMouseEnter={() => {
                    if (!capped) setShowPointsExplainer(true)
                  }}
                  onMouseLeave={() => setShowPointsExplainer(false)}
                  onClick={() => {
                    if (!capped) setShowPointsExplainer(!showPointsExplainer)
                  }}
                >
                  <GemIcon size={24} className="shrink-0" />
                  <span className="text-xl font-bold tabular-nums">
                    <span className="text-xl font-bold tabular-nums">
                      <span ref={pointsRef} style={{ position: 'relative' }}>
                        {pointsLoaded ? '' : '...'}
                      </span>
                    </span>
                  </span>
                </div>
                {shouldShowTooltip && (
                  <div className="absolute top-full mt-2 left-0 z-50 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      <span
                        className={`${getDisplayTierClass(points, stylePreference)} tier-clean-text`}
                      >
                        {numberName}
                      </span>
                    </span>
                    <div className="absolute -top-1 left-10 w-2 h-2 bg-white border-t border-l border-gray-100 rotate-45" />
                  </div>
                )}
              </div>

              <div className="relative group flex items-center ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPointsInfo(!showPointsInfo)
                  }}
                  onBlur={() => setShowPointsInfo(false)}
                  className="text-gray-300 hover:text-purple-500 transition-colors p-1 outline-none sm:pointer-events-none"
                >
                  <InfoIcon />
                </button>
                <div
                  className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-70 sm:w-56 p-3 bg-gray-900 text-white text-[10px] sm:text-xs font-medium rounded-lg shadow-xl transition-opacity duration-200 z-50 text-center tracking-wide leading-relaxed ${showPointsInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'} sm:group-hover:opacity-100`}
                >
                  Virtual simulation points. No real-world currency or value.
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-gray-900" />
                </div>
              </div>
            </div>

            {/* Nickname + rank banner */}
            {displayNickname && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="text-[10px] font-black text-gray-500 tracking-wider overflow-hidden whitespace-nowrap block min-w-0"
                  title={displayNickname}
                >
                  {displayNickname}
                </span>
                {dailyRank && (
                  <span
                    className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap transition-colors duration-500 ${inner.rankPill}`}
                  >
                    #{dailyRank} today
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sound trigger and popover */}
          <div className="relative flex items-center gap-2 shrink-0">
            <RelicSlot align="right" />
            <button
              ref={soundBtnRef}
              onClick={() => setShowSoundPopover((p) => !p)}
              className="shrink-0 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm bg-white"
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

        {/* Dynamic event badges */}
        {displayNickname && (
          <div className="flex gap-1 mt-1 max-w-sm">
            <FlashBadge
              visualMode={visualMode}
              flashBuffRemaining={flashBuffRemaining}
            />
            <StreakBadge winStreak={winStreak} streakMult={streakMult} />
          </div>
        )}
      </div>

      {/* Bet inputs section */}
      <div className="flex flex-row items-center gap-1 sm:gap-2 h-10 relative z-10">
        <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
          <label
            className={`hidden min-[370px]:block text-xs font-bold uppercase shrink-0 transition-colors duration-500 ${inner.label}`}
          >
            Amount
          </label>
          <div className="relative flex-1 min-w-0 h-full">
            <BetAmountInput
              innerBorder={inner.inputBorder}
              innerRing={inner.inputRing}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 h-full">
          <ModeButton
            visualMode={visualMode}
            festivalModeKey={festivalModeKey}
            label="ALL IN"
            onClick={() => {
              setBetAmount(points)
              useUIStore.getState().setInputString(points.toString())
            }}
          />
          <ModeButton
            visualMode={visualMode}
            festivalModeKey={festivalModeKey}
            label={`AUTO\u00A0${autoAllIn ? 'ON' : 'OFF'}`}
            onClick={() => setAutoAllIn(!autoAllIn)}
          />
        </div>
      </div>

      {/* Notifications overlay slots */}
      {notification && isHydrated && (
        <div className="flex flex-col gap-2 mt-3 relative z-10">
          {(notification === 'new_visitor' || notification === 'no_bigint') && (
            <div
              className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 border animate-in fade-in slide-in-from-top-2 duration-400 ${
                notification === 'no_bigint'
                  ? 'bg-red-50/90 border-red-200'
                  : 'bg-indigo-50/90 border-indigo-200'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xl flex-none mt-0.5">
                  {notification === 'no_bigint' ? '⚠️' : '🎉'}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className={`text-[11px] font-black uppercase tracking-widest leading-tight ${
                      notification === 'no_bigint'
                        ? 'text-red-700'
                        : 'text-indigo-700'
                    }`}
                  >
                    {notification === 'no_bigint'
                      ? 'Browser Not Supported'
                      : "You've been granted 200,000 points!"}
                  </span>
                  <p
                    className={`text-[10px] font-medium leading-snug ${notification === 'no_bigint' ? 'text-red-600' : 'text-indigo-500'}`}
                  >
                    {notification === 'no_bigint'
                      ? 'RPS League requires a modern browser for Vigintillion-scale math. Please update your browser or OS.'
                      : 'Start betting to rank up the leaderboard. No progress is lost, saved automatically.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (notification === 'new_visitor')
                    localStorage.setItem('rps_welcomed', '1')
                  setNotification(null)
                }}
                className={`flex-none p-1.5 rounded-lg transition-colors shrink-0 ${
                  notification === 'no_bigint'
                    ? 'text-red-400 hover:text-red-700 hover:bg-red-100'
                    : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100'
                }`}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          {notification === 'oracle' &&
            oracleSide &&
            (() => {
              const dayIndex = new Date().getUTCDate() % oracleTemplates.length
              const template = oracleTemplates[dayIndex](oracleSide)
              return (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3 border border-purple-400 bg-purple-50/90 animate-in fade-in slide-in-from-top-2 duration-400">
                  <span className="text-xl flex-none mt-0.5">👁️</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-widest leading-tight text-purple-800">
                      Daily Oracle Prophecy
                    </span>
                    <p className="text-[10px] font-medium leading-snug text-purple-700">
                      {template.prefix}{' '}
                      <span className="inline-block font-black text-white bg-purple-700 px-2 py-0.5 rounded-md shadow-[0_0_14px_rgba(168,85,247,0.9)] uppercase tracking-wider text-[10px] mx-0.5">
                        {oracleSide === 'left' ? 'LEFT' : 'RIGHT'}
                      </span>{' '}
                      {template.suffix}
                    </p>
                  </div>
                </div>
              )
            })()}

          {notification === 'idle_unlock' && (
            <div className="flex items-start justify-between gap-3 rounded-xl px-4 py-3 border border-indigo-300 bg-indigo-50/90 animate-in fade-in slide-in-from-top-2 duration-400">
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xl flex-none mt-0.5">⚡</span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-widest leading-tight text-indigo-700">
                    Auto-Bet Unlocked
                  </span>
                  <p className="text-[10px] font-medium leading-snug text-indigo-500">
                    Tick Auto-Bet Left or Right above any match to let the
                    system bet for you automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="flex-none p-1.5 rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
