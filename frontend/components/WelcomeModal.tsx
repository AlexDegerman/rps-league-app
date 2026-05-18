'use client'

import { useState, useEffect } from 'react'
import { getOrCreateUser } from '@/lib/user'
import { useUserStore } from '@/app/stores/userStore'

interface WelcomeModalProps {
  onContinue: () => void
}

export default function WelcomeModal({ onContinue }: WelcomeModalProps) {
  const [nickname, setNickname] = useState('')
  const [rerolling, setRerolling] = useState(false)
  const [justRerolled, setJustRerolled] = useState(false)
  const { rerollNickname } = useUserStore()

  useEffect(() => {
    const user = getOrCreateUser()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNickname(user.nickname || '')
  }, [])

  const handleReroll = async () => {
    if (rerolling) return
    setRerolling(true)

    const newName = await rerollNickname()
    if (newName) {
      setNickname(newName)
      setJustRerolled(true)
      setTimeout(() => setJustRerolled(false), 1000)
    }
    setRerolling(false)
  }

  return (
    <div className="fixed inset-x-0 top-0 bottom-14 z-50 flex items-center justify-center px-4 h-[calc(100svh-56px)]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-400" />

          <div className="px-5 py-5 flex flex-col items-center text-center gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30">
                Welcome to
              </p>
              <p className="text-xl font-black text-gray-900 tracking-tight leading-none">
                RPS League
              </p>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-1.5">
                Your Identity
              </p>

              <div
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 ${
                  justRerolled
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-200'
                }`}
              >
                <span
                  className={`font-black tracking-tight leading-snug text-left transition-all duration-200 ${
                    nickname.length > 18
                      ? 'text-[11px]'
                      : nickname.length > 13
                        ? 'text-[13px]'
                        : 'text-[15px]'
                  } ${
                    justRerolled ? 'text-indigo-700' : 'text-gray-900'
                  } ${rerolling ? 'opacity-40' : 'opacity-100'}`}
                >
                  {rerolling ? '...' : nickname}
                </span>

                <button
                  onClick={handleReroll}
                  disabled={rerolling}
                  className="shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 disabled:opacity-40 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50 active:scale-95"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={rerolling ? 'animate-spin' : ''}
                  >
                    <rect x="2" y="2" width="20" height="20" rx="4" />
                    <circle
                      cx="8"
                      cy="8"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="16"
                      cy="8"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="8"
                      cy="16"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1.5"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                  Reroll
                </button>
              </div>

              <p className="mt-2 text-[10px] font-medium text-black/40 leading-snug">
                Your identity in RPS League
                <br />
                You can reroll your name anytime in your profile.
              </p>
            </div>

            <button
              onClick={onContinue}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-200"
            >
              Continue
            </button>

            <p className="text-[9px] text-black/40 font-medium leading-snug -mt-2">
              Your account is stored on this device.
            </p>
            <p className="text-[9px] text-black/30 font-medium leading-snug">
              Save your recovery code from your profile to restore it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
