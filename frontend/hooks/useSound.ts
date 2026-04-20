import { useRef, useState, useEffect } from 'react'

// Module-level singletons — avoids re-creating Audio nodes on every render
// and prevents overlapping playback from stacking instances
const winAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/win.wav') : null
const lossAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/loss.wav') : null
const cardsAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/cards.wav') : null
const electricAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/electric.wav') : null
const fireAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/fire.wav') : null
const moonAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/moon.wav') : null

if (winAudioInstance) winAudioInstance.volume = 0.1
if (lossAudioInstance) lossAudioInstance.volume = 0.1
if (cardsAudioInstance) cardsAudioInstance.volume = 0.1
if (electricAudioInstance) electricAudioInstance.volume = 0.1
if (fireAudioInstance) fireAudioInstance.volume = 0.1
if (moonAudioInstance) moonAudioInstance.volume = 0.1

export const useSound = () => {
  const [soundOn, setOn] = useState(true)
  // Ref mirrors state so playWin/playLoss closures always see the current value
  // without needing to be recreated when soundOn changes
  const soundOnRef = useRef(true)

  useEffect(() => {
    const saved = localStorage.getItem('soundOn')
    if (saved !== null) {
      const isEnabled = saved === 'true'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOn(isEnabled)
      soundOnRef.current = isEnabled
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('soundOn', soundOn.toString())
  }, [soundOn])

  const playWin = () => {
    if (!soundOnRef.current || !winAudioInstance) return
    // Reset currentTime so rapid wins don't queue — always plays from start
    winAudioInstance.currentTime = 0
    winAudioInstance.play().catch(() => {
      // Browsers block autoplay until the user has interacted with the page
    })
  }

  const playLoss = () => {
    if (!soundOnRef.current || !lossAudioInstance) return
    lossAudioInstance.currentTime = 0
    lossAudioInstance.play().catch(() => {})
  }

  const playCards = () => {
    if (!soundOnRef.current || !cardsAudioInstance) return
    cardsAudioInstance.currentTime = 0
    cardsAudioInstance.play().catch(() => {})
  }

  const playElectric = () => {
    if (!soundOnRef.current || !electricAudioInstance) return
    electricAudioInstance.currentTime = 0
    electricAudioInstance.play().catch(() => {})
  }

  const playFire = () => {
    if (!soundOnRef.current || !fireAudioInstance) return
    fireAudioInstance.currentTime = 0
    fireAudioInstance.play().catch(() => {})
  }

  const playMoon = () => {
    if (!soundOnRef.current || !moonAudioInstance) return
    moonAudioInstance.currentTime = 0
    moonAudioInstance.play().catch(() => {})
  }

  const toggleSound = () => {
    setOn((prev) => {
      const next = !prev
      soundOnRef.current = next
      return next
    })
  }

  return {
    playWin,
    playLoss,
    playCards,
    playElectric,
    playFire,
    playMoon,
    soundOn,
    toggleSound
  }
}
