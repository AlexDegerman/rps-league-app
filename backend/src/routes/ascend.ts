import { Router } from 'express'
import pool from '../utils/db.js'

const router = Router()

// Threshold is 999 OVG = 999 * 10^87
// To raise the cap in future: update this constant and the frontend ASCENSION_THRESHOLD
const ASCENSION_THRESHOLD = 999n * 10n ** 87n

router.post('/', async (req, res) => {
  try {
    const { userId, shortId } = req.body
    if (!userId || !shortId)
      return res.status(400).json({ error: 'Missing userId or shortId' })

    const userRes = await pool.query(
      `SELECT points, laps, fastest_lap_bets, total_bets_at_last_ascension
        FROM users WHERE user_id = $1`,
      [userId]
    )
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const row = userRes.rows[0]
    const currentPoints = BigInt(row.points)

    if (currentPoints < ASCENSION_THRESHOLD) {
      return res.status(400).json({ error: 'Not enough points to ascend' })
    }

    // Derive bets taken this lap
    const totalBetsRes = await pool.query(
      `SELECT COUNT(*) AS total FROM predictions WHERE user_id = $1 AND result IS NOT NULL`,
      [userId]
    )
    const totalBets = Number(totalBetsRes.rows[0].total)
    const betsThisLap = totalBets - Number(row.total_bets_at_last_ascension)

    const currentFastest =
      row.fastest_lap_bets !== null ? Number(row.fastest_lap_bets) : null
    const newFastest =
      currentFastest === null
        ? betsThisLap
        : Math.min(currentFastest, betsThisLap)

    await pool.query(
      `UPDATE users SET
        points = 200000,
        laps = laps + 1,
        fastest_lap_bets = $1,
        total_bets_at_last_ascension = $2,
        peak_points = GREATEST(peak_points, $3)
        WHERE user_id = $4`,
      [newFastest, totalBets, currentPoints.toString(), userId]
    )

    const updated = await pool.query(
      `SELECT laps, fastest_lap_bets FROM users WHERE user_id = $1`,
      [userId]
    )

    res.json({
      success: true,
      laps: updated.rows[0].laps,
      fastestLapBets: updated.rows[0].fastest_lap_bets
    })
  } catch (err) {
    console.error('Ascend error:', err)
    res.status(500).json({ error: 'Ascension failed' })
  }
})

export default router
