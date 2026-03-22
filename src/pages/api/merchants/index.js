// API: Get merchants with rebate rates from Supabase
// Uses new schema: merchants, reward_rules, merchant_offers
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Supabase not configured for server')
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { search, category } = req.query
    
    // Get merchants from Supabase
    let merchantsQuery = supabase
      .from('merchants')
      .select('*')
      .eq('status', 'ACTIVE')
    
    if (category) {
      merchantsQuery = merchantsQuery.eq('default_category_id', parseInt(category))
    }
    
    const { data: merchants, error: merchError } = await merchantsQuery
    
    if (merchError) throw merchError
    
    // Get reward rules
    const { data: rules, error: rulesError } = await supabase
      .from('reward_rules')
      .select('*, cards(name, bank_id, banks(name))')
      .eq('status', 'ACTIVE')
    
    if (rulesError) throw rulesError
    
    // Build merchant -> rates mapping
    const rulesByMerchant = {}
    const rulesByCategory = {}
    
    for (const rule of (rules || [])) {
      if (rule.merchant_id) {
        if (!rulesByMerchant[rule.merchant_id]) rulesByMerchant[rule.merchant_id] = []
        rulesByMerchant[rule.merchant_id].push({
          card_id: rule.card_id,
          card_name: rule.cards?.name || 'Unknown',
          bank: rule.cards?.banks?.name || 'Unknown',
          rate: rule.rate_value,
          rate_type: rule.reward_kind,
          rate_unit: rule.rate_unit
        })
      }
      if (rule.category_id) {
        if (!rulesByCategory[rule.category_id]) rulesByCategory[rule.category_id] = []
        rulesByCategory[rule.category_id].push({
          card_id: rule.card_id,
          card_name: rule.cards?.name || 'Unknown',
          bank: rule.cards?.banks?.name || 'Unknown',
          rate: rule.rate_value,
          rate_type: rule.reward_kind,
          rate_unit: rule.rate_unit
        })
      }
    }
    
    // Build response
    const result = (merchants || []).map(m => {
      const merchantRules = rulesByMerchant[m.id] || []
      const categoryRules = rulesByCategory[m.default_category_id] || []
      const allRates = [...merchantRules, ...categoryRules]
      
      // Dedupe by card
      const uniqueRates = []
      const seenCards = new Set()
      for (const r of allRates) {
        if (!seenCards.has(r.card_id)) {
          seenCards.add(r.card_id)
          uniqueRates.push(r)
        }
      }
      
      return {
        id: m.id,
        name: m.name,
        merchant_key: m.merchant_key,
        category_id: m.default_category_id,
        rates: uniqueRates
      }
    })
    
    // Filter by search
    let filtered = result
    if (search) {
      filtered = result.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Sort by max rate
    filtered.sort((a, b) => {
      const maxRateA = Math.max(...a.rates.map(r => parseFloat(r.rate || 0)))
      const maxRateB = Math.max(...b.rates.map(r => parseFloat(r.rate || 0)))
      return maxRateB - maxRateA
    })
    
    res.status(200).json({ 
      merchants: filtered,
      count: filtered.length,
      source: 'supabase'
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    res.status(500).json({ error: error.message })
  }
}
