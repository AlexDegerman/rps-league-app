import pool from '../utils/db.js'
import { getOrCreateUser } from './userService.js'
import {
  getFlashEventForUser,
  consumeFlashBetForUser,
  tryTriggerFlashEventForUser,
  recordSessionFlashType,
  hasSeenAllFlashTypes,
} from './flashEventService.js'
import { logger } from '../utils/logger.js'
import {
  consumeOracleForUser,
  getOracleState,
  hasUserUsedOracle
} from './oracleService.js'
import {
  checkAndTriggerFestival,
  getGuaranteedBonusRemaining,
  consumeGuaranteedBonus,
  getActiveFestival
} from './festivalService.js'
import {
  checkAchievements,
  type AchievementStats
} from './achievementChecker.js'
import { RELICS, rollRelicDrop } from './relicService.js'

const POINTS_FLOOR = 100000n
// Architect's Keystone upgrades a bonus to MYTHICAL at this multiplier
const MYTHICAL_MULTIPLIER = 7.0
      let recordIndex = 0
const TIER_UPGRADE: Record<string, string> = {
  COMMON: 'RARE',
  RARE: 'EPIC',
  EPIC: 'LEGENDARY',
  LEGENDARY: 'MYTHICAL'
}

export const savePrediction = async (
  userId: string,
  gameId: string,
  pick: string,
  betAmount: bigint,
  nickname: string,
  shortId: string
): Promise<{ success: boolean; error?: string }> => {
  const { points: balance } = await getOrCreateUser(userId, shortId)

  if (betAmount <= 0n) return { success: false, error: 'Invalid bet amount' }
  if (betAmount > balance)
    return { success: false, error: 'Bet could not be processed' }

  try {
    const nameCheck = await pool.query(
      `SELECT user_id FROM users WHERE nickname = $1 AND user_id != $2`,
      [nickname, userId]
    )

    if (nameCheck.rows.length > 0) {
      return { success: false, error: 'Nickname unavailable' }
    }

    const matchRes = await pool.query(
      `SELECT expires_at, player_a_name, player_b_name FROM matches WHERE game_id = $1`,
      [gameId]
    )
    if (matchRes.rows.length === 0)
      return { success: false, error: 'Invalid match' }
    if (Date.now() > Number(matchRes.rows[0].expires_at))
      return { success: false, error: 'Selection window closed' }

    const oracleUsed = await hasUserUsedOracle(userId)
    let betAgainstOracle = false
    if (!oracleUsed) {
      const oracleState = getOracleState()
      const oracleWinnerName =
        oracleState.side === 'left'
          ? matchRes.rows[0].player_a_name
          : matchRes.rows[0].player_b_name
      betAgainstOracle = pick !== oracleWinnerName
    }

    await pool.query(`UPDATE users SET nickname = $1 WHERE user_id = $2`, [
      nickname,
      userId
    ])

    const insertResult = await pool.query(
      `INSERT INTO predictions (user_id, game_id, pick, bet_amount, created_at, bet_against_oracle)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, game_id) DO NOTHING`,
      [userId, gameId, pick, betAmount.toString(), Date.now(), betAgainstOracle]
    )

    if (insertResult.rowCount === 0)
      return { success: false, error: 'BET ALREADY PLACED' }

    return { success: true }
  } catch (err) {
    logger.errorWithPoints('savePrediction failed', err, {
      userId,
      gameId,
      points: balance,
      betAmount
    })
    return { success: false, error: 'Internal error' }
  }
}

// 40% chance of a bonus (80% under 2M points). Tier determines multiplier range.
const rollBonus = (
  isWin: boolean,
  pityCount: number,
  currentPoints: bigint,
  userId: string,
  flashType?: string | null,
  equippedRelic?: string | null
): { multiplier: number; tier: string } | null => {
  // CARDS flash event: always legendary on wins
  if (flashType === 'CARDS' && isWin) {
    return { multiplier: 5.0, tier: 'LEGENDARY' }
  }

  const forceBonus = pityCount >= 3
  // Spark Festival: guaranteed bonus on next 3 bets for streak-trigger initiator
  const hasGuaranteedBonus = isWin && getGuaranteedBonusRemaining(userId) > 0
  if (hasGuaranteedBonus) consumeGuaranteedBonus(userId)

  const baseChance = currentPoints < 2000000n ? 0.8 : 0.4
  const extraChance = equippedRelic === 'precision_bearing' ? 0.1 : 0.0
  const finalChance = baseChance + extraChance

  if (!forceBonus && !hasGuaranteedBonus && Math.random() > finalChance)
    return null

  const roll = Math.random() * 100

  const isBiased = equippedRelic === 'biased_oscillator'
  const commonThreshold = isBiased ? 58.4 : 59.5
  const rareThreshold = isBiased ? 83.0 : 84.5
  const epicThreshold = isBiased ? 97.3 : 97.5
  const legendaryThreshold = 99.5

  if (roll < commonThreshold) {
    // COMMON: Win 1.5–2.2x | Loss: Save 10–25% (User loses 75-90% of base loss)
    return {
      multiplier: isWin
        ? 1.5 + Math.random() * 0.7
        : 0.1 + Math.random() * 0.15,
      tier: 'COMMON'
    }
  }
  if (roll < rareThreshold) {
    // RARE: Win 2.2–3.2x | Loss: Save 25–50% (User loses 50-75% of base loss)
    return {
      multiplier: isWin
        ? 2.2 + Math.random() * 1.0
        : 0.25 + Math.random() * 0.25,
      tier: 'RARE'
    }
  }
  if (roll < epicThreshold) {
    // EPIC: Win 3.2–4.2x | Loss: Save 60–90% (User loses 10-40% of base loss)
    return {
      multiplier: isWin ? 3.2 + Math.random() * 1.0 : 0.6 + Math.random() * 0.3,
      tier: 'EPIC'
    }
  }
  if (roll < legendaryThreshold) {
    // LEGENDARY: Win 5.0x | Loss: Save 100% (User loses 0)
    return {
      multiplier: isWin ? 5.0 : 1.0,
      tier: 'LEGENDARY'
    }
  }
  // MYTHICAL: Win 7x | Loss: Save 100%, primarily via Architect's Keystone
  return {
    multiplier: isWin ? MYTHICAL_MULTIPLIER : 1.0,
    tier: 'MYTHICAL'
  }
}

export const resolvePrediction = async (
  gameId: string,
  winnerName: string,
  broadcast: (event: string, data: string) => void
): Promise<void> => {
  let predictions
  try {
    // JOIN fetches balance, bet count, relic state, and match players in one query to avoid N+1 calls per bettor
    predictions = await pool.query(
      `SELECT
        p.*,
        u.nickname,
        u.points AS current_points,
        u.bonus_pity_count,
        u.current_win_streak,
        u.equipped_relic,
        r.counter AS relic_counter,
        (SELECT COUNT(*) FROM predictions WHERE user_id = p.user_id) AS total_bets,
        m.player_a_name,
        m.player_b_name
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        JOIN matches m ON p.game_id = m.game_id
        LEFT JOIN relics r ON (r.user_id = u.user_id AND r.relic_key = u.equipped_relic)
        WHERE p.game_id = $1 AND p.result IS NULL`,
      [gameId]
    )
  } catch (err) {
    logger.error('resolvePrediction: failed to fetch predictions', err, {
      gameId
    })
    return
  }

  for (const row of predictions.rows) {
    try {
      const flashEvent = getFlashEventForUser(row.user_id)
      const flashEventType = flashEvent?.type ?? null
      const flashActive = !!flashEvent
      const snapshotRelic = flashEvent?.snapshotRelic ?? null

      const oracleUsed = await hasUserUsedOracle(row.user_id)
      let oracleRigged = false
      let defiedOracle = false

      if (!oracleUsed) {
        const oracleState = getOracleState()
        const oracleWinnerName =
          oracleState.side === 'left' ? row.player_a_name : row.player_b_name
        if (row.pick === oracleWinnerName) {
          oracleRigged = true
        } else {
          defiedOracle = true
        }
      }

      const activeFestival = getActiveFestival()
      const sanguineActive = activeFestival?.type === 'SANGUINE'
      const feverActive = activeFestival?.type === 'FEVER'

      const result = oracleRigged
        ? 'WIN'
        : defiedOracle
          ? 'LOSE'
          : sanguineActive || flashActive
            ? 'WIN'
            : row.pick === winnerName
              ? 'WIN'
              : 'LOSE'
      const isWin = result === 'WIN'

      const currentPoints = BigInt(row.current_points)
      const bet = BigInt(row.bet_amount)
      const totalBets = Number(row.total_bets)
      const currentPity = Number(row.bonus_pity_count)
      const isNaturalPityHit = currentPity >= 3

      // Relic state
      const equippedRelic = row.equipped_relic as string | null
      let cycleCounter = Number(row.relic_counter ?? 0)

      const betAgainstOracle = Boolean(row.bet_against_oracle)

      const resonanceActive = activeFestival?.type === 'RESONANCE'

      let bonus = rollBonus(
        isWin,
        resonanceActive ? 3 : totalBets <= 3 ? 3 : currentPity,
        currentPoints,
        row.user_id,
        flashEventType,
        equippedRelic
      )

      // Resonance cap: clamp to RARE max
      const effectiveBonus =
        resonanceActive && bonus
          ? bonus.tier === 'EPIC' || bonus.tier === 'LEGENDARY'
            ? {
                multiplier: isWin
                  ? 2.2 + Math.random() * 1.0
                  : 0.25 + Math.random() * 0.25,
                tier: 'RARE'
              }
            : bonus
          : bonus

      // LOGIC GATE: every 20 wins → guaranteed Legendary, wins counted while relic is equipped
      let logicGateFired = false
      if (equippedRelic === 'logic_gate' && isWin) {
        cycleCounter++
        if (cycleCounter % 20 === 0) {
          bonus = { multiplier: 5.0, tier: 'LEGENDARY' }
          logicGateFired = true
        }
        await pool.query(
          'UPDATE relics SET counter = $1 WHERE user_id = $2 AND relic_key = $3',
          [cycleCounter, row.user_id, 'logic_gate']
        )
      }

      // ARCHITECTS KEYSTONE: auto-upgrade bonus tier
      if (equippedRelic === 'architects_keystone' && bonus) {
        const upgraded = TIER_UPGRADE[bonus.tier]
        if (upgraded) {
          bonus = {
            multiplier:
              upgraded === 'MYTHICAL' ? MYTHICAL_MULTIPLIER : bonus.multiplier,
            tier: upgraded
          }
        }
      }

      // KINETIC CAPACITOR: every 30 wins → +x2 after all other multipliers, wins counted while relic is equipped
      let kineticFired = false
      if (equippedRelic === 'kinetic_capacitor' && isWin && !logicGateFired) {
        cycleCounter++
        if (cycleCounter % 30 === 0) kineticFired = true
        await pool.query(
          'UPDATE relics SET counter = $1 WHERE user_id = $2 AND relic_key = $3',
          [cycleCounter, row.user_id, 'kinetic_capacitor']
        )
      }

      // BUFFER MODULE: every 15 matches → streak shield on next loss, matches counted while relic is equipped
      let streakShielded = false
      if (equippedRelic === 'buffer_module') {
        cycleCounter++
        if (!isWin && cycleCounter % 15 === 0) streakShielded = true
        await pool.query(
          'UPDATE relics SET counter = $1 WHERE user_id = $2 AND relic_key = $3',
          [cycleCounter, row.user_id, 'buffer_module']
        )
      }

      const streakAfter = isWin
        ? Number(row.current_win_streak) + 1
        : feverActive || streakShielded
          ? Number(row.current_win_streak)
          : 0

      const streakMult =
        streakAfter >= 5
          ? 5n
          : streakAfter >= 4
            ? 3n
            : streakAfter >= 3
              ? 2n
              : 1n

      const streakNum = Number(streakMult)
      let flashMult = isWin && flashEvent ? flashEvent.multiplier : 1

      if (isWin && flashEvent) {
        if (snapshotRelic === 'lunar_siphon' && flashEventType === 'LUNAR')
          flashMult += 0.5
        if (
          snapshotRelic === 'static_inductor' &&
          flashEventType === 'ELECTRIC'
        )
          flashMult += 0.5
        if (
          snapshotRelic === 'volcanic_mantle' &&
          flashEventType === 'HELLFIRE'
        )
          flashMult += 0.5
        if (snapshotRelic === 'dealers_hand' && flashEventType === 'CARDS')
          flashMult += 0.3

        if (snapshotRelic === 'overdrive_relay') flashMult += 0.5
      }


      const bonusMultScale = effectiveBonus
        ? BigInt(Math.floor(effectiveBonus.multiplier * 100))
        : 100n
      const flashMultScale =
        isWin && flashEvent ? BigInt(Math.floor(flashMult * 100)) : 100n

      const baseChange = isWin ? bet : bet / 2n

      let gainLoss: bigint

      if (isWin) {
        const afterStreak = baseChange * streakMult
        const afterFlash = (afterStreak * flashMultScale) / 100n
        gainLoss = (afterFlash * bonusMultScale) / 100n
      } else {
        const safeguardActive = activeFestival?.type === 'SAFEGUARD'
        // CONDUCTIVE FILAMENT: reduce loss by 5% on top of any other reduction
        const conductiveReduction =
          equippedRelic === 'conductive_filament' ? 95n : 100n
        const effectiveBase = safeguardActive ? (bet * 40n) / 100n : baseChange
        const effectiveBaseWithRelic =
          (effectiveBase * conductiveReduction) / 100n
        const savedAmount = effectiveBonus
          ? (effectiveBaseWithRelic * bonusMultScale) / 100n
          : 0n
        gainLoss = -(effectiveBaseWithRelic - savedAmount)
      }

      const provisionalPoints = currentPoints + gainLoss
      if (provisionalPoints < POINTS_FLOOR) {
        gainLoss = POINTS_FLOOR - currentPoints
      }

      // Ghost Festival: +20% win echo
      let ghostEchoAmount = 0n
      if (isWin && activeFestival?.type === 'GHOST') {
        ghostEchoAmount = gainLoss / 5n
        gainLoss = gainLoss + ghostEchoAmount
        const provisionalWithEcho = currentPoints + gainLoss
        if (provisionalWithEcho < POINTS_FLOOR) {
          gainLoss = POINTS_FLOOR - currentPoints
          ghostEchoAmount = 0n
        }
      }

      // Surge Festival: 2x global multiplier on wins
      if (isWin && activeFestival?.type === 'SURGE') {
        gainLoss = gainLoss * 2n
        const provisionalWithSurge = currentPoints + gainLoss
        if (provisionalWithSurge < POINTS_FLOOR) {
          gainLoss = POINTS_FLOOR - currentPoints
        }
      }

      // PRISMATIC SHARD: +0.5x (of bet) only if NO flash event active
      if (equippedRelic === 'prismatic_shard' && isWin && !flashActive) {
        gainLoss = gainLoss + bet / 2n
      }

      // KINETIC CAPACITOR fire: applied after all other multipliers
      const preKineticAmount = gainLoss
      if (kineticFired) {
        gainLoss = gainLoss * 2n
      }

      // SOUL OF THE MACHINE: 5% chance → 3x
      let soulProc = false
      const preSoulAmount = gainLoss
      if (equippedRelic === 'soul_of_the_machine' && isWin) {
        if (Math.random() < 0.05) {
          gainLoss = gainLoss * 3n
          soulProc = true
        }
      }

      let flashJustEndedFlag = false
      if (isWin && flashEvent) {
        flashJustEndedFlag = consumeFlashBetForUser(row.user_id)
      }
      if (oracleRigged || defiedOracle) {
        await consumeOracleForUser(row.user_id)
      }

      let finalCombinedMult = Math.round(
        streakNum * flashMult * (effectiveBonus ? effectiveBonus.multiplier : 1)
      )
      const festivalType = activeFestival?.type ?? null
      const festivalMultValue = isWin && festivalType === 'SURGE' ? 3 : 1

      if (isWin) {
        if (activeFestival?.type === 'SURGE') finalCombinedMult *= 3
        if (kineticFired) finalCombinedMult *= 2
        if (soulProc) finalCombinedMult *= 3
      }

      const baseFinalPure = isWin
        ? (baseChange * BigInt(streakNum) * flashMultScale) / 100n
        : baseChange

      const bonusDisplayAmount = effectiveBonus
        ? isWin
          ? gainLoss - baseFinalPure
          : baseFinalPure + gainLoss
        : 0n

      const savedFlashType = flashJustEndedFlag ? null : flashEventType
      if (savedFlashType) {
        recordSessionFlashType(row.user_id, savedFlashType)
      }
      await pool.query(
        `UPDATE predictions
            SET result = $1,
              gain_loss = $2,
              bonus_tier = $3,
              bonus_multiplier = $4,
              flash_event_type = $7,
              flash_multiplier = $8,
              streak_multiplier = $9,
              relic_multiplier = $10,
              total_multiplier = $11,
              festival_multiplier = $12,
              festival_type = $13
            WHERE user_id = $5 AND game_id = $6`,
        [
          result,
          gainLoss.toString(),
          effectiveBonus ? effectiveBonus.tier : null,
          effectiveBonus ? effectiveBonus.multiplier : 1,
          row.user_id,
          row.game_id,
          savedFlashType,
          flashJustEndedFlag ? 1 : flashMult,
          Number(streakNum),
          soulProc ? 3 : kineticFired ? 2 : 1,
          finalCombinedMult,
          festivalMultValue,
          festivalType
        ]
      )

      await pool.query(
        `UPDATE users
          SET points                    = points + $1,
              peak_points               = GREATEST(peak_points, points + $1),
              all_time_peak             = GREATEST(all_time_peak, points + $1),
              daily_peak                = GREATEST(daily_peak,  points + $1),
              weekly_peak               = GREATEST(weekly_peak, points + $1),
              bonus_pity_count          = $3,
              total_volume              = total_volume + $4,
              festivals_participated = festivals_participated + CASE WHEN $13 THEN 1 ELSE 0 END,
              biggest_win               = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_win, $1) ELSE biggest_win END,
              biggest_single_win        = CASE WHEN $5 = 'WIN' THEN GREATEST(biggest_single_win, $1) ELSE biggest_single_win END,
              current_win_streak        = CASE WHEN $5 = 'WIN' THEN current_win_streak + 1 WHEN $8 THEN current_win_streak ELSE 0 END,
              max_win_streak            = CASE
                                            WHEN $5 = 'WIN' AND (current_win_streak + 1) > max_win_streak
                                            THEN current_win_streak + 1
                                            ELSE max_win_streak
                                          END,
              consecutive_flash_streak = CASE 
                WHEN $14 THEN consecutive_flash_streak + 1 
                ELSE 0 
              END,
              consecutive_flash_peak = CASE 
                WHEN $14 THEN GREATEST(consecutive_flash_peak, consecutive_flash_streak + 1)
                ELSE consecutive_flash_peak 
              END,
              total_pities_earned       = total_pities_earned + $6,
              total_flash_events_caught = CASE WHEN $7::text IS NOT NULL AND $5 = 'WIN' THEN total_flash_events_caught + 1 ELSE total_flash_events_caught END,
              wins                      = CASE WHEN $5 = 'WIN' THEN wins + 1 ELSE wins END,
              losses                    = CASE WHEN $5 = 'LOSE' THEN losses + 1 ELSE losses END,
              lunar_events_caught       = CASE WHEN $7 = 'LUNAR'    AND $5 = 'WIN' THEN lunar_events_caught    + 1 ELSE lunar_events_caught    END,
              electric_events_caught    = CASE WHEN $7 = 'ELECTRIC' AND $5 = 'WIN' THEN electric_events_caught + 1 ELSE electric_events_caught END,
              hellfire_events_caught    = CASE WHEN $7 = 'HELLFIRE' AND $5 = 'WIN' THEN hellfire_events_caught + 1 ELSE hellfire_events_caught END,
              cards_events_caught       = CASE WHEN $7 = 'CARDS'    AND $5 = 'WIN' THEN cards_events_caught    + 1 ELSE cards_events_caught    END,
              biggest_match_mult        = GREATEST(biggest_match_mult, $9),
              bet_against_oracle_count  = CASE WHEN $10 THEN bet_against_oracle_count + 1 ELSE bet_against_oracle_count END,
              oracle_streak             = CASE WHEN $11 THEN oracle_streak + 1 WHEN $12 THEN 0 ELSE oracle_streak END,
              oracle_max_streak         = CASE WHEN $11 THEN GREATEST(oracle_max_streak, oracle_streak + 1) ELSE oracle_max_streak END
          WHERE user_id = $2`,
        [
          gainLoss.toString(),
          row.user_id,
          effectiveBonus ? 0 : currentPity + 1,
          bet.toString(),
          result,
          isNaturalPityHit ? 1 : 0,
          savedFlashType,
          feverActive || streakShielded,
          finalCombinedMult,
          betAgainstOracle,
          oracleRigged,
          defiedOracle,
          activeFestival !== null,
          flashJustEndedFlag
        ]
      )

      // Achievement check
      const freshUser = await pool.query(
        `SELECT wins, max_win_streak, laps, points,
                biggest_match_mult, total_pities_earned,
                lunar_events_caught, electric_events_caught,
                hellfire_events_caught, cards_events_caught,
                bet_against_oracle_count, oracle_max_streak,
                festivals_triggered, festivals_participated, consecutive_flash_peak, has_used_auto_bet  
          FROM users WHERE user_id = $1`,
        [row.user_id]
      )
      const u = freshUser.rows[0]

      const earnedRes = await pool.query(
        `SELECT achievement_code FROM user_achievements WHERE user_id = $1`,
        [row.user_id]
      )
      const alreadyEarned = new Set<string>(
        earnedRes.rows.map(
          (r: { achievement_code: string }) => r.achievement_code
        )
      )

      // Count relics for achievement check
      const relicCountRes = await pool.query(
        'SELECT relic_key, rarity FROM relics WHERE user_id = $1',
        [row.user_id]
      )
      const userRelicKeys = new Set(relicCountRes.rows.map((r) => r.relic_key))
      const mythCount = relicCountRes.rows.filter(
        (r) => r.rarity === 'MYTHICAL'
      ).length
      const commonRareEpicCount = relicCountRes.rows.filter((r) =>
        ['COMMON', 'RARE', 'EPIC'].includes(r.rarity)
      ).length

      const stats: AchievementStats = {
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
        festivalsTriggered: Number(u.festivals_triggered),
        festivalsParticipated: Number(u.festivals_participated),
        uniqueRelicsOwned: userRelicKeys.size,
        allRelicsOwned: userRelicKeys.size >= RELICS.length,
        allCommonRareEpicRelics: commonRareEpicCount >= 11,
        allMythicalRelics: mythCount >= 3,
        biggestMultiplierTier: null,
        totalAchievementsEarned: alreadyEarned.size,
        hadMythicRelicSlam: soulProc,
        maxConsecutiveFlashEvents: Number(u.consecutive_flash_peak),
        hasSeenAllFlashTypes: hasSeenAllFlashTypes(row.user_id),
        hasUsedAutoBet: Boolean(u.has_used_auto_bet)
      }

      const firstPass = checkAchievements(stats, alreadyEarned)
      const projectedTotal = alreadyEarned.size + firstPass.length

      const statsPass2 = {
        ...stats,
        totalAchievementsEarned: projectedTotal
      }

      const collectorPass = checkAchievements(
        statsPass2,
        new Set([...alreadyEarned, ...firstPass.map((a) => a.code)])
      )
      const newAchievements = [...firstPass, ...collectorPass]

      if (newAchievements.length > 0) {
        const placeholders = newAchievements
          .map((_, i) => `($1, $${i + 2}, ${Date.now()})`)
          .join(', ')

        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_code, earned_at)
            VALUES ${placeholders}
            ON CONFLICT DO NOTHING`,
          [row.user_id, ...newAchievements.map((a) => a.code)]
        )

        await pool.query(
          `UPDATE users SET total_achievements = total_achievements + $1 WHERE user_id = $2`,
          [newAchievements.length, row.user_id]
        )

        for (const achievement of newAchievements) {
          broadcast(
            'achievement_unlocked',
            JSON.stringify({
              userId: row.user_id,
              code: achievement.code,
              name: achievement.name,
              icon: achievement.icon,
              rarity: achievement.rarity,
              category: achievement.category
            })
          )
        }
      }

      // Relic drop roll
      const droppedRelic = await rollRelicDrop(
        row.user_id,
        equippedRelic,
        Number(u.laps)
      )

      broadcast(
        'prediction_result',
        JSON.stringify({
          userId: row.user_id,
          nickname: row.nickname,
          result,
          gameId,
          amount: gainLoss > 0n ? gainLoss.toString() : (-gainLoss).toString(),
          bonus: effectiveBonus
            ? {
                amount:
                  bonusDisplayAmount > 0n ? bonusDisplayAmount.toString() : '0',
                tier: effectiveBonus.tier,
                visualMultiplier: Math.floor(effectiveBonus.multiplier * 100)
              }
            : null,
          wasAllIn: bet === currentPoints,
          streakAfter,
          streakMult: streakNum,
          flashEventType: savedFlashType,
          flashMult: flashJustEndedFlag ? 1 : flashMult,
          oracleRigged,
          ghostEchoAmount:
            ghostEchoAmount > 0n ? ghostEchoAmount.toString() : null,
          relicCounter: cycleCounter,
          relicDrop: droppedRelic ?? null,
          soulProc,
          kineticFired,
          preSoulAmount: soulProc
            ? preSoulAmount.toString()
            : kineticFired
              ? preKineticAmount.toString()
              : null
        })
      )

      tryTriggerFlashEventForUser(row.user_id, broadcast)
      // Festival trigger check, runs after flash trigger to avoid double-lockout race
      checkAndTriggerFestival(
        row.user_id,
        row.nickname ?? 'Anonymous',
        {
          isWin,
          bonusTier: effectiveBonus?.tier ?? null,
          bonusMult: effectiveBonus?.multiplier ?? 1,
          flashActive,
          flashJustEnded: flashJustEndedFlag,
          winStreakAfter: streakAfter,
          totalMultiplier: finalCombinedMult
        },
        broadcast
      )
    } catch (err) {
      logger.errorWithPoints('resolvePrediction: failed for user', err, {
        userId: row.user_id,
        gameId,
        points: BigInt(row.current_points),
        betAmount: BigInt(row.bet_amount)
      })
    }
  }
}

export const getPaginatedUserPredictions = async (
  userId: string,
  page: number,
  limit: number,
  sort: 'recent' | 'wins' | 'multipliers' = 'recent'
) => {
  const offset = (page - 1) * limit
  // Build separate queries per sort mode to avoid dynamic SQL injection issues
  let dataQuery: string
  let countQuery: string
  const baseParams = [userId, limit, offset]
  const countParams = [userId]

  const pCols = `
    p.id, p.game_id AS "gameId", p.pick, p.bet_amount AS "betAmount", 
    p.gain_loss AS "gainLoss", p.result, p.bonus_tier AS "bonusTier", 
    p.bonus_multiplier AS "bonusMultiplier", p.flash_event_type AS "flashEventType", 
    p.flash_multiplier AS "flashMult", p.streak_multiplier AS "streakMultiplier", 
    p.created_at AS "createdAt", p.relic_multiplier AS "relicMultiplier",
    p.total_multiplier AS "totalMultiplier",
    p.festival_multiplier AS "festivalMultiplier",
    p.festival_type AS "festivalType"`

  if (sort === 'wins') {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN'
      ORDER BY p.gain_loss DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN'`
  } else if (sort === 'multipliers') {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result = 'WIN' AND (p.bonus_multiplier > 0 OR p.flash_multiplier > 1 OR p.festival_multiplier > 1)
      ORDER BY p.total_multiplier DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result = 'WIN' AND (bonus_multiplier > 0 OR flash_multiplier > 1 OR festival_multiplier > 1)`
  } else {
    dataQuery = `
      SELECT ${pCols}, m.player_a_name, m.player_a_played, m.player_b_name, m.player_b_played, m.time, m.type
      FROM predictions p
      LEFT JOIN matches m ON p.game_id = m.game_id
      WHERE p.user_id = $1 AND p.result IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`
    countQuery = `SELECT COUNT(*) FROM predictions WHERE user_id = $1 AND result IS NOT NULL`
  }

  const [data, count] = await Promise.all([
    pool.query(dataQuery, baseParams),
    pool.query(countQuery, countParams)
  ])

  const total = Number(count.rows[0].count)

  const matches = data.rows.map((row) => ({
    gameId: row.gameId,
    time: Number(row.time),
    type: row.type || 'GAME_RESULT',
    playerA: {
      name: row.player_a_name || 'Unknown',
      played: row.player_a_played || 'ROCK'
    },
    playerB: {
      name: row.player_b_name || 'Unknown',
      played: row.player_b_played || 'SCISSORS'
    }
  }))

  const predictions = data.rows.map((row) => ({
    id: row.id,
    gameId: row.gameId,
    pick: row.pick,
    betAmount: row.betAmount?.toString() ?? '0',
    gainLoss: row.gainLoss?.toString() ?? '0',
    result: row.result,
    bonusTier: row.bonusTier ?? null,
    bonusMultiplier: Number(row.bonusMultiplier ?? 0),
    flashEventType: row.flashEventType ?? null,
    flashMult: Number(row.flashMult ?? 1),
    streakMultiplier: Number(row.streakMultiplier ?? 1),
    createdAt: Number(row.createdAt),
    relicMultiplier: Number(row.relicMultiplier ?? 1),
    totalMultiplier: Number(row.totalMultiplier || row.total_multiplier || 1),
    festivalMultiplier: Number(row.festivalMultiplier || 1),
    festivalType: row.festivalType || null
  }))

  return { matches, predictions, total, hasMore: offset + limit < total }
}

export const getUserStats = async (userId: string, shortId: string) => {
  await getOrCreateUser(userId, shortId)

  const result = await pool.query(
    `SELECT
        u.points,
        u.peak_points,
        u.daily_peak,
        u.weekly_peak,
        u.total_volume,
        u.biggest_win,
        u.current_win_streak,
        u.max_win_streak,
        u.bonus_pity_count,
        u.total_pities_earned,
        u.joined_date,
        u.wins,
        u.losses,
        COALESCE(p_stats.total_gain, 0) as total_gain
      FROM users u
      LEFT JOIN (
        SELECT
            user_id,
            SUM(gain_loss) FILTER (WHERE gain_loss > 0) AS total_gain
        FROM predictions
        WHERE result IS NOT NULL
        GROUP BY user_id
      ) p_stats ON u.user_id = p_stats.user_id
      WHERE u.user_id = $1`,
    [userId]
  )

  const row = result.rows[0]

  if (!row) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalGain: '0',
      points: '200000',
      peakPoints: '200000',
      dailyPeak: '100000',
      weeklyPeak: '100000',
      totalVolume: '0',
      biggestWin: '0',
      currentWinStreak: 0,
      maxWinStreak: 0,
      bonusPityCount: 0,
      totalPitiesEarned: 0,
      joinedDate: Date.now().toString(),
      avgReturn: '0'
    }
  }

  const wins = Number(row.wins || 0)
  const losses = Number(row.losses || 0)
  const total = wins + losses
  const totalGain = row.total_gain.toString()

  return {
    total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    totalGain,
    points: row.points.toString(),
    peakPoints: row.peak_points.toString(),
    dailyPeak: row.daily_peak.toString(),
    weeklyPeak: row.weekly_peak.toString(),
    totalVolume: row.total_volume.toString(),
    biggestWin: row.biggest_win.toString(),
    currentWinStreak: Number(row.current_win_streak),
    maxWinStreak: Number(row.max_win_streak),
    bonusPityCount: Number(row.bonus_pity_count),
    totalPitiesEarned: Number(row.total_pities_earned || 0),
    joinedDate: row.joined_date.toString(),
    avgReturn: total > 0 ? (BigInt(totalGain) / BigInt(total)).toString() : '0'
  }
}

export const getGlobalBettingStats = async () => {
  const result = await pool.query(
    `SELECT
        COUNT(*) AS total_bets,
        COALESCE(SUM(bet_amount), 0) AS total_volume,
        COUNT(*) FILTER (WHERE result = 'WIN') AS winning_bets
      FROM predictions`
  )
  const row = result.rows[0]
  return {
    total_bets: Number(row.total_bets),
    total_volume: row.total_volume.toString(),
    winning_bets: Number(row.winning_bets)
  }
}
