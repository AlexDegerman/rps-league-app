import { create } from 'zustand'

export type BGMContext =
  | 'base'
  | 'flash-event'
  | 'global-event'
  | 'festival'
  | 'world-boss'
  | 'neon-paradise'

const BASE_TRACKS = [
  '/music/basebgm-01.mp3',
  '/music/basebgm-02.mp3',
  '/music/basebgm-03.mp3'
]

const BGM_TRACKS: Record<Exclude<BGMContext, 'base'>, string> = {
  'flash-event': '/music/flasheventbgm.mp3',
  'global-event': '/music/globaleventbgm.mp3',
  'festival': '/music/festivalbgm.mp3',
  'world-boss': '/music/worldbossbgm.mp3',
  'neon-paradise': '/music/neonparadisebgm.mp3'
}

const BGM_MULTIPLIERS: Record<string, number> = {
  // Base tracks, keyed by filename so each gets its own value
  '/music/basebgm-01.mp3': 1,
  '/music/basebgm-02.mp3': 1,
  '/music/basebgm-03.mp3': 1,
  // Event tracks, keyed by BGMContext
  'flash-event': 1,
  'global-event': 1,
  'festival': 1,
  'world-boss': 1,
  'neon-paradise': 1,
}

const CROSSFADE_MS = 1000
const FADE_STEP_MS = 50
const DEFAULT_VOL = 0.3

function pickBaseTrack(lastPlayed: string | null): string {
  const pool = lastPlayed
    ? BASE_TRACKS.filter((t) => t !== lastPlayed)
    : BASE_TRACKS
  return pool[Math.floor(Math.random() * pool.length)]
}

// Base tracks use the src path as the key; other tracks use the BGMContext.
function getMultiplierKey(context: BGMContext, src: string): string {
  return context === 'base' ? src : context
}

function getTargetVol(
  context: BGMContext,
  src: string,
  masterVol: number
): number {
  const key = getMultiplierKey(context, src)
  const mult = BGM_MULTIPLIERS[key] ?? 1.0
  return Math.max(0, Math.min(1, masterVol * mult))
}

let _current: HTMLAudioElement | null = null
let _currentSrc: string = ''
let _next: HTMLAudioElement | null = null
let _fadeInterval: ReturnType<typeof setInterval> | null = null
let _lastBaseTrack: string | null = null
let _started = false

function clearFade() {
  if (_fadeInterval !== null) {
    clearInterval(_fadeInterval)
    _fadeInterval = null
  }
}

function handleBaseTrackEnded() {
  const { musicOn, musicVolume, activeContext } = useMusicStore.getState()
  if (!musicOn || activeContext !== 'base') return
  const nextSrc = getSrc('base')
  _next = makeAudio(nextSrc, 'base')
  crossfadeTo(_next, nextSrc, 'base', musicVolume)
}

function makeAudio(src: string, context: BGMContext): HTMLAudioElement {
  const audio = new Audio(src)
  audio.loop = context !== 'base'
  audio.volume = 0
  if (context === 'base') {
    audio.addEventListener('ended', handleBaseTrackEnded)
  }
  return audio
}

function getSrc(context: BGMContext): string {
  if (context === 'base') {
    const track = pickBaseTrack(_lastBaseTrack)
    _lastBaseTrack = track
    return track
  }
  return BGM_TRACKS[context]
}

function crossfadeTo(
  incoming: HTMLAudioElement,
  incomingSrc: string,
  context: BGMContext,
  masterVol: number
) {
  clearFade()
  const outgoing = _current
  const targetVol = getTargetVol(context, incomingSrc, masterVol)
  const steps = CROSSFADE_MS / FADE_STEP_MS
  const step = targetVol / steps

  let incomingVol = 0
  let outgoingVol = outgoing ? outgoing.volume : 0
  const outgoingStep = outgoingVol / steps

  incoming.volume = 0
  incoming.play().catch(() => {})

  _fadeInterval = setInterval(() => {
    incomingVol = Math.min(incomingVol + step, targetVol)
    incoming.volume = incomingVol

    if (outgoing) {
      outgoingVol = Math.max(outgoingVol - outgoingStep, 0)
      outgoing.volume = outgoingVol
      if (outgoingVol <= 0) {
        outgoing.pause()
        outgoing.src = ''
      }
    }

    if (incomingVol >= targetVol && (!outgoing || outgoingVol <= 0)) {
      clearFade()
      _current = incoming
      _currentSrc = incomingSrc
      _next = null
    }
  }, FADE_STEP_MS)
}

function fadeInCurrent(targetVol: number) {
  if (!_current) return
  const step = targetVol / (CROSSFADE_MS / FADE_STEP_MS)
  clearFade()
  let currentVol = 0
  _fadeInterval = setInterval(() => {
    if (!_current) {
      clearFade()
      return
    }
    currentVol = Math.min(currentVol + step, targetVol)
    _current.volume = currentVol
    if (currentVol >= targetVol) clearFade()
  }, FADE_STEP_MS)
}

interface MusicState {
  musicOn: boolean
  musicVolume: number
  activeContext: BGMContext

  toggleMusic: () => void
  setMusicVolume: (v: number) => void
  switchContext: (context: BGMContext) => void
  startPlayback: () => void
}

export const useMusicStore = create<MusicState>((set, get) => {
  const savedOn =
    typeof window !== 'undefined' ? localStorage.getItem('musicOn') : null
  const savedVol =
    typeof window !== 'undefined' ? localStorage.getItem('musicVolume') : null
  const initOn = savedOn !== 'false'
  const initVol =
    savedVol !== null ? parseFloat(savedVol) || DEFAULT_VOL : DEFAULT_VOL

  return {
    musicOn: initOn,
    musicVolume: initVol,
    activeContext: 'base',

    startPlayback: () => {
      if (_started) return
      const { musicOn, musicVolume, activeContext } = get()
      if (!musicOn) return
      _started = true
      const src = getSrc(activeContext)
      _current = makeAudio(src, activeContext)
      _currentSrc = src
      _current
        .play()
        .then(() =>
          fadeInCurrent(getTargetVol(activeContext, src, musicVolume))
        )
        .catch(() => {
          _started = false
        })
    },

    toggleMusic: () => {
      const { musicOn, musicVolume, activeContext } = get()
      const next = !musicOn
      set({ musicOn: next })
      localStorage.setItem('musicOn', String(next))

      clearFade()

      if (next) {
        const vol = musicVolume > 0 ? musicVolume : DEFAULT_VOL
        if (!_current) {
          _started = true
          const src = getSrc(activeContext)
          _current = makeAudio(src, activeContext)
          _currentSrc = src
          _current.volume = getTargetVol(activeContext, src, vol)
          _current.play().catch(() => {
            _started = false
          })
        } else {
          _current.volume = getTargetVol(activeContext, _currentSrc, vol)
          if (_current.paused) {
            _current.play().catch(() => {})
          }
        }
      } else {
        if (_current) {
          _current.pause()
        }
      }
    },

    setMusicVolume: (v: number) => {
      const clamped = Math.max(0, Math.min(1, v))
      const { musicOn, activeContext } = get()
      set({ musicVolume: clamped })
      localStorage.setItem('musicVolume', String(clamped))

      if (_current && !_current.paused) {
        _current.volume = getTargetVol(activeContext, _currentSrc, clamped)
      }

      if (clamped === 0 && musicOn) {
        set({ musicOn: false })
        localStorage.setItem('musicOn', 'false')
      } else if (clamped > 0 && !musicOn) {
        set({ musicOn: true })
        localStorage.setItem('musicOn', 'true')
        if (_started && _current?.paused) _current.play().catch(() => {})
      }
    },

    switchContext: (context: BGMContext) => {
      const { activeContext, musicOn, musicVolume } = get()
      if (context === activeContext && _current && !_current.paused) return
      set({ activeContext: context })
      if (!_started || !musicOn) return
      const src = getSrc(context)
      _next = makeAudio(src, context)
      crossfadeTo(_next, src, context, musicVolume)
    }
  }
})
