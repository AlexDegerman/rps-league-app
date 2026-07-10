import pool from '../utils/db.js'
import { getLatestMatches } from '../services/matchService.js'
import { logger } from '../utils/logger.js'
import { formatStat } from '../utils/formatStat.js'
import { GAME_KNOWLEDGE } from './gameKnowledge/index.js'

export async function buildContext(): Promise<string> {
  const [
    matchesData,
    statsRes,
    matchCountRes,
    topPredictorsRes,
    topPlayersRes,
    flashStatsRes
  ] = await Promise.all([
    getLatestMatches(1, 30).catch((err) => {
      logger.warn('Oracle: getLatestMatches failed, using empty fallback', {
        error: String(err)
      })
      return { matches: [] }
    }),
    pool.query(`
      SELECT 
        COUNT(*)::text as total_count, 
        COALESCE(SUM(bet_amount), 0)::text as total_volume,
        COUNT(*) FILTER (WHERE result = 'WIN')::text as win_count
      FROM predictions
    `),
    pool.query(`SELECT COUNT(*)::text FROM matches`),
    pool.query(
      `SELECT nickname, points FROM users ORDER BY points DESC LIMIT 10`
    ),
    pool.query(`
      SELECT name, COUNT(*) as wins FROM (
        SELECT player_a_name as name FROM matches 
        WHERE (player_a_played = 'ROCK' AND player_b_played = 'SCISSORS')
          OR (player_a_played = 'SCISSORS' AND player_b_played = 'PAPER')
          OR (player_a_played = 'PAPER' AND player_b_played = 'ROCK')
        UNION ALL
        SELECT player_b_name as name FROM matches 
        WHERE (player_b_played = 'ROCK' AND player_a_played = 'SCISSORS')
          OR (player_b_played = 'SCISSORS' AND player_a_played = 'PAPER')
          OR (player_b_played = 'PAPER' AND player_a_played = 'ROCK')
      ) as winners
      GROUP BY name
      ORDER BY wins DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE flash_event_type IS NOT NULL)::text as total_flash_events,
        COUNT(DISTINCT flash_event_type) FILTER (WHERE flash_event_type IS NOT NULL)::text as unique_event_types,
        MODE() WITHIN GROUP (ORDER BY flash_event_type) FILTER (WHERE flash_event_type IS NOT NULL) as most_common_event,
        MAX(flash_multiplier)::text as highest_multiplier_seen,
        COUNT(*) FILTER (WHERE flash_event_type IS NOT NULL AND result = 'WIN')::text as flash_event_wins
      FROM predictions
    `)
  ])

  const formattedPredictors = topPredictorsRes.rows.map((row: any) => {
    const stats = formatStat(row.points)
    return {
      nickname: row.nickname,
      points: `${stats.formatted} (${stats.name})`
    }
  })

  const stats = statsRes.rows[0]
  const flashStats = flashStatsRes.rows[0]
  const actualMatches = matchCountRes.rows[0].count
  const winRate =
    (Number(stats.win_count) / (Number(stats.total_count) || 1)) * 100
  const houseEdge = (50 - 1.5 * winRate).toFixed(1)
  const formattedVolume = formatStat(stats.total_volume).formatted

  const history = (matchesData.matches || []).map((m: any) => ({
    p1: m.playerA.name,
    p2: m.playerB.name,
    moves: `${m.playerA.played} vs ${m.playerB.played}`
  }))

  return `
    <game_knowledge>
    ${GAME_KNOWLEDGE}
    </game_knowledge>
    <league_telemetry>Total Matches: ${actualMatches}, Total Prediction Volume: ${formattedVolume}, House Edge: ${houseEdge}%</league_telemetry>
    <predictor_leaderboard>${JSON.stringify(formattedPredictors)}</predictor_leaderboard>
    <top_players_by_wins>${JSON.stringify(topPlayersRes.rows)}</top_players_by_wins>
    <active_match_history>${JSON.stringify(history)}</active_match_history>
    <flash_event_stats>Total Flash Events Triggered: ${flashStats.total_flash_events}, Unique Event Types Active: ${flashStats.unique_event_types}, Most Common Event: ${flashStats.most_common_event ?? 'none'}, Highest Multiplier Seen: ${flashStats.highest_multiplier_seen ?? '1'}, Flash Event Wins: ${flashStats.flash_event_wins}</flash_event_stats>
    `
}
