import { generateNickname } from './nicknames'

const USER_ID_KEY = 'rps_user_id'
const NICKNAME_KEY = 'rps_nickname'

const generateUserId = (): string => crypto.randomUUID()

export const getOrCreateUser = (): { userId: string; nickname: string } => {
  let userId = localStorage.getItem(USER_ID_KEY)
  let nickname = localStorage.getItem(NICKNAME_KEY)

  if (!userId) {
    userId = generateUserId()
    localStorage.setItem(USER_ID_KEY, userId)
  }

  if (!nickname) {
    nickname = generateNickname()
    localStorage.setItem(NICKNAME_KEY, nickname)
  }

  return { userId, nickname }
}

export const regenerateNickname = (): string => {
  const nickname = generateNickname()
  localStorage.setItem(NICKNAME_KEY, nickname)
  return nickname
}

export const getUserId = (): string | null => localStorage.getItem(USER_ID_KEY)

export const getNickname = (): string | null =>
  localStorage.getItem(NICKNAME_KEY)
