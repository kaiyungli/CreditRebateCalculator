// API: Get merchants with rebate rates
// Uses new schema: merchants, reward_rules
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
    return res.status(405).json({ error: 'GET only' })
  }

  const { search, category_id, limit } = req.query

  try {
    // Get merchants
    let merchQuery = supabase
      .from('merchants')
      .select('*')
      .eq('status', 'ACTIVE')
    
    if (search) {
      merchQuery = merchQuery.ilike('name', `%${search}%`)
    }
    
    const { data: merchants, error: merchError } = await merchQuery
    if (merchError) throw merchError
    
    // Get reward rules with card info
    const { data: rules, error: rulesError } = await supabase
      .from('reward_rules')
      .select('*, cards(name, banks(name))')
      .eq('status', 'ACTIVE')
    
    if (rulesError) throw rulesError
    
    // Build rules by merchant and category
    const rulesByMerchant = {}
    const rulesByCategory = {}
    
    for (const rule of (rules || [])) {
      const ruleData = {
        card_id: rule.card_id,
        card_name: rule.cards?.name || 'Unknown',
        bank_name: rule.cards?.banks?.name || 'Unknown',
        rebate_rate: rule.rate_value,
        rebate_type: rule.reward_kind,
        rate_unit: rule.rate_unit
      }
      
      if (rule.merchant_id) {
        if (!rulesByMerchant[rule.merchant_id]) rulesByMerchant[rule.merchant_id] = []
        rulesByMerchant[rule.merchant_id].push(ruleData)
      }
      
      if (rule.category_id) {
        if (!rulesByCategory[rule.category_id]) rulesByCategory[rule.category_id] = []
        rulesByCategory[rule.category_id].push(ruleData)
      }
    }
    
    // Build result
    let result = (merchants || []).map(m => {
      const merchantRules = rulesByMerchant[m.id] || []
      const categoryRules = rulesByCategory[m.default_category_id] || []
      
      // Merge, dedupe by card
      const allRates = [...merchantRules]
      const seenCards = new Set(allRates.map(r => r.card_id))
      for (const r of categoryRules) {
        if (!seenCards.has(r.card_id)) {
          allRates.push(r)
          seenCards.add(r.card_id)
        }
      }
      
      // Sort by rate
      const sortedRates = [...allRates].sort((a, b) => b.rebate_rate - a.rebate_rate)
      
      return {
        merchant_name: m.name,
        merchant_key: m.merchant_key,
        category_id: m.default_category_id,
        all_rates: sortedRates,
        best_rate: sortedRates[0] || null
      }
    })
    
    // Category filter
    if (category_id) {
      result = result.filter(m => m.category_id === parseInt(category_id))
    }
    
    // Sort by name
    result.sort((a, b) => a.merchant_name.localeCompare(b.merchant_name, 'zh-HK'))
    
    // Limit
    if (limit) {
      result = result.slice(0, parseInt(limit))
    }

    return res.status(200).json({ 
      merchants: result, 
      count: result.length 
    })
  } catch (error) {
    console.error('Error fetching merchants:', error)
    return res.status(500).json({ error: error.message })
  }
}
