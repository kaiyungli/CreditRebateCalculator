import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

export default async function handler(req, res) {
  try {
    // Check total count
    const total = await pool.query('SELECT COUNT(*)::int as n FROM merchant_rates')
    
    // Check by status
    const byStatus = await pool.query(`
      SELECT status, COUNT(*)::int as n 
      FROM merchant_rates 
      GROUP BY status
    `)
    
    // Check sample data (first 10 rows)
    const sample = await pool.query(`
      SELECT mr.*, c.name as card_name
      FROM merchant_rates mr
      LEFT JOIN cards c ON mr.card_id = c.id
      LIMIT 10
    `)
    
    await pool.end()
    
    res.status(200).json({
      totalCount: total.rows[0].n,
      byStatus: byStatus.rows,
      sample: sample.rows,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
