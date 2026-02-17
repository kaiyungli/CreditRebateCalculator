import { getMerchantRates } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  try {
    const category_id = req.query.category_id ? Number(req.query.category_id) : undefined
    const merchantRates = await getMerchantRates({ category_id })
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
