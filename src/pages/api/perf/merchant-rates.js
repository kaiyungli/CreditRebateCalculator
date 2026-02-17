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
    // Test: merchant_rates query
    const t1 = process.hrtime()
    const rows = await pool.query(`
      SELECT 
        mr.merchant_name,
        mr.category_id,
        c.id as card_id,
        c.name as card_name,
        b.name as bank_name,
        mr.rebate_rate,
        mr.rebate_type,
        mr.conditions,
        c.card_type
      FROM merchant_rates mr
      JOIN cards c ON mr.card_id = c.id
      JOIN banks b ON c.bank_id = b.id
      WHERE mr.status = 'ACTIVE'
        AND c.status = 'ACTIVE'
      ORDER BY mr.merchant_name, c.name
      LIMIT 100
    `)
    const queryMs = Math.round(ms(t1))
    
    const totalMs = Math.round(ms(t0))
    
    // Group by merchant (simulate what API does)
    const t2 = process.hrtime()
    const merchantRates = {}
    rows.rows.forEach(row => {
      if (!merchantRates[row.merchant_name]) {
        merchantRates[row.merchant_name] = { merchant_name: row.merchant_name, cards: [] }
      }
      merchantRates[row.merchant_name].cards.push({ card_name: row.card_name })
    })
    const groupMs = Math.round(ms(t2))

    res.status(200).json({
      ok: true,
      queryMs,
      groupMs,
      totalMs,
      rowsCount: rows.rowCount,
      merchantsCount: Object.keys(merchantRates).length,
    })
  } catch (e) {
    res.status(500).json({
      ok: false,
      totalMs: Math.round(ms(t0)),
      error: e.message,
    })
  }
}
