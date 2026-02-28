import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Fallback categories data (when database is unavailable)
export const DEMO_CATEGORIES = [
  { id: 1, name: '餐飲美食', icon: '🍜', parent_id: null, description: '餐廳、咖啡店、外賣', sort_order: 1 },
  { id: 2, name: '網上購物', icon: '🛒', parent_id: null, description: '網上平台購物', sort_order: 2 },
  { id: 3, name: '超市便利店', icon: '🏪', parent_id: null, description: '超市、便利店消費', sort_order: 3 },
  { id: 4, name: '交通出行', icon: '🚗', parent_id: null, description: '交通、燃油、停車', sort_order: 4 },
  { id: 5, name: '娛樂休閒', icon: '🎬', parent_id: null, description: '電影、遊戲、娛樂', sort_order: 5 },
  { id: 6, name: '服飾美容', icon: '👗', parent_id: null, description: '服裝、化妝品、護膚', sort_order: 6 },
  { id: 7, name: '旅遊外遊', icon: '✈️', parent_id: null, description: '機票、酒店、外遊消費', sort_order: 6 },
  { id: 8, name: '水電煤氣', icon: '💡', parent_id: null, description: '公用事業繳費', sort_order: 7 },
  { id: 9, name: '其他消費', icon: '💳', parent_id: null, description: '其他一般消費', sort_order: 8 },
]

export default supabase

export async function getMerchantRates(cardIds = [], categoryId = null) {
  let query = supabase
    .from('merchant_rates')
    .select('*')
    .eq('status', 'ACTIVE')

  if (categoryId != null) {
    query = query.eq('category_id', categoryId)
  }

  if (Array.isArray(cardIds) && cardIds.length > 0) {
    query = query.in('card_id', cardIds)
  }

  const { data, error } = await query
  
  if (error) throw error

  // Get card details separately
  const cardIdsNeeded = [...new Set(data.map(r => r.card_id))]
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, bank_id, card_type')
    .in('id', cardIdsNeeded)

  // Join card data to merchant rates
  const cardMap = {}
  for (const c of (cards || [])) {
    cardMap[c.id] = c
  }

  const result = data.map(r => ({
    ...r,
    card_name: cardMap[r.card_id]?.name,
    bank_id: cardMap[r.card_id]?.bank_id,
    card_type: cardMap[r.card_id]?.card_type
  }))
  
  return result
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    
    // If we got valid data, return it
    if (data && data.length > 0) {
      return data
    }
    
    // Empty result - use fallback
    console.log('[getCategories] Empty DB result, using DEMO_CATEGORIES fallback')
    return DEMO_CATEGORIES
    
  } catch (error) {
    // Database unavailable or error - use fallback
    console.warn('[getCategories] DB error, using DEMO_CATEGORIES fallback:', error.message)
    return DEMO_CATEGORIES
  }
}

export async function getCards(filters = {}) {
  const { bank_id, card_type, status = 'ACTIVE', limit = 50 } = filters
  
  let query = supabase
    .from('cards')
    .select('*')
    .eq('status', status)
  
  if (bank_id) query = query.eq('bank_id', bank_id)
  if (card_type) query = query.eq('card_type', card_type)
  
  const { data, error } = await query.limit(limit)
  
  if (error) throw error
  return data || []
}

export async function getBanks() {
  const { data, error } = await supabase
    .from('banks')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getActiveCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('id, bank_id, name, name_en, card_type, banks(name_en)')
    .eq('status', 'ACTIVE')
    .order('id')
  
  if (error) throw error
  
  // Transform to include bank_name and reward_program
  return (data || []).map(c => ({
    id: c.id,
    bank_id: c.bank_id,
    name: c.name,
    name_en: c.name_en,
    card_type: c.card_type,
    bank_name: c.banks?.name_en || '',
    reward_program: c.card_type  // Use card_type as reward_program for now
  }))
}

export async function getCardById(id) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function getCategoryById(id) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
    
  } catch (error) {
    // Fallback: find in DEMO_CATEGORIES
    console.warn('[getCategoryById] DB error, searching DEMO_CATEGORIES:', error.message)
    const fallback = DEMO_CATEGORIES.find(c => c.id === id)
    if (fallback) return fallback
    throw error
  }
}

// Get active rules and merchants for the calculate API
export async function getActiveRulesAndMerchants() {
  // Get all active rebate_rates (these act as rules)
  const { data: rates } = await supabase
    .from('rebate_rates')
    .select('id, card_id, category_id, base_rate, rebate_type')
    .eq('status', 'ACTIVE')
  
  // Get all active cards
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, bank_id, card_type')
    .eq('status', 'ACTIVE')
  
  // Get merchants (empty for now - we can add merchant-specific rates later)
  const merchantKeyToId = {}
  
  // Transform rates to rules format
  const rules = (rates || []).map(r => ({
    id: r.id,
    card_id: r.card_id,
    category_id: r.category_id,
    merchant_id: null,
    reward_kind: r.rebate_type === 'MILEAGE' ? 'MILES' : 'CASHBACK',
    rate_unit: 'PERCENT',
    rate_value: r.base_rate,
    per_amount: null,
    cap_value: null,
    cap_period: null,
    min_spend: null,
    priority: r.category_id ? 100 : 200,  // Category rules have higher priority than general
    status: 'ACTIVE'
  }))
  
  return { merchantKeyToId, rules }
}
