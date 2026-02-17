// Debug: Delete specific rule
import { query } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' })
  }

  try {
    const { rule_id } = req.body
    
    if (!rule_id) {
      return res.status(400).json({ error: 'rule_id required' })
    }

    const deleteResult = await query(
      'DELETE FROM reward_rules WHERE id = $1 RETURNING *',
      [rule_id]
    )

    return res.status(200).json({
      deleted: deleteResult.rowCount,
      deletedRow: deleteResult.rows[0]
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
