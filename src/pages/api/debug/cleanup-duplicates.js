// Debug: Clean up duplicate merchant rules
import { query, pool } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  try {
    // Delete duplicates (keep lowest ID)
    const deleteResult = await pool.query(`
      DELETE FROM reward_rules 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY merchant_id, card_id, category_id, rate_unit, rate_value 
            ORDER BY id
          ) as rn
          FROM reward_rules 
          WHERE merchant_id IS NOT NULL
        ) t
        WHERE rn > 1
      )
    `)

    // Check remaining duplicates
    const checkResult = await pool.query(`
      SELECT merchant_id, card_id, category_id, rate_unit, rate_value, COUNT(*) as cnt
      FROM reward_rules 
      WHERE merchant_id IS NOT NULL 
      GROUP BY merchant_id, card_id, category_id, rate_unit, rate_value 
      HAVING COUNT(*) > 1
    `)

    return res.status(200).json({
      deleted: deleteResult.rowCount,
      remainingDuplicates: checkResult.rows
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
