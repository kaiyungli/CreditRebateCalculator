import { getMerchantRates, getCards, getBanks, DEMO_MERCHANT_RATES, DEMO_CARDS, DEMO_BANKS } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' })
  }

  const { search, category_id, limit } = req.query

  try {
    // Get all merchant rates with card and bank info
    const rates = await getCards()
    const banks = DEMO_BANKS
    
    // Build card map with bank names
    const cardMap = {}
    for (const card of DEMO_CARDS) {
      const bank = DEMO_BANKS.find(b => b.id === card.bank_id)
      cardMap[card.id] = {
        ...card,
        bank_name: bank?.name || ''
      }
    }

    // Filter merchant_rates data (using demo data structure)
    let merchantRates = DEMO_MERCHANT_RATES.filter(r => r.status === 'ACTIVE')
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      merchantRates = merchantRates.filter(r => 
        r.merchant_name?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (category_id) {
      merchantRates = merchantRates.filter(r => r.category_id === parseInt(category_id))
    }

    // Group by merchant name
    const merchantMap = {}
    for (const rate of merchantRates) {
      const merchantName = rate.merchant_name
      if (!merchantMap[merchantName]) {
        merchantMap[merchantName] = {
          merchant_name: merchantName,
          category_id: rate.category_id,
          rates: []
        }
      }
      
      const card = cardMap[rate.card_id]
      if (card) {
        merchantMap[merchantName].rates.push({
          card_id: rate.card_id,
          card_name: card.name,
          bank_name: card.bank_name,
          rebate_rate: rate.rebate_rate,
          rebate_type: rate.rebate_type,
          conditions: rate.conditions
        })
      }
    }

    // Sort by merchant name and limit results
    let merchants = Object.values(merchantMap).sort((a, b) => 
      a.merchant_name.localeCompare(b.merchant_name, 'zh-HK')
    )

    if (limit) {
      merchants = merchants.slice(0, parseInt(limit))
    }

    // For each merchant, find the best card
    const result = merchants.map(m => {
      // Sort rates by rebate rate (highest first)
      const sortedRates = [...m.rates].sort((a, b) => b.rebate_rate - a.rebate_rate)
      
      return {
        merchant_name: m.merchant_name,
        category_id: m.category_id,
        all_rates: sortedRates,
        best_rate: sortedRates[0] || null
      }
    })

    return res.status(200).json({ 
      merchants: result, 
      count: result.length 
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return res.status(500).json({ error: error.message })
  }
}
