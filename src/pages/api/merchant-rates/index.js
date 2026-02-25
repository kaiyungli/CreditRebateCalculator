import { getMerchantRates } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  try {
    const categoryId = req.query.category_id ? Number(req.query.category_id) : null
    const cardIds = req.query.card_ids ? String(req.query.card_ids).split(',').map(n => Number(n)) : []
    
    const rows = await getMerchantRates(cardIds.length > 0 ? cardIds : [], categoryId)
    
    res.status(200).json({ 
      merchantRates: rows, 
      count: rows.length, 
      source: 'supabase' 
    })
  } catch (error) {
    console.error('Error fetching merchant rates:', error)
    return res.status(500).json({ error: error.message })
  }
}
