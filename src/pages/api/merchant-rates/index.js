import { getMerchantRates } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  try {
    const { category_id, card_ids } = req.query
    
    // Parse card_ids if provided
    const cardIds = card_ids 
      ? card_ids.split(',').map(id => parseInt(id.trim())) 
      : []
    
    const merchantRates = await getMerchantRates(cardIds, category_id ? Number(category_id) : null)
    return res.status(200).json({ 
      merchantRates, 
      count: merchantRates.length,
      source: 'reward_rules',
    })
  } catch (error) {
    console.error('Error fetching merchant rates:', error)
    return res.status(500).json({ error: error.message })
  }
}
