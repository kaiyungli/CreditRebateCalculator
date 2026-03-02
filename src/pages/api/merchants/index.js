// API: Get merchants with rebate rates
import { getMerchantRates } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { search, category } = req.query
    
    // Get all merchant rates
    const rates = await getMerchantRates([], category ? parseInt(category) : null)
    
    // Group by merchant
    const merchantMap = {}
    for (const rate of (rates || [])) {
      if (!merchantMap[rate.merchant_name]) {
        merchantMap[rate.merchant_name] = {
          name: rate.merchant_name,
          category_id: rate.category_id,
          rates: []
        }
      }
      merchantMap[rate.merchant_name].rates.push({
        card_id: rate.card_id,
        card_name: rate.card_name,
        bank_id: rate.bank_id,
        rate: rate.rebate_rate,
        rate_type: rate.rebate_type,
        conditions: rate.conditions
      })
    }
    
    let merchants = Object.values(merchantMap)
    
    // Filter by search
    if (search) {
      merchants = merchants.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    res.status(200).json({ 
      merchants,
      count: merchants.length
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    res.status(500).json({ error: error.message })
  }
}
