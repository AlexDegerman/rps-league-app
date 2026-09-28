'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  fetchRecoveryTutorialStatus,
  completeRecoveryTutorial
} from '@/lib/api'

interface Props {
  userId: string | null
  isOwnProfile: boolean
  recoverySectionRef: React.RefObject<HTMLDivElement | null>
}

export default function RecoveryTutorial({ userId, isOwnProfile }: Props) {
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)
  const [returnUrl, setReturnUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raf = requestAnimationFrame(() => {
        setReturnUrl(`${window.location.origin}/profile`)
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [])

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

  const handleDismiss = async () => {
    setVisible(false)
    if (userId) {
      try {
        await completeRecoveryTutorial(userId)
      } catch {}
    }
  }

  if (!visible || !checked) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-tutorial-title"
    >
      <div className="w-full max-w-xs rounded-xl border border-gray-100 bg-white p-5 text-center shadow-2xl animate-[fade-in_0.15s_ease-out_both]">
        <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 text-lg">
          🛡️
        </div>

        <h2
          id="recovery-tutorial-title"
          className="mb-1.5 text-sm font-bold tracking-wide text-gray-900"
        >
          Protect Your Progress
        </h2>

        <p className="mb-4 text-[11px] text-gray-500 leading-relaxed">
          No passwords required. Save your <strong>Recovery Code</strong> on the
          Network to restore your progress if your browser data is ever cleared.
        </p>

        <div className="flex flex-col gap-2">
          <a
            href={`https://network.rpsleague.fi/settings?tab=identity&returnTo=${encodeURIComponent(returnUrl)}`}
            onClick={handleDismiss}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-black tracking-wider text-white font-mono transition-opacity hover:opacity-90 flex items-center justify-center gap-1"
          >
            VIEW CODE ON NETWORK
            <ExternalLink size={12} />
          </a>
          <button
            onClick={handleDismiss}
            autoFocus
            className="w-full py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
