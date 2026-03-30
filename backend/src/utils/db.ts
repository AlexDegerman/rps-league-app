import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.RPS_API_BASE,
  ssl: { rejectUnauthorized: false }
})

export default pool
