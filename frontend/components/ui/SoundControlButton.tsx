'use client'

import { useRef, useState } from 'react'
import SoundIcon from '@/components/icons/SoundIcon'
import SoundControlPopover from '@/components/ui/SoundControlPopover'
import { useSound } from '@/hooks/useSound'
import { useUIStore } from '@/app/stores/uiStore'

interface SoundControlButtonProps {
  className?: string
}

export default function SoundControlButton({
  className
}: SoundControlButtonProps) {
  const { soundOn, toggleSound, volume, setVolume } = useSound()
  const oracleVolume = useUIStore((s) => s.oracleVolume)
  const setOracleVolume = useUIStore((s) => s.setOracleVolume)

  const [showPopover, setShowPopover] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => setShowPopover((p) => !p)}
        className={
          className ??
          'shrink-0 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition shadow-sm bg-white'
        }
        aria-label="Sound settings"
      >
        <SoundIcon muted={!soundOn} />
      </button>

      {showPopover && (
        <SoundControlPopover
          soundOn={soundOn}
          volume={volume}
          oracleVolume={oracleVolume}
          onVolumeChange={setVolume}
          onOracleVolumeChange={setOracleVolume}
          onToggleSound={toggleSound}
          anchorRef={btnRef}
          onClose={() => setShowPopover(false)}
        />
      )}
    </div>
  )
}
