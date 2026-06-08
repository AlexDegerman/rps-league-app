import { useState, useEffect, useRef } from 'react'

export function useAnimatedBigInt(
  targetValue: bigint,
  duration: number = 1000,
  shouldReset: boolean = false
) {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const displayRef = useRef(targetValue)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const baseValue = shouldReset ? 0n : displayRef.current
    const startTime = { current: Date.now() }

    const animate = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      if (progress < 1) {
        const diff = targetValue - baseValue
        const next =
          baseValue + (diff * BigInt(Math.floor(eased * 1000))) / 1000n
        displayRef.current = next
        setDisplayValue(next)
        rafRef.current = requestAnimationFrame(animate)
      } else {
        displayRef.current = targetValue
        setDisplayValue(targetValue)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetValue, duration, shouldReset])

  return displayValue
}
