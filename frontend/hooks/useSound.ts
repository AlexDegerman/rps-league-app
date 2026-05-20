import { useRef, useState, useEffect } from 'react'

const SOUND_MAP = {
  win: '/sounds/win.wav',
  loss: '/sounds/loss.wav',
  cards: '/sounds/cards.wav',
  electric: '/sounds/electric.wav',
  fire: '/sounds/fire.wav',
  moon: '/sounds/moon.wav',
  fanfare: '/sounds/ascension-fanfare.mp3'
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
  // Use lazy initializer to read from localStorage before the first render
  const [soundOn, setOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundOn')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  // Initialize Ref with the initial state value
  const soundOnRef = useRef(soundOn)

  // Update localStorage and Ref whenever state changes
  useEffect(() => {
    soundOnRef.current = soundOn
    localStorage.setItem('soundOn', soundOn.toString())
  }, [soundOn])

  const play = (key: SoundKey) => {
    const instance = audioInstances[key]
    if (!soundOnRef.current || !instance) return

    // Reset currentTime so rapid plays don't queue - always plays from start
    instance.currentTime = 0
    instance.play().catch(() => {
      // Browsers block autoplay until the user has interacted with the page
    })
  }

  const toggleSound = () => {
    setOn((prev) => !prev)
  }

  return {
    soundOn,
    toggleSound,
    playWin: () => play('win'),
    playLoss: () => play('loss'),
    playCards: () => play('cards'),
    playElectric: () => play('electric'),
    playFire: () => play('fire'),
    playMoon: () => play('moon'),
    playFanfare: () => play('fanfare')
  }
}
