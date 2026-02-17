import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

function ms(t0) {
  const diff = process.hrtime(t0)
  return diff[0] * 1000 + diff[1] / 1e6
}

export default async function handler(req, res) {
  const t0 = process.hrtime()

  try {
    // Test ping
    const t1 = process.hrtime()
    await pool.query('SELECT 1')
    const pingMs = Math.round(ms(t1))

    // Test cards query
    const t2 = process.hrtime()
    const cards = await pool.query('SELECT * FROM cards LIMIT 50')
    const cardsMs = Math.round(ms(t2))

    const totalMs = Math.round(ms(t0))

    res.status(200).json({
      ok: true,
      pingMs,
      cardsMs,
      totalMs,
      cardsCount: cards.rowCount,
    })
  } catch (e) {
    res.status(500).json({
      ok: false,
      totalMs: Math.round(ms(t0)),
      error: e.message,
    })
  }
}
