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
  relic_mythical: '/sounds/relic_mythical.mp3',
  tidal_surge: '/sounds/crashing_waves.mp3',
  solar_flare_charge: '/sounds/solar_flare_charge.mp3',
  solar_flare_explosion: '/sounds/solar_flare_explosion.mp3',
  cyclone_blitz: '/sounds/wind_raging.mp3',
  mirage_cataclysm: '/sounds/mystical.mp3'
} as const

type SoundKey = keyof typeof SOUND_MAP

const DEFAULT_VOLUME = 0.5

const audioInstances: Partial<Record<SoundKey, HTMLAudioElement>> = {}

let currentVolume = DEFAULT_VOLUME
let currentSoundOn = true

if (typeof window !== 'undefined') {
  const savedVolume = localStorage.getItem('soundVolume')
  const savedSound = localStorage.getItem('soundOn')
  if (savedVolume !== null)
    currentVolume = parseFloat(savedVolume) || DEFAULT_VOLUME
  if (savedSound === 'false') currentSoundOn = false
  ;(Object.keys(SOUND_MAP) as SoundKey[]).forEach((key) => {
    const audio = new Audio(SOUND_MAP[key])
    audio.volume = currentVolume
    audioInstances[key] = audio
  })
}

function applyVolumeToAll(volume: number) {
  currentVolume = volume
  ;(Object.keys(audioInstances) as SoundKey[]).forEach((key) => {
    const instance = audioInstances[key]
    if (instance) instance.volume = volume
  })
}

function stopAllExcept(keep: SoundKey[]) {
  ;(Object.keys(audioInstances) as SoundKey[]).forEach((key) => {
    if (keep.includes(key as SoundKey)) return
    const instance = audioInstances[key as SoundKey]
    if (instance) {
      instance.pause()
      instance.currentTime = 0
      instance.onended = null
    }
  })
}

export const useSound = () => {
  const [soundOn, setOn] = useState<boolean>(true)
  const [volume, setVolumeState] = useState<number>(DEFAULT_VOLUME)
  const soundOnRef = useRef(currentSoundOn)
  const syncedRef = useRef(false)

  useEffect(() => {
    soundOnRef.current = currentSoundOn
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(currentSoundOn)
    setVolumeState(currentVolume)
    Promise.resolve().then(() => {
      syncedRef.current = true
    })
  }, [])

  useEffect(() => {
    if (!syncedRef.current) return
    soundOnRef.current = soundOn
    currentSoundOn = soundOn
    localStorage.setItem('soundOn', soundOn.toString())
  }, [soundOn])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    applyVolumeToAll(clamped)
    localStorage.setItem('soundVolume', clamped.toString())
    if (clamped > 0) {
      setOn(true)
      currentSoundOn = true
      soundOnRef.current = true
    }
    if (clamped === 0) {
      setOn(false)
      currentSoundOn = false
      soundOnRef.current = false
    }
  }, [])

  const stopAll = () => stopAllExcept([])

  const play = (key: SoundKey, onEnd?: () => void, volumeOverride?: number) => {
    const instance = audioInstances[key]
    if (!soundOnRef.current || !instance) {
      if (onEnd) onEnd()
      return
    }
    stopAllExcept([key])
    instance.currentTime = 0
    instance.volume =
      volumeOverride !== undefined
        ? Math.max(0, Math.min(1, volumeOverride))
        : currentVolume
    instance.onended = () => {
      instance.onended = null
      instance.volume = currentVolume
      if (onEnd) onEnd()
    }
    instance.play().catch(() => {
      if (onEnd) onEnd()
    })
  }

  const playChain = (keys: SoundKey[], volumeOverride?: number) => {
    if (!soundOnRef.current) return
    const [first, ...rest] = keys
    if (!first) return
    if (rest.length === 0) {
      play(first, undefined, volumeOverride)
      return
    }
    stopAllExcept(keys)
    const playNext = (remaining: SoundKey[]) => {
      if (!remaining.length) return
      const [cur, ...tail] = remaining
      const instance = audioInstances[cur]
      if (!instance) {
        playNext(tail)
        return
      }
      instance.currentTime = 0
      instance.volume =
        volumeOverride !== undefined ? volumeOverride : currentVolume
      instance.onended = () => {
        instance.onended = null
        instance.volume = currentVolume
        playNext(tail)
      }
      instance.play().catch(() => playNext(tail))
    }
    const firstInstance = audioInstances[first]
    if (!firstInstance) {
      playNext(rest)
      return
    }
    firstInstance.currentTime = 0
    firstInstance.volume =
      volumeOverride !== undefined ? volumeOverride : currentVolume
    firstInstance.onended = () => {
      firstInstance.onended = null
      firstInstance.volume = currentVolume
      playNext(rest)
    }
    firstInstance.play().catch(() => playNext(rest))
  }

  const toggleSound = () => {
    setOn((prev) => {
      const next = !prev
      currentSoundOn = next
      soundOnRef.current = next
      if (next) {
        const v = currentVolume > 0 ? currentVolume : DEFAULT_VOLUME
        applyVolumeToAll(v)
        setVolumeState(v)
      }
      return next
    })
  }

  const playJackpot = () => {
    if (!soundOnRef.current) return
    playChain(['slam', 'cascade', 'shimmer'])
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
    playTidalSurge: () => play('tidal_surge'),
    playSolarFlare: () =>
      playChain(['solar_flare_charge', 'solar_flare_explosion']),
    playCycloneBlitz: () => play('cyclone_blitz'),
    playMirageCataclysm: () => play('mirage_cataclysm'),
    getDuration: (key: SoundKey) => audioInstances[key]?.duration || 0,
    playRelicDrop: useCallback((rarity: RelicRarity) => {
      const key = `relic_${rarity.toLowerCase()}` as SoundKey
      play(key)
    }, [])
  }
}
