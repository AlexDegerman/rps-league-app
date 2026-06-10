import { RelicRarity } from '@/lib/relics'
import { useRef, useState, useEffect } from 'react'

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

// Module-level singletons - avoids re-creating Audio nodes on every render
// and prevents overlapping playback from stacking instances
const audioInstances: Partial<Record<SoundKey, HTMLAudioElement>> = {}

if (typeof window !== 'undefined') {
  ;(Object.keys(SOUND_MAP) as SoundKey[]).forEach((key) => {
    const audio = new Audio(SOUND_MAP[key])
    audio.volume = 0.5
    audioInstances[key] = audio
  })
}

export const useSound = () => {
  const [soundOn, setOn] = useState<boolean>(true)

  useEffect(() => {
    const saved = localStorage.getItem('soundOn')
    if (saved === 'false') {
      setTimeout(() => setOn(false), 0)
    }
  }, [])

  const soundOnRef = useRef(soundOn)

  useEffect(() => {
    soundOnRef.current = soundOn
    localStorage.setItem('soundOn', soundOn.toString())
  }, [soundOn])

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

  const play = (key: SoundKey, onEnd?: () => void) => {
    const instance = audioInstances[key]
    if (!soundOnRef.current || !instance) {
      if (onEnd) onEnd()
      return
    }

    stopAll()

    instance.currentTime = 0

    if (onEnd) {
      instance.onended = () => {
        instance.onended = null
        onEnd()
      }
    } else {
      instance.onended = null
    }

    instance.play().catch(() => {
      if (onEnd) onEnd()
    })
  }

  const toggleSound = () => {
    setOn((prev) => !prev)
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
    toggleSound,
    stopAll,
    playWin: () => play('win'),
    playLoss: () => play('loss'),
    playCards: () => play('cards'),
    playElectric: () => play('electric'),
    playFire: () => play('fire'),
    playMoon: () => play('moon'),
    playFanfare: () => play('fanfare'),
    playJackpot,
    getDuration: (key: SoundKey) => audioInstances[key]?.duration || 0,
    playRelicDrop: (rarity: RelicRarity) => {
      const key = `relic_${rarity.toLowerCase()}` as SoundKey
      play(key)
    }
  }
}