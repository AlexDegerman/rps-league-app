// components/ui/BetAmountInput.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/app/stores/userStore'
import { useUIStore } from '@/app/stores/uiStore'
import { formatPoints, parseShorthand } from '@/lib/format'

interface BetAmountInputProps {
  innerBorder: string
  innerRing: string
}

export default function BetAmountInput({
  innerBorder,
  innerRing
}: BetAmountInputProps) {
  const points = useUserStore((s) => s.points)
  const betAmount = useUserStore((s) => s.betAmount)
  const setBetAmount = useUserStore((s) => s.setBetAmount)
  const autoAllIn = useUserStore((s) => s.autoAllIn)
  const isHydrated = useUserStore((s) => s.isHydrated)
  const isFocused = useUIStore((s) => s.isFocused)
  const setIsFocused = useUIStore((s) => s.setIsFocused)
  const inputString = useUIStore((s) => s.inputString)
  const setInputString = useUIStore((s) => s.setInputString)
  const [localVal, setLocalVal] = useState(inputString)

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(inputString)
    }
  }, [inputString, isFocused])

  useEffect(() => {
    if (isHydrated && autoAllIn) {
      setBetAmount(points)
      if (!isFocused) {
        setInputString(points.toString())
        setLocalVal(points.toString())
      }
    }
  }, [autoAllIn, points, isHydrated, isFocused, setBetAmount, setInputString])

  useEffect(() => {
    if (isHydrated && !autoAllIn) {
      const floor = 100000n
      const resetTo = points < floor ? points : floor
      setBetAmount(resetTo)
      if (!isFocused) {
        setInputString(resetTo.toString())
        setLocalVal(resetTo.toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAllIn, isHydrated])

  return (
    <input
      type="text"
      value={isFocused ? localVal : ''}
      onFocus={() => {
        setIsFocused(true)
        setLocalVal('')
      }}
      placeholder={
        !isFocused
          ? formatPoints(betAmount).display
          : !autoAllIn
            ? '100k → 100.000'
            : ''
      }
      onChange={(e) => {
        const val = e.target.value
        setLocalVal(val)
        const parsed = parseShorthand(val)
        if (parsed > 0n) {
          setBetAmount(parsed > points ? points : parsed)
        }
      }}
      onBlur={() => {
        setIsFocused(false)
        let final = parseShorthand(localVal)
        if (final > points) final = points

        const floor = 100000n
        if (final < floor) {
          final = points < floor ? points : floor
        }

        setBetAmount(final)
        setInputString(final.toString())
        setLocalVal(final.toString())
      }}
      className={`block w-full h-full border-2 rounded-lg pl-3 pr-2 py-0 font-bold focus:ring-2 transition-all bg-white/70 ${innerBorder} ${innerRing} ${
        !isFocused ? 'placeholder:text-gray-800' : 'placeholder:text-gray-400'
      } ${isFocused && localVal.length > 20 ? 'text-[10px] font-mono' : 'text-sm'}`}
    />
  )
}
