'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { getOrCreateUser } from '@/lib/user'
import { useUserStore } from '@/app/stores/userStore'
import { useGameStore } from '@/app/stores/gameStore'
import { usePathname } from 'next/navigation'
import CloseIcon from '@/components/icons/CloseIcon'
import { submitFeedback } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'ratelimited'

type CategoryKey =
  | 'bug'
  | 'visuals'
  | 'balance'
  | 'oracle'
  | 'suggestion'
  | 'praise'

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'bug', label: '🐛 Technical Issue' },
  { key: 'visuals', label: '🎨 Visuals & Animations' },
  { key: 'balance', label: '⚖️ Gameplay & Balance' },
  { key: 'oracle', label: '👁️ AI Oracle Analysis' },
  { key: 'suggestion', label: '💡 Suggestion' },
  { key: 'praise', label: '🙌 General Praise' }
]

const PLACEHOLDERS: Record<CategoryKey, string> = {
  bug: 'Describe what failed. What were you doing when it happened?',
  visuals: 'Which theme or animation? What looked off?',
  balance: 'Thoughts on multipliers, streaks, or the point floor?',
  oracle: 'Was the Oracle accurate? Too long? Off-topic?',
  suggestion: 'What feature would you like to see?',
  praise: 'Go ahead, we are listening.'
}

export default function FeedbackPage() {
  const pathname = usePathname()
  const { displayNickname, points, winStreak } = useUserStore()
  const { activeFlashEvent } = useGameStore()

  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<CategoryKey>('bug')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  )
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [banCheckDone, setBanCheckDone] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pre-fill nickname from generated identity
  useEffect(() => {
    if (displayNickname) setNickname(displayNickname)
  }, [displayNickname])

  // Check ban status before showing the form
  useEffect(() => {
    const user = getOrCreateUser()
    fetch(`${API_BASE}/api/feedback/status?userId=${user.userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.banned) setIsBanned(true)
      })
      .catch(() => {})
      .finally(() => setBanCheckDone(true))
  }, [])

  // Handle clipboard paste for screenshots anywhere on the page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/')
      )
      if (item) {
        const file = item.getAsFile()
        if (file) handleFile(file)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // handleFile is stable via useCallback, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Images only (png, jpg, webp)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Max 5 MB')
      return
    }
    setErrorMsg('')
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const removeScreenshot = () => {
    setScreenshot(null)
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      setErrorMsg('Message is required')
      return
    }
    setErrorMsg('')
    setStatus('submitting')

    const user = getOrCreateUser()
    // Attach the most recent Sentry event so the report links to an error trace
    const sentryEventId = Sentry.lastEventId() ?? undefined

    const formData = new FormData()
    formData.append('nickname', nickname || 'Anonymous')
    formData.append('email', email)
    formData.append('message', message)
    formData.append('category', category)
    formData.append('userId', user.userId)
    formData.append('shortId', user.shortId)
    formData.append('points', points.toString())
    formData.append('streak', winStreak.toString())
    formData.append('flashEvent', activeFlashEvent ?? '')
    formData.append('route', pathname ?? '/')
    formData.append('browser', navigator.userAgent)
    formData.append('viewport', `${window.innerWidth}x${window.innerHeight}`)
    if (sentryEventId) formData.append('sentryEventId', sentryEventId)
    if (screenshot) formData.append('screenshot', screenshot)

    const result = await submitFeedback(formData)

    if ('ok' in result) {
      setStatus('success')
    } else if (result.error === 'BANNED') {
      setIsBanned(true)
      setStatus('idle')
    } else if (result.error === 'RATE_LIMITED') {
      setStatus('ratelimited')
    } else {
      setErrorMsg(result.error ?? 'Submission failed')
      setStatus('error')
    }
  }

  // Loading state while ban check resolves
  if (!banCheckDone) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse text-gray-400 text-sm">
        Loading...
      </div>
    )
  }

  // Banned state
  if (isBanned) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">
          🚫
        </div>
        <h1 className="text-xl font-black text-gray-800">
          Feedback unavailable
        </h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          Your account has been restricted from submitting feedback.
        </p>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">
          ✓
        </div>
        <h1 className="text-xl font-black text-gray-800">Got it, thanks!</h1>
        <p className="text-sm text-gray-500 max-w-xs">
          Feedback received. If you left your email, I&apos;ll follow up.
        </p>
        <button
          onClick={() => {
            setMessage('')
            setEmail('')
            setScreenshot(null)
            setScreenshotPreview(null)
            setStatus('idle')
          }}
          className="mt-2 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-wide"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-16 sm:pb-24">
      <div className="mb-3 sm:mb-5">
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">
          Feedback
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Bug report, idea, or anything else. All welcome.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        {/* Category pills */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Category
          </label>

          <div className="relative sm:hidden">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 focus:ring-2 focus:ring-purple-300 focus:outline-none transition-all"
            >
              {CATEGORIES.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-600">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          <div className="hidden sm:flex flex-wrap gap-1.5">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                  category === key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Nickname */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Name{' '}
            <span className="text-gray-300 font-medium normal-case">
              (optional)
            </span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Anonymous"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-purple-300 focus:outline-none transition-all"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Email{' '}
            <span className="text-gray-300 font-medium normal-case">
              (optional, only used for replies)
            </span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-purple-300 focus:outline-none transition-all"
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[category]}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-purple-300 focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Screenshot */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Screenshot{' '}
            <span className="text-gray-300 font-medium normal-case">
              (optional)
            </span>
          </label>

          {screenshotPreview ? (
            <div className="relative inline-block max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="rounded-lg border border-gray-200 max-h-40 sm:max-h-48 object-contain"
              />
              <button
                onClick={removeScreenshot}
                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-red-50 transition-colors"
                aria-label="Remove screenshot"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl sm:text-2xl">📎</span>
              <p className="text-[11px] sm:text-xs font-bold text-gray-500 text-center">
                Drop, paste (Ctrl+V), or{' '}
                <span className="text-purple-600 underline">pick a file</span>
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-400">
                PNG, JPG, WEBP, max 5 MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {/* Inline error */}
        {(errorMsg || status === 'error') && (
          <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
            {errorMsg || 'Something went wrong. Try again.'}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={status === 'submitting' || !message.trim()}
          className="w-full py-2.5 sm:py-3 mt-1 sm:mt-0 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
        >
          {status === 'submitting' ? 'Sending...' : 'Send Feedback'}
        </button>

        <p className="text-[9px] sm:text-[10px] text-gray-400 text-center leading-relaxed">
          Game state and environment data are attached automatically to help
          with debugging. No personal data beyond what you enter here.
        </p>
      </div>
    </div>
  )
}
