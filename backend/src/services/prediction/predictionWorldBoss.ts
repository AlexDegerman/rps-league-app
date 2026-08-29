import pool from '../../utils/db.js'
import { logger } from '../../utils/logger.js'
import {
  getCurrentState as getBossState,
  registerParticipant,
  recordMiss,
  applyDamage
} from '../worldBossService.js'

export const resolveWorldBossPrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  let predictions
  try {
    predictions = await pool.query(
      `SELECT p.user_id, p.pick, u.nickname, u.equipped_relics
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.game_id = $1 AND p.result IS NULL`,
      [gameId]
    )
  } catch (err) {
    logger.error('resolveWorldBossPrediction: fetch failed', err, { gameId })
    return
  }

  const bossState = getBossState()
  const now = Date.now()
  const timeRemaining = bossState.encounterEndsAt
    ? Math.max(0, Math.ceil((bossState.encounterEndsAt - now) / 1000))
    : 0

  await Promise.all(
    predictions.rows.map(async (row) => {
      try {
        const isWin = row.pick === winnerName
        const relics: string[] = row.equipped_relics?.filter(Boolean) ?? []

        registerParticipant(
          row.user_id,
          timeRemaining,
          row.nickname ?? 'Player'
        )

        if (!isWin) {
          recordMiss(row.user_id)
        }

        let damage = 0
        if (isWin) {
          damage = 1
          // Temporal Charge: first 10s registers as 2 damage
          if (
            relics.includes('temporal_charge') &&
            bossState.encounterStartedAt &&
            now - bossState.encounterStartedAt < 10_000
          )
            damage = 2
          // Omega Shard: 10% chance for 3 damage
          if (relics.includes('omega_shard') && Math.random() < 0.1) damage = 3

          applyDamage(row.user_id, damage, broadcast)
        }
        // Phantom Reach: misses still contribute 1 damage (50% proc)
        else if (relics.includes('phantom_reach') && Math.random() < 0.5) {
          applyDamage(row.user_id, 1, broadcast)
          damage = 1 // for SSE reporting
        } else {
          applyDamage(row.user_id, 0, broadcast)
        }

        await pool.query(
          `UPDATE predictions SET result = $1, gain_loss = 0 WHERE user_id = $2 AND game_id = $3`,
          [isWin ? 'WIN' : 'LOSE', row.user_id, gameId]
        )

        const fresh = getBossState()
        const hpPct = fresh.hpPct
        broadcast(
          'world_boss_hit',
          JSON.stringify({
            userId: row.user_id,
            result: isWin ? 'HIT' : 'MISS',
            bossHpPct: hpPct,
            damage
          })
        )
      } catch (err) {
        logger.error('resolveWorldBossPrediction: per-user error', err, {
          userId: row.user_id,
          gameId
        })
      }
    })
  )
}
