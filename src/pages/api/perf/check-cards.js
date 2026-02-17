import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

export default async function handler(req, res) {
  try {
    const cards = await pool.query('SELECT id, name FROM cards ORDER BY id')
    const banks = await pool.query('SELECT id, name FROM banks ORDER BY id')
    
    await pool.end()
    
    res.status(200).json({
      cards: cards.rows,
      banks: banks.rows,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
