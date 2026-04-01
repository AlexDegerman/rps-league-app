import { useRef, useState, useEffect } from 'react'

export const useSound = () => {
  const winAudio = useRef(
    typeof window !== 'undefined' ? new Audio('/sounds/win.wav') : null
  )
  const lossAudio = useRef(
    typeof window !== 'undefined' ? new Audio('/sounds/loss.wav') : null
  )

  const [soundOn, setSoundOn] = useState(true)
  const soundOnRef = useRef(true)

  // Load saved sound setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('soundOn')
    if (saved !== null) {
      const state = saved === 'true'
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSoundOn(state)
      soundOnRef.current = state
    }
  }, [])

  // Save sound setting whenever it changes
  useEffect(() => {
    localStorage.setItem('soundOn', soundOn.toString())
  }, [soundOn])

  // Set volume on mount
  useEffect(() => {
    if (winAudio.current) winAudio.current.volume = 0.1
    if (lossAudio.current) lossAudio.current.volume = 0.1
  }, [])

  const playWin = () => {
    if (!soundOnRef.current || !winAudio.current) return
    winAudio.current.currentTime = 0
    winAudio.current.play().catch(() => {})
  }

  const playLoss = () => {
    if (!soundOnRef.current || !lossAudio.current) return
    lossAudio.current.currentTime = 0
    lossAudio.current.play().catch(() => {})
  }

  const toggleSound = () => {
    setSoundOn((prev) => {
      const nextState = !prev
      soundOnRef.current = nextState
      return nextState
    })
  }

  return { playWin, playLoss, soundOn, toggleSound }
}
