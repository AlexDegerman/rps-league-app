import { useState, useEffect, useRef } from 'react'

export function useAnimatedBigInt(
  targetValue: bigint,
  duration: number = 1000,
  shouldReset: boolean = false
) {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(targetValue)

  useEffect(() => {
    // When shouldReset is true (e.g. win/loss result animation), always start from 0
    // so the number counts up from zero rather than from the previous displayed value.
    const baseValue = shouldReset ? 0n : startValueRef.current
    startValueRef.current = baseValue
    startTimeRef.current = null

    let rafId: number

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Cubic ease-out so the animation decelerates as it approaches the target
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      if (progress < 1) {
        const diff = targetValue - baseValue
        const nextValue =
          baseValue + (diff * BigInt(Math.floor(easedProgress * 1000))) / 1000n
        setDisplayValue(nextValue)
        startValueRef.current = nextValue
        rafId = requestAnimationFrame(animate)
      } else {
        setDisplayValue(targetValue)
        startValueRef.current = targetValue
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [targetValue, duration, shouldReset])

  return displayValue
}
