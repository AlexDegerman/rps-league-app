import { useEffect, useRef } from 'react'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import type { EventTheme, AchievementNotif, GlobalEventType } from '@/types/rps'

interface PopupQueueSounds {
  playMoon: () => void
  playCards: () => void
  playElectric: () => void
  playFire: () => void
  playFanfare: (vol?: number) => void
  playTidalSurge: () => void
  playSolarFlare: () => void
  playCycloneBlitz: () => void
  playMirageCataclysm: () => void
}

export function usePopupQueue(sounds: PopupQueueSounds) {
  const { activePopup } = useUIStore()
  const {
    setActiveFlashEvent,
    setLiveTheme,
    setFlashEventJustTriggered,
    pushAchievement
  } = useGameStore()

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastProcessedId = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!activePopup) {
      lastProcessedId.current = null
      return
    }
    if (activePopup.id === lastProcessedId.current) return
    lastProcessedId.current = activePopup.id

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return

      // Flash event
      if (activePopup.kind === 'flash_event') {
        const type = activePopup.payload as EventTheme
        if (type) {
          setFlashEventJustTriggered(type)
          setActiveFlashEvent(type)
          setLiveTheme(type)
          if (type === 'LUNAR') sounds.playMoon()
          else if (type === 'CARDS') sounds.playCards()
          else if (type === 'ELECTRIC') sounds.playElectric()
          else if (type === 'HELLFIRE') sounds.playFire()
        }
        useUIStore.setState({ readyToShow: true })
      }

      // Global event activation
      if (activePopup.kind === 'global_event') {
        const { type, endsAt } = activePopup.payload as {
          type: GlobalEventType
          endsAt: number
        }
        if (Date.now() > endsAt) {
          useUIStore.getState().dequeuePopup()
          return
        }
        useGameStore.getState().setGlobalEventActive(type, endsAt)
        useUIStore.getState().setShowGlobalActivationOverlay(true)

        if (type === 'TIDAL_SURGE') sounds.playTidalSurge()
        else if (type === 'SOLAR_FLARE') sounds.playSolarFlare()
        else if (type === 'CYCLONE_BLITZ') sounds.playCycloneBlitz()
        else if (type === 'MIRAGE_CATACLYSM') sounds.playMirageCataclysm()

        useUIStore.setState({ readyToShow: true })
      }

      // Ascension / relic drop
      if (
        activePopup.kind === 'ascension' ||
        activePopup.kind === 'relic_drop'
      ) {
        if (activePopup.kind === 'ascension') sounds.playFanfare(0.5)
        useUIStore.setState({ readyToShow: true })
      }

      // Achievement - batch all queued achievements at once
      if (activePopup.kind === 'achievement') {
        const freshQueue = useUIStore.getState().popupQueue
        const allAch = [
          activePopup,
          ...freshQueue.filter((p) => p.kind === 'achievement')
        ]
        allAch.forEach((item) =>
          pushAchievement(item.payload as AchievementNotif)
        )
        const nonAchievements = freshQueue.filter(
          (p) => p.kind !== 'achievement'
        )
        useUIStore.setState({
          activePopup: nonAchievements[0] ?? null,
          popupQueue: nonAchievements.slice(1),
          readyToShow: false
        })
      }
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopup?.id])
}
