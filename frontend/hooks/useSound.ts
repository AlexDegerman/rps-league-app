import { useRef, useState, useEffect } from 'react'

const winAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/win.wav') : null
const lossAudioInstance =
  typeof window !== 'undefined' ? new Audio('/sounds/loss.wav') : null

if (winAudioInstance) winAudioInstance.volume = 0.1
if (lossAudioInstance) lossAudioInstance.volume = 0.1

export const useSound = () => {
  const [soundOn, setOn] = useState(true)
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
    winAudioInstance.currentTime = 0
    winAudioInstance.play().catch(() => {
    })
  }

  const playLoss = () => {
    if (!soundOnRef.current || !lossAudioInstance) return
    lossAudioInstance.currentTime = 0
    lossAudioInstance.play().catch(() => {})
  }

  const toggleSound = () => {
    setOn((prev) => {
      const nextState = !prev
      soundOnRef.current = nextState
      return nextState
    })
  }

  return { playWin, playLoss, soundOn, toggleSound }
}
