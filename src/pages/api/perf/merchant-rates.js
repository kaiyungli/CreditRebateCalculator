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
    // Test: reward_rules query (new schema)
    const t1 = process.hrtime()
    const rows = await pool.query(`
      SELECT 
        rr.id AS rule_id,
        rr.category_id,
        c.id AS card_id,
        c.name AS card_name,
        c.reward_program,
        m.id AS merchant_id,
        m.name AS merchant_name,
        m.merchant_key,
        rr.rate_value,
        rr.rate_unit
      FROM reward_rules rr
      JOIN merchants m ON m.id = rr.merchant_id
      JOIN cards c ON c.id = rr.card_id
      WHERE rr.status = 'ACTIVE'
        AND rr.merchant_id IS NOT NULL
      ORDER BY m.name, c.name
      LIMIT 100
    `)
    const queryMs = Math.round(ms(t1))
    
    const totalMs = Math.round(ms(t0))
    
    // Group by merchant (simulate what API does)
    const t2 = process.hrtime()
    const merchantRates = {}
    rows.rows.forEach(row => {
      if (!merchantRates[row.merchant_name]) {
        merchantRates[row.merchant_name] = { 
          merchant_name: row.merchant_name, 
          merchant_key: row.merchant_key,
          cards: [] 
        }
      }
      merchantRates[row.merchant_name].cards.push({ 
        card_name: row.card_name,
        reward_program: row.reward_program,
        rate_value: row.rate_value
      })
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
