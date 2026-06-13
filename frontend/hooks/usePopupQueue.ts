import { useEffect, useRef } from 'react'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import { EventTheme, AchievementNotif } from '@/types/rps'

interface PopupQueueSounds {
  playMoon: () => void
  playCards: () => void
  playElectric: () => void
  playFire: () => void
  playFanfare: (vol?: number) => void
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

  useEffect(() => {
    if (!activePopup) {
      lastProcessedId.current = null
      return
    }

    if (activePopup.id === lastProcessedId.current) return
    lastProcessedId.current = activePopup.id

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
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

      if (
        activePopup.kind === 'ascension' ||
        activePopup.kind === 'relic_drop'
      ) {
        if (activePopup.kind === 'ascension') sounds.playFanfare(0.5)
        useUIStore.setState({ readyToShow: true })
      }

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
    }, 1500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopup?.id])
}
