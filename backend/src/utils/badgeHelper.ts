import pool from './db.js'
import { ACHIEVEMENT_MAP } from '../services/achievementChecker.js'

export const autoEquipUserBadges = async (
  userId: string
): Promise<string[]> => {
  try {
    const userRes = await pool.query(
      `SELECT show_linkedin_badge FROM users WHERE user_id = $1`,
      [userId]
    )
    if (userRes.rows.length === 0) return []
    const u = userRes.rows[0]
    const maxSlots = u.show_linkedin_badge ? 4 : 5

    const earnedRes = await pool.query(
      `SELECT achievement_code FROM user_achievements WHERE user_id = $1`,
      [userId]
    )
    const earnedCodes = earnedRes.rows.map(
      (r: { achievement_code: string }) => r.achievement_code
    )
    if (earnedCodes.length === 0) return []

    const RARITY_WEIGHT: Record<string, number> = {
      RAINBOW: 6,
      MYTHICAL: 5,
      LEGENDARY: 4,
      EPIC: 3,
      RARE: 2,
      COMMON: 1
    }

    const earnedDefs = earnedCodes
      .map((code) => ACHIEVEMENT_MAP.get(code))
      .filter((a): a is any => !!a)

    const shuffled = [...earnedDefs].sort(() => Math.random() - 0.5)

    const sorted = shuffled.sort((a, b) => {
      const wA = RARITY_WEIGHT[a.rarity] ?? 0
      const wB = RARITY_WEIGHT[b.rarity] ?? 0
      return wB - wA
    })

    const badgesToEquip = sorted.slice(0, maxSlots).map((a) => a.code)

    await pool.query(
      `UPDATE users SET displayed_badges = $1 WHERE user_id = $2`,
      [badgesToEquip, userId]
    )

    return badgesToEquip
  } catch (err) {
    console.error('autoEquipUserBadges helper failed:', err)
    return []
  }
}
