import { useEffect, useRef, useState } from 'react'

const CHANNEL_NAME = 'rps_league_tab'

export function useTabGuard(onDuplicate?: () => void) {
  const [isDuplicate, setIsDuplicate] = useState(false)
  const isDuplicateRef = useRef(false)
  
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage({ type: 'TAB_OPEN' })

    channel.onmessage = (e) => {
      if (e.data.type === 'TAB_OPEN')
        channel.postMessage({ type: 'TAB_EXISTS' })
      if (e.data.type === 'TAB_EXISTS' && !isDuplicateRef.current) {
        isDuplicateRef.current = true
        setIsDuplicate(true)
        onDuplicate?.()
      }
    }

    return () => channel.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return isDuplicate
}
