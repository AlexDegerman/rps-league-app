import { Router } from 'express'
import pool from '../utils/db.js'
import { ALL_ACHIEVEMENTS } from '../services/achievementChecker.js'
import { RELICS } from '../services/relicService.js'
import { hasSeenAllFlashTypes } from '../services/flashEventService.js'

const router = Router()

// GET /api/achievements/:shortId
router.get('/:shortId', async (req, res) => {
  const { shortId } = req.params
  try {
    const userRes = await pool.query(
      `SELECT * FROM users WHERE short_id = $1`,
      [shortId]
    )
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })
    const u = userRes.rows[0]

    const earnedRes = await pool.query(
      `SELECT achievement_code, earned_at FROM user_achievements WHERE user_id = $1`,
      [u.user_id]
    )
    const earnedMap = new Map(
      earnedRes.rows.map((r) => [r.achievement_code, Number(r.earned_at)])
    )

    const relicRes = await pool.query(
      `SELECT relic_key, rarity FROM relics WHERE user_id = $1`,
      [u.user_id]
    )
    const userRelics = relicRes.rows
    const mythicRelicCount = userRelics.filter(
      (r) => r.rarity === 'MYTHICAL'
    ).length
    const commonRareEpicCount = userRelics.filter((r) =>
      ['COMMON', 'RARE', 'EPIC'].includes(r.rarity)
    ).length

    const stats = {
      wins: Number(u.wins),
      maxWinStreak: Number(u.max_win_streak),
      laps: Number(u.laps),
      points: u.points.toString(),
      biggestMatchMult: Number(u.biggest_match_mult),
      totalPitiesEarned: Number(u.total_pities_earned),
      lunarCaught: Number(u.lunar_events_caught),
      electricCaught: Number(u.electric_events_caught),
      hellfireCaught: Number(u.hellfire_events_caught),
      cardsCaught: Number(u.cards_events_caught),
      betAgainstOracleCount: Number(u.bet_against_oracle_count),
      oracleMaxStreak: Number(u.oracle_max_streak),
      totalAchievementsEarned: earnedMap.size,
      festivalsTriggered: Number(u.festivals_triggered),
      festivalsParticipated: Number(u.festivals_participated),

      // Relic Stats
      uniqueRelicsOwned: userRelics.length,
      allRelicsOwned: userRelics.length >= RELICS.length,
      allCommonRareEpicRelics: commonRareEpicCount >= 11, // Adjust when RELICS list changes
      allMythicalRelics: mythicRelicCount >= 3,
      hadMythicRelicSlam: !!u.had_mythic_relic_slam,

      // Flash / Session Stats
      maxConsecutiveFlashEvents: Number(u.consecutive_flash_peak),
      hasSeenAllFlashTypes: hasSeenAllFlashTypes(u.user_id),
      hasUsedAutoBet: !!u.has_used_auto_bet,
      biggestMultiplierTier: null
    }

    const achievements = ALL_ACHIEVEMENTS.map((def) => ({
      code: def.code,
      name: def.name,
      requirement: def.requirement,
      icon: def.icon,
      rarity: def.rarity,
      category: def.category,
      earned: earnedMap.has(def.code),
      earnedAt: earnedMap.get(def.code) ?? null
    }))

    res.json({
      achievements,
      stats,
      displayedBadges: u.displayed_badges ?? []
    })
  } catch (err) {
    console.error('Achievements GET error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
// PATCH /api/achievements/:shortId/badges
router.patch('/:shortId/badges', async (req, res) => {
  const { shortId } = req.params
  const { badges } = req.body

  if (!Array.isArray(badges))
    return res.status(400).json({ error: 'badges must be an array' })

  try {
    const userRes = await pool.query(
      `SELECT user_id FROM users WHERE short_id = $1`,
      [shortId]
    )
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const { user_id } = userRes.rows[0]

    const validCodes = new Set(ALL_ACHIEVEMENTS.map((a) => a.code))
    const earnedRes = await pool.query(
      `SELECT achievement_code FROM user_achievements WHERE user_id = $1`,
      [user_id]
    )
    const earned = new Set<string>(
      earnedRes.rows.map(
        (r: { achievement_code: string }) => r.achievement_code
      )
    )

    const filtered = (badges as string[])
      .filter((b) => validCodes.has(b) && earned.has(b))
      .slice(0, 10)

    await pool.query(
      `UPDATE users SET displayed_badges = $1 WHERE short_id = $2`,
      [filtered, shortId]
    )

    res.json({ displayedBadges: filtered })
  } catch (err) {
    console.error('Badge update error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/achievements/badges-for-leaderboard
router.post('/badges-for-leaderboard', async (req, res) => {
  const { shortIds } = req.body
  if (!Array.isArray(shortIds) || shortIds.length === 0) return res.json({})

  try {
    const usersRes = await pool.query(
      `SELECT user_id, short_id, displayed_badges FROM users WHERE short_id = ANY($1)`,
      [shortIds]
    )

    const userIds = usersRes.rows.map((r: { user_id: string }) => r.user_id)

    const earnedRes = await pool.query(
      `SELECT user_id, achievement_code FROM user_achievements WHERE user_id = ANY($1)`,
      [userIds]
    )

    const earnedByUser = new Map<string, Set<string>>()
    for (const row of earnedRes.rows) {
      if (!earnedByUser.has(row.user_id))
        earnedByUser.set(row.user_id, new Set())
      earnedByUser.get(row.user_id)!.add(row.achievement_code)
    }

    const achievementByCode = new Map(ALL_ACHIEVEMENTS.map((a) => [a.code, a]))
    const out: Record<
      string,
      { code: string; name: string; icon: string; rarity: string }[]
    > = {}

    for (const row of usersRes.rows) {
      const earned = earnedByUser.get(row.user_id) ?? new Set()
      out[row.short_id] = ((row.displayed_badges ?? []) as string[])
        .filter((code) => earned.has(code))
        .map((code) => {
          const def = achievementByCode.get(code)
          if (!def) return null
          return {
            code: def.code,
            name: def.name,
            icon: def.icon,
            rarity: def.rarity
          }
        })
        .filter(Boolean) as {
        code: string
        name: string
        icon: string
        rarity: string
      }[]
    }

    res.json(out)
  } catch (err) {
    console.error('Badges for leaderboard error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
