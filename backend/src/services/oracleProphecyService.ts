import pool from "../utils/db.js"

type OracleState = {
  side: 'left' | 'right'
  date: string 
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function createFreshOracle(): OracleState {
  return {
    side: Math.random() < 0.5 ? 'left' : 'right',
    date: todayUTC()
  }
}

let oracleState: OracleState = createFreshOracle()

export function getOracleState() {
  if (oracleState.date !== todayUTC()) {
    oracleState = createFreshOracle()
  }
  return oracleState
}

export function resetOracle() {
  oracleState = createFreshOracle()
}

export async function hasUserUsedOracle(userId: string): Promise<boolean> {
  const state = getOracleState()
  const result = await pool.query(
    `SELECT oracle_used_date, joined_date FROM users WHERE user_id = $1`,
    [userId]
  )
  const row = result.rows[0]
  if (!row) return true

  const joinedDateVal = row.joined_date ? Number(row.joined_date) : Date.now()

  const joinedDateMs =
    joinedDateVal < 100000000000 ? joinedDateVal * 1000 : joinedDateVal

  // Oracle Prophecy unlocks from day 2: block if user joined today UTC
  const joinedDateUtc = new Date(joinedDateMs).toISOString().slice(0, 10)
  if (joinedDateUtc === state.date) return true

  return row.oracle_used_date === state.date
}

export async function consumeOracleForUser(userId: string): Promise<void> {
  const state = getOracleState()
  await pool.query(
    `UPDATE users SET oracle_used_date = $1 WHERE user_id = $2`,
    [state.date, userId]
  )
}
