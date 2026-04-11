import { nanoid } from 'nanoid'
import { generateNickname } from './nicknames'

const USER_ID_KEY = 'rps_user_id'
const SHORT_ID_KEY = 'rps_short_id'
const NICKNAME_KEY = 'rps_nickname'

const generateUserId = (): string => crypto.randomUUID()
const generateShortId = (): string => nanoid(10)

// Returns a stable user identity for the current browser session.
// Reads from localStorage on first call, generating values if missing.
// Result is cached in memory to prevent duplicate creation across re-renders.
// Safe for SSR: returns empty values when window is unavailable.
let cachedUser: { userId: string; shortId: string; nickname: string } | null =
  null

export const getOrCreateUser = (): {
  userId: string
  shortId: string
  nickname: string
} => {
  if (typeof window === 'undefined') {
    return { userId: '', shortId: '', nickname: '' }
  }

  if (cachedUser) return cachedUser

  const validate = (v: string | null) =>
    v && v !== 'null' && v !== 'undefined' && v.trim() !== '' ? v : null

  let userId = validate(localStorage.getItem(USER_ID_KEY))
  let shortId = validate(localStorage.getItem(SHORT_ID_KEY))
  let nickname = validate(localStorage.getItem(NICKNAME_KEY))

  if (!userId || !shortId || !nickname) {
    if (!userId) userId = generateUserId()
    if (!shortId) shortId = generateShortId()
    if (!nickname) nickname = generateNickname()

    localStorage.setItem(USER_ID_KEY, userId)
    localStorage.setItem(SHORT_ID_KEY, shortId)
    localStorage.setItem(NICKNAME_KEY, nickname)
  }

  cachedUser = { userId, shortId, nickname }
  return cachedUser
}

export const isUserValid = (user: {
  userId: string
  shortId: string
}): boolean => {
  return (
    typeof user.userId === 'string' &&
    typeof user.shortId === 'string' &&
    user.userId.trim().length > 0 &&
    user.shortId.trim().length > 0
  )
}

export const resetUser = () => {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(SHORT_ID_KEY)
  localStorage.removeItem(NICKNAME_KEY)

  cachedUser = null
}

export const clearUserCache = () => {
  cachedUser = null
}

export const regenerateNickname = (): string => {
  if (typeof window === 'undefined') return ''
  const nickname = generateNickname()
  localStorage.setItem(NICKNAME_KEY, nickname)
  return nickname
}

export const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_ID_KEY)
}

export const getNickname = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(NICKNAME_KEY)
}
