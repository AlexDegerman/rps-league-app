'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  fetchRecoveryTutorialStatus,
  completeRecoveryTutorial
} from '@/lib/api'

interface Props {
  userId: string | null
  isOwnProfile: boolean
  recoverySectionRef: React.RefObject<HTMLDivElement | null>
}

export default function RecoveryTutorial({
  userId,
  isOwnProfile,
  recoverySectionRef
}: Props) {
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const savedScrollY = useRef(0)

  useEffect(() => {
    if (!visible || !recoverySectionRef.current) return

    const updateRect = () => {
      if (recoverySectionRef.current) {
        setRect(recoverySectionRef.current.getBoundingClientRect())
      }
    }

    updateRect()
    const t = setTimeout(updateRect, 600)
    window.addEventListener('scroll', updateRect, { passive: true })
    window.addEventListener('resize', updateRect)
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', updateRect)
      window.removeEventListener('resize', updateRect)
    }
  }, [visible, recoverySectionRef])

  useEffect(() => {
    if (!isOwnProfile || !userId) return
    const t = setTimeout(async () => {
      try {
        const data = await fetchRecoveryTutorialStatus(userId)
        if (data && !data.recoveryTutorialCompleted) {
          setVisible(true)
        }
      } catch {}
      setChecked(true)
    }, 500)
    return () => clearTimeout(t)
  }, [userId, isOwnProfile])

  useEffect(() => {
    if (!visible || !recoverySectionRef.current) return
    savedScrollY.current = window.scrollY

    const element = recoverySectionRef.current
    const elementRect = element.getBoundingClientRect()
    const absoluteElementTop = elementRect.top + window.pageYOffset
    const middleOffset = window.innerHeight * 0.65

    window.scrollTo({
      top: absoluteElementTop - middleOffset,
      behavior: 'smooth'
    })
  }, [visible, recoverySectionRef])

  const handleDismiss = async () => {
    setVisible(false)
    setTimeout(() => {
      window.scrollTo({ top: savedScrollY.current, behavior: 'smooth' })
    }, 200)
    if (userId) {
      try {
        await completeRecoveryTutorial(userId)
      } catch {}
    }
  }

  if (!visible || !checked) return null

  const PAD = 12
  const maskStyle = rect
    ? {
        clipPath: `polygon(
      0% 0%, 0% 100%, 
      ${rect.left - PAD}px 100%, 
      ${rect.left - PAD}px ${rect.top - PAD}px, 
      ${rect.right + PAD}px ${rect.top - PAD}px, 
      ${rect.right + PAD}px ${rect.bottom + PAD}px, 
      ${rect.left - PAD}px ${rect.bottom + PAD}px, 
      ${rect.left - PAD}px 100%, 
      100% 100%, 100% 0%
    )`
      }
    : {}

  return (
    <>
      <div
        className="fixed inset-0 z-90 bg-black/60 backdrop-blur-xs transition-opacity duration-500"
        style={maskStyle}
      />

      {rect && (
        <div
          className="fixed z-91 pointer-events-none rounded-2xl"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            outline: '2px solid rgba(79, 70, 229, 0.6)',
            boxShadow: '0 0 24px rgba(79, 70, 229, 0.3)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
      )}

      <div
        className="fixed z-100 flex justify-center px-4 pointer-events-none transition-all duration-300"
        style={{
          left: 0,
          right: 0,
          top: rect ? rect.top - 20 : '40%',
          transform: rect ? 'translateY(-100%)' : 'translateY(-50%)'
        }}
      >
        <div className="relative w-full max-w-[320px] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="h-1.5 w-full bg-linear-to-r from-indigo-400 via-violet-500 to-indigo-400 shrink-0" />

            <div className="px-6 pt-4 pb-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 leading-none mb-1">
                    Profile Security
                  </span>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">
                    Recovery Access
                  </h2>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 -mr-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-6 py-2">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
                <div className="flex items-start gap-2.5 mb-3">
                  <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                    Your recovery code is the only way to restore your progress
                    on a new device.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-[11px] text-red-600 font-bold leading-relaxed">
                    Without it, your progress cannot be recovered if you lose
                    access.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-1">
              <button
                onClick={handleDismiss}
                className="w-full py-4 bg-gray-900 hover:bg-black active:scale-[0.98] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg"
              >
                Got It
              </button>
            </div>
          </div>

          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid white'
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
