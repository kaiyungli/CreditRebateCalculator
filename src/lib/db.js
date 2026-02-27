import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

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
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
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
    .select('id, bank_id, name, name_en, card_type')
    .eq('status', 'ACTIVE')
    .order('id')
  
  if (error) throw error
  return data || []
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
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}
