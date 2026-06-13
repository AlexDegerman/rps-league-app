import { RelicRarity } from '@/lib/relics'
import { useRef, useState, useEffect, useCallback } from 'react'

const SOUND_MAP = {
  win: '/sounds/win.wav',
  loss: '/sounds/loss.wav',
  cards: '/sounds/cards.wav',
  electric: '/sounds/electric.wav',
  fire: '/sounds/fire.wav',
  moon: '/sounds/moon.wav',
  fanfare: '/sounds/ascension-fanfare.mp3',
  slam: '/sounds/slam.mp3',
  cascade: '/sounds/cascade.mp3',
  shimmer: '/sounds/shimmer.mp3',
  relic_common: '/sounds/relic_common.mp3',
  relic_rare: '/sounds/relic_rare.mp3',
  relic_epic: '/sounds/relic_epic.mp3',
  relic_legendary: '/sounds/relic_legendary.mp3',
  relic_mythical: '/sounds/relic_mythical.mp3'
} as const

type SoundKey = keyof typeof SOUND_MAP

const DEFAULT_VOLUME = 0.5

// Module-level singletons - avoids re-creating Audio nodes on every render
// and prevents overlapping playback from stacking instances
const audioInstances: Partial<Record<SoundKey, HTMLAudioElement>> = {}

if (typeof window !== 'undefined') {
  ;(Object.keys(SOUND_MAP) as SoundKey[]).forEach((key) => {
    const audio = new Audio(SOUND_MAP[key])
    audio.volume = DEFAULT_VOLUME
    audioInstances[key] = audio
  })
}

function applyVolumeToAll(volume: number) {
  ;(Object.keys(audioInstances) as SoundKey[]).forEach((key) => {
    const instance = audioInstances[key]
    if (instance) instance.volume = volume
  })
}

export const useSound = () => {
  const [soundOn, setOn] = useState<boolean>(true)
  const [volume, setVolumeState] = useState<number>(DEFAULT_VOLUME)

  useEffect(() => {
    const savedSound = localStorage.getItem('soundOn')
    const savedVolume = localStorage.getItem('soundVolume')

    if (savedSound === 'false') {
      setTimeout(() => setOn(false), 0)
    }
    if (savedVolume !== null) {
      const parsed = parseFloat(savedVolume)
      if (!isNaN(parsed)) {
        setTimeout(() => {
          setVolumeState(parsed)
          applyVolumeToAll(parsed)
        }, 0)
      }
    }
  }, [])

  const soundOnRef = useRef(soundOn)
  useEffect(() => {
    soundOnRef.current = soundOn
    localStorage.setItem('soundOn', soundOn.toString())
  }, [soundOn])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    applyVolumeToAll(clamped)
    localStorage.setItem('soundVolume', clamped.toString())
    // Un-mute automatically when slider is moved above 0
    if (clamped > 0) setOn(true)
    if (clamped === 0) setOn(false)
  }, [])

  const stopAll = () => {
    ;(Object.keys(audioInstances) as SoundKey[]).forEach((key) => {
      const instance = audioInstances[key]
      if (instance) {
        instance.pause()
        instance.currentTime = 0
        instance.onended = null
      }
    })
  }

  const play = (key: SoundKey, onEnd?: () => void, volumeOverride?: number) => {
    const instance = audioInstances[key]
    if (!soundOnRef.current || !instance) {
      if (onEnd) onEnd()
      return
    }
    stopAll()
    instance.currentTime = 0
    if (volumeOverride !== undefined) {
      instance.volume = Math.max(0, Math.min(1, volumeOverride))
    }
    if (onEnd) {
      instance.onended = () => {
        instance.onended = null
        const saved = localStorage.getItem('soundVolume')
        instance.volume = saved ? parseFloat(saved) : DEFAULT_VOLUME
        onEnd()
      }
    } else {
      instance.onended = () => {
        const saved = localStorage.getItem('soundVolume')
        if (instance)
          instance.volume = saved ? parseFloat(saved) : DEFAULT_VOLUME
      }
    }
    instance.play().catch(() => {
      if (onEnd) onEnd()
    })
  }

  const toggleSound = () => {
    setOn((prev) => {
      const next = !prev
      // When unmuting from toggle, restore last non-zero volume
      if (next) {
        const saved = localStorage.getItem('soundVolume')
        const restored = saved ? parseFloat(saved) : DEFAULT_VOLUME
        const v = restored > 0 ? restored : DEFAULT_VOLUME
        applyVolumeToAll(v)
        setVolumeState(v)
      }
      return next
    })
  }

  const playJackpot = () => {
    if (!soundOnRef.current) return
    play('slam')
    setTimeout(() => {
      play('cascade', () => {
        play('shimmer')
      })
    }, 500)
  }

  return {
    soundOn,
    volume,
    setVolume,
    toggleSound,
    stopAll,
    playWin: () => play('win'),
    playLoss: () => play('loss'),
    playCards: () => play('cards'),
    playElectric: () => play('electric'),
    playFire: () => play('fire'),
    playMoon: () => play('moon'),
    playFanfare: (vol?: number) => play('fanfare', undefined, vol),
    playJackpot,
    getDuration: (key: SoundKey) => audioInstances[key]?.duration || 0,
    playRelicDrop: useCallback((rarity: RelicRarity) => {
      const key = `relic_${rarity.toLowerCase()}` as SoundKey
      play(key)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  }
}
