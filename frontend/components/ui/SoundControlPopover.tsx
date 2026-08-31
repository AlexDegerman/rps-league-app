'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { useMusicStore } from '@/app/stores/musicStore'
import { useEffect, useRef } from 'react'

const SpeakerOn = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d="M9 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2l4 4V0l-4 4H9z"
      fill="#6B7280"
    />
    <path
      d="M14 6c1.5 1.5 1.5 6.5 0 8"
      stroke="#3B82F6"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M15.5 4.5c2.5 2.5 2.5 8.5 0 11"
      stroke="#3B82F6"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

const SpeakerOff = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d="M9 4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2l4 4V0l-4 4H9z"
      fill="#9CA3AF"
    />
    <line
      x1="3"
      y1="3"
      x2="17"
      y2="17"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const MusicNote = ({ muted }: { muted: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path
      d="M8 15V5l9-2v10"
      stroke={muted ? '#9CA3AF' : '#10B981'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="15" r="2.2" fill={muted ? '#9CA3AF' : '#10B981'} />
    <circle cx="15" cy="13" r="2.2" fill={muted ? '#9CA3AF' : '#10B981'} />
    {muted && (
      <line
        x1="3"
        y1="3"
        x2="17"
        y2="17"
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinecap="round"
      />
    )}
  </svg>
)

interface ToggleProps {
  on: boolean
  onClick: () => void
  activeColor: string
  label: string
}

function Toggle({ on, onClick, activeColor, label }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${on ? activeColor : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

interface SliderProps {
  value: number
  onChange: (v: number) => void
  active: boolean
  activeTrackColor: string
  activeThumbBorder: string
}

function Slider({
  value,
  onChange,
  active,
  activeTrackColor,
  activeThumbBorder
}: SliderProps) {
  const pct = Math.round(value * 100)
  const trackColor = active ? activeTrackColor : '#d1d5db'
  const thumbBorder = active ? activeThumbBorder : '#d1d5db'
  return (
    <div className="relative h-3 flex items-center">
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-colors duration-200"
          style={{ width: `${pct}%`, background: trackColor }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-x-0 h-3 w-full opacity-0 cursor-pointer"
      />
      <div
        className="absolute w-3.5 h-3.5 rounded-full bg-white shadow pointer-events-none transition-colors duration-200"
        style={{
          left: `calc(${pct}% - 7px)`,
          border: `2px solid ${thumbBorder}`
        }}
      />
    </div>
  )
}

interface SoundControlPopoverProps {
  soundOn: boolean
  volume: number
  onVolumeChange: (v: number) => void
  onToggleSound: () => void
  oracleVolume: number
  onOracleVolumeChange: (v: number) => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
}

export default function SoundControlPopover({
  soundOn,
  volume,
  oracleVolume,
  onVolumeChange,
  onOracleVolumeChange,
  onToggleSound,
  anchorRef,
  onClose
}: SoundControlPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const oracleTTSEnabled = useUIStore((s) => s.oracleTTSEnabled)
  const toggleOracleTTS = useUIStore((s) => s.toggleOracleTTS)
  const setOracleVolume = useUIStore((s) => s.setOracleVolume)

  const musicOn = useMusicStore((s) => s.musicOn)
  const musicVolume = useMusicStore((s) => s.musicVolume)
  const toggleMusic = useMusicStore((s) => s.toggleMusic)
  const setMusicVolume = useMusicStore((s) => s.setMusicVolume)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      )
        onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorRef, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOracleVolumeChange = (v: number) => {
    onOracleVolumeChange(v)
    setOracleVolume(v)
    if (v > 0 && !oracleTTSEnabled) toggleOracleTTS()
    if (v === 0 && oracleTTSEnabled) toggleOracleTTS()
  }

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45" />

      {/* Sound FX */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {soundOn ? <SpeakerOn /> : <SpeakerOff />}
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
            Sound FX
          </span>
        </div>
        <Toggle
          on={soundOn}
          onClick={onToggleSound}
          activeColor="bg-blue-500"
          label="Toggle sound effects"
        />
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
            Volume
          </span>
          <span className="text-[9px] font-black text-gray-500 tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <Slider
          value={volume}
          onChange={onVolumeChange}
          active={soundOn}
          activeTrackColor="#3B82F6"
          activeThumbBorder="#3B82F6"
        />
      </div>

      <div className="border-t border-gray-100 my-2.5" />

      {/* Oracle Voice */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">👁️</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
            Arkalon Voice
          </span>
        </div>
        <Toggle
          on={oracleTTSEnabled}
          onClick={toggleOracleTTS}
          activeColor="bg-purple-500"
          label="Toggle Arkalon voice"
        />
      </div>
      <div className="mb-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
            Volume
          </span>
          <span className="text-[9px] font-black text-gray-500 tabular-nums">
            {Math.round(oracleVolume * 100)}%
          </span>
        </div>
        <Slider
          value={oracleVolume}
          onChange={handleOracleVolumeChange}
          active={oracleTTSEnabled}
          activeTrackColor="#a855f7"
          activeThumbBorder="#a855f7"
        />
      </div>

      <div className="border-t border-gray-100 my-2.5" />

      {/* Music */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MusicNote muted={!musicOn} />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
            Music
          </span>
        </div>
        <Toggle
          on={musicOn}
          onClick={toggleMusic}
          activeColor="bg-emerald-500"
          label="Toggle background music"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
            Volume
          </span>
          <span className="text-[9px] font-black text-gray-500 tabular-nums">
            {Math.round(musicVolume * 100)}%
          </span>
        </div>
        <Slider
          value={musicVolume}
          onChange={setMusicVolume}
          active={musicOn}
          activeTrackColor="#10B981"
          activeThumbBorder="#10B981"
        />
      </div>
    </div>
  )
}
