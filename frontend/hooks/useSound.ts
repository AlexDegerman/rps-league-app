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
  mirage_cataclysm: '/sounds/mystical.mp3',
  neon_click: '/sounds/neon_click.mp3',
  // World Boss
  hexurion_spawn: '/sounds/hexurionspawn.mp3',
  hexurion_attack: '/sounds/hexurionattack.mp3',
  hexurion_takedmg: '/sounds/hexuriontakedmg.mp3',
  hexurion_die: '/sounds/hexuriondie.mp3',
  orphion_spawn: '/sounds/orphionspawn.mp3',
  orphion_attack: '/sounds/orphionattack.mp3',
  orphion_takedmg: '/sounds/orphiontakedmg.mp3',
  orphion_die: '/sounds/orphiondie.mp3',
  fracturon_spawn: '/sounds/fracturonspawn.mp3',
  fracturon_attack: '/sounds/fracturonattack.mp3',
  fracturon_takedmg: '/sounds/fracturontakedmg.mp3',
  fracturon_die: '/sounds/fracturondie.mp3',
  apexion_spawn: '/sounds/apexionspawn.mp3',
  apexion_attack: '/sounds/apexionattack.mp3',
  apexion_takedmg: '/sounds/apexiontakedmg.mp3',
  apexion_die: '/sounds/apexiondie.mp3'
} as const

type SoundKey = keyof typeof SOUND_MAP

const DEFAULT_VOLUME = 0.5

// Volume adjustments for individual sounds.
const VOLUME_MULTIPLIERS: Partial<Record<SoundKey, number>> = {
  fracturon_takedmg: 0.15,
  fracturon_attack: 0.8,
  fracturon_die: 0.8,
  moon: 0.8,
  orphion_takedmg: 1.5,
  orphion_spawn: 0.5,
  orphion_attack: 0.5,
  apexion_attack: 0.5,
  hexurion_spawn: 0.7
}

function getVolumeForKey(key: SoundKey, masterVolume: number): number {
  const multiplier = VOLUME_MULTIPLIERS[key] ?? 1.0
  return Math.max(0, Math.min(1, masterVolume * multiplier))
}

// Single-instance audio pool.
const audioInstances: Partial<Record<SoundKey, HTMLAudioElement>> = {}

let currentVolume = DEFAULT_VOLUME
let currentSoundOn = true

if (typeof window !== 'undefined') {
  const savedVolume = localStorage.getItem('soundVolume')
  const savedSound = localStorage.getItem('soundOn')
  if (savedVolume !== null)
    currentVolume = parseFloat(savedVolume) || DEFAULT_VOLUME
  if (savedSound === 'false') currentSoundOn = false
}

function getAudio(key: SoundKey): HTMLAudioElement {
  if (!audioInstances[key]) {
    const audio = new Audio(SOUND_MAP[key])
    audio.volume = getVolumeForKey(key, currentVolume)
    audioInstances[key] = audio
  }
  return audioInstances[key]!
}

function applyVolumeToAll(volume: number) {
  currentVolume = volume
  ;(Object.keys(audioInstances) as SoundKey[]).forEach((key) => {
    const instance = audioInstances[key]
    if (instance) instance.volume = getVolumeForKey(key, volume)
  })
  // Also update the Web Audio gain node if initialised
  if (_neonClickGain) {
    _neonClickGain.gain.setTargetAtTime(
      getVolumeForKey('neon_click', volume),
      _neonCtx!.currentTime,
      0.01
    )
  }
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

// Neon click uses a decoded Web Audio buffer for polyphonic playback.
let _neonCtx: AudioContext | null = null
let _neonBuffer: AudioBuffer | null = null
let _neonClickGain: GainNode | null = null

// Tracks active clicks for the polyphony limit.
const _activeClicks: { source: AudioBufferSourceNode; gain: GainNode }[] = []
const MAX_CLICK_POLY = 6

async function _initNeonAudio(): Promise<void> {
  if (_neonCtx) return
  _neonCtx = new AudioContext()
  _neonClickGain = _neonCtx.createGain()
  _neonClickGain.gain.value = getVolumeForKey('neon_click', currentVolume)
  _neonClickGain.connect(_neonCtx.destination)
  try {
    const res = await fetch(SOUND_MAP['neon_click'])
    const arrBuf = await res.arrayBuffer()
    _neonBuffer = await _neonCtx.decodeAudioData(arrBuf)
  } catch {
    // Clicks remain disabled until the buffer is available.
  }
}

function _playNeonClick(): void {
  if (!currentSoundOn || !_neonCtx || !_neonBuffer || !_neonClickGain) return
  if (_neonCtx.state === 'suspended') _neonCtx.resume().catch(() => {})

  // Remove the oldest click when the polyphony limit is reached.
  if (_activeClicks.length >= MAX_CLICK_POLY) {
    const oldest = _activeClicks.shift()
    if (oldest) {
      oldest.gain.gain.setTargetAtTime(0, _neonCtx.currentTime, 0.015)
      setTimeout(() => {
        try {
          oldest.source.stop()
        } catch {
          /* already ended */
        }
      }, 60)
    }
  }

  const source = _neonCtx.createBufferSource()
  source.buffer = _neonBuffer

  const instanceGain = _neonCtx.createGain()
  instanceGain.gain.value = 1 // Final volume is controlled by the channel gain.
  source.connect(instanceGain)
  instanceGain.connect(_neonClickGain)

  const entry = { source, gain: instanceGain }
  _activeClicks.push(entry)

  source.onended = () => {
    const idx = _activeClicks.indexOf(entry)
    if (idx !== -1) _activeClicks.splice(idx, 1)
  }
  source.start()
}

export const useSound = () => {
  const [soundOn, setOn] = useState<boolean>(true)
  const [volume, setVolumeState] = useState<number>(DEFAULT_VOLUME)
  const soundOnRef = useRef(currentSoundOn)
  const syncedRef = useRef(false)

  useEffect(() => {
    soundOnRef.current = currentSoundOn
    Promise.resolve().then(() => {
      setOn(currentSoundOn)
      setVolumeState(currentVolume)
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

  const play = useCallback(
    (key: SoundKey, onEnd?: () => void, volumeOverride?: number) => {
      const instance = getAudio(key)
      if (!soundOnRef.current || !instance) {
        if (onEnd) onEnd()
        return
      }
      stopAllExcept([key])
      instance.currentTime = 0
      const baseVolume = getVolumeForKey(key, currentVolume)
      instance.volume =
        volumeOverride !== undefined
          ? Math.max(0, Math.min(1, volumeOverride))
          : baseVolume
      instance.onended = () => {
        instance.onended = null
        instance.volume = baseVolume
        if (onEnd) onEnd()
      }
      instance.play().catch(() => {
        if (onEnd) onEnd()
      })
    },
    []
  )

  // Play a sound without stopping other audio.
  const playLayer = useCallback((key: string, volumeOverride?: number) => {
    if (!soundOnRef.current) return
    const soundPath = SOUND_MAP[key as SoundKey]
    if (!soundPath) return
    const audio = new Audio(soundPath)
    const baseVol = getVolumeForKey(key as SoundKey, currentVolume)
    audio.volume =
      volumeOverride !== undefined
        ? Math.max(0, Math.min(1, volumeOverride))
        : baseVol
    audio.play().catch(() => {})
  }, [])

  const playChain = useCallback(
    (keys: string[], volumeOverride?: number) => {
      if (!soundOnRef.current) return
      const [first, ...rest] = keys as SoundKey[]
      if (!first) return
      if (rest.length === 0) {
        play(first, undefined, volumeOverride)
        return
      }
      stopAllExcept(keys as SoundKey[])
      const playNext = (remaining: SoundKey[]) => {
        if (!remaining.length) return
        const [cur, ...tail] = remaining
        const instance = getAudio(cur)
        if (!instance) {
          playNext(tail)
          return
        }
        instance.currentTime = 0
        const baseVolume = getVolumeForKey(cur, currentVolume)
        instance.volume =
          volumeOverride !== undefined ? volumeOverride : baseVolume
        instance.onended = () => {
          instance.onended = null
          instance.volume = baseVolume
          playNext(tail)
        }
        instance.play().catch(() => playNext(tail))
      }
      const firstInstance = getAudio(first)
      if (!firstInstance) {
        playNext(rest)
        return
      }
      firstInstance.currentTime = 0
      const firstBaseVolume = getVolumeForKey(first, currentVolume)
      firstInstance.volume =
        volumeOverride !== undefined ? volumeOverride : firstBaseVolume
      firstInstance.onended = () => {
        firstInstance.onended = null
        firstInstance.volume = firstBaseVolume
        playNext(rest)
      }
      firstInstance.play().catch(() => playNext(rest))
    },
    [play]
  )

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

  const playJackpot = useCallback(() => {
    if (!soundOnRef.current) return
    playChain(['slam', 'cascade', 'shimmer'])
  }, [playChain])

  // Pre-decodes the click buffer before gameplay.
  const initNeonAudio = useCallback(() => {
    _initNeonAudio().catch(() => {})
  }, [])

  const playNeonClick = useCallback(() => {
    if (!soundOnRef.current) return
    _playNeonClick()
  }, [])

  // Maps the payout multiplier to a relic tier sound.
  const playNeonReward = useCallback(
    (multiplier: number) => {
      if (!soundOnRef.current) return
      const key: SoundKey =
        multiplier >= 10
          ? 'relic_mythical'
          : multiplier >= 8
            ? 'relic_legendary'
            : multiplier >= 6
              ? 'relic_epic'
              : multiplier >= 4
                ? 'relic_rare'
                : 'relic_common'
      playLayer(key)
    },
    [playLayer]
  )

  // Plays the reveal sound without interrupting other audio.
  const playNeonShimmer = useCallback(() => {
    if (!soundOnRef.current) return
    playLayer('shimmer')
  }, [playLayer])

  // Plays the completion sound based on the payout tier.
  const playNeonComplete = useCallback(
    (isMaxPayout: boolean) => {
      if (!soundOnRef.current) return
      if (isMaxPayout) {
        // Play the celebration fanfare for the maximum payout
        play('fanfare')
      } else {
        play('win')
      }
    },
    [play]
  )

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
    playRelicDrop: useCallback(
      (rarity: RelicRarity) => {
        play(`relic_${rarity.toLowerCase()}` as SoundKey)
      },
      [play]
    ),
    playBossSpawn: useCallback(
      (bossType: string) => {
        play(`${bossType.toLowerCase()}_spawn` as SoundKey)
      },
      [play]
    ),
    playBossAttack: useCallback(
      (bossType: string) => {
        play(`${bossType.toLowerCase()}_attack` as SoundKey)
      },
      [play]
    ),
    playBossTakeDmg: useCallback(
      (bossType: string) => {
        play(`${bossType.toLowerCase()}_takedmg` as SoundKey)
      },
      [play]
    ),
    playBossDie: useCallback(
      (bossType: string) => {
        play(`${bossType.toLowerCase()}_die` as SoundKey)
      },
      [play]
    ),
    initNeonAudio,
    playNeonClick,
    playNeonReward,
    playNeonShimmer,
    playNeonComplete,
    playLayer,
    playChain
  }
}
