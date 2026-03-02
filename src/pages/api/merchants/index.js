// API: Get merchants with rebate rates from Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_')) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { search, category } = req.query
    
    // Get merchant rates from Supabase
    let query = supabase
      .from('merchant_rates')
      .select('*, cards(name, bank_id, banks(name))')
      .eq('status', 'ACTIVE')
    
    if (category) {
      query = query.eq('category_id', parseInt(category))
    }
    
    const { data: rates, error } = await query
    
    if (error) throw error
    
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
        card_name: rate.cards?.name || 'Unknown',
        bank: rate.cards?.banks?.name || 'Unknown',
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
    
    // Sort by max rate (high to low)
    merchants.sort((a, b) => {
      const maxRateA = Math.max(...a.rates.map(r => parseFloat(r.rate || 0)))
      const maxRateB = Math.max(...b.rates.map(r => parseFloat(r.rate || 0)))
      return maxRateB - maxRateA
    })
    
    res.status(200).json({ 
      merchants,
      count: merchants.length,
      source: 'supabase'
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    res.status(500).json({ error: error.message })
  }
}
