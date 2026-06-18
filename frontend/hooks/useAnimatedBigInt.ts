import { useEffect, useRef, useState } from 'react'
import { formatPoints, getDisplayTierClass } from '@/lib/format'

export function useAnimatedBigInt(
  ref: React.RefObject<HTMLElement | null>,
  targetValue: bigint,
  stylePreference: string | null,
  duration: number = 1000,
  shouldReset: boolean = false
) {
  const displayRef = useRef(targetValue)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const targetBig = BigInt(targetValue)
    const baseValue = shouldReset ? 0n : BigInt(displayRef.current)
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      let currentVal = targetBig

      if (progress < 1) {
        const diff = targetBig - baseValue
        currentVal =
          baseValue + (diff * BigInt(Math.floor(eased * 1000))) / 1000n
        displayRef.current = currentVal
        rafRef.current = requestAnimationFrame(animate)
      } else {
        displayRef.current = targetBig
      }

      if (ref.current) {
        const { display } = formatPoints(currentVal)
        ref.current.textContent = display

        const newClass = getDisplayTierClass(currentVal, stylePreference)
        ref.current.className = newClass
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetValue, duration, shouldReset, stylePreference, ref])
}

export function useAnimatedBigIntVal(
  targetValue: bigint,
  duration: number = 1000,
  shouldReset: boolean = false
): bigint {
  const [val, setVal] = useState(targetValue)
  const displayRef = useRef(targetValue)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const targetBig = BigInt(targetValue)
    const baseValue = shouldReset ? 0n : displayRef.current
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      let currentVal = targetBig

      if (progress < 1) {
        const diff = targetBig - baseValue
        currentVal =
          baseValue + (diff * BigInt(Math.floor(eased * 1000))) / 1000n
        setVal(currentVal)
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setVal(targetBig)
        displayRef.current = targetBig
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetValue, duration, shouldReset])

  return val
}
