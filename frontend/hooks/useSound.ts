import { useRef, useState, useEffect } from 'react'

// Module-level singletons — avoids re-creating Audio nodes on every render
// and prevents overlapping playback from stacking instances
const winAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/win.wav') : null
const lossAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/loss.wav') : null
if (winAudioInstance) winAudioInstance.volume = 0.1
if (lossAudioInstance) lossAudioInstance.volume = 0.1

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

  const toggleSound = () => {
    setOn((prev) => {
      const next = !prev
      soundOnRef.current = next
      return next
    })
  }

  return { playWin, playLoss, soundOn, toggleSound }
}
