import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase

export async function getMerchantRates(cardIds = [], categoryId = null) {
  let query = supabase
    .from('merchant_rates')
    .select(`
      id,
      merchant_name,
      category_id,
      rebate_rate,
      rebate_type,
      conditions,
      card_id,
      cards(id, name, bank_id, reward_program)
    `)
    .eq('status', 'ACTIVE')

  if (categoryId != null) {
    query = query.eq('category_id', categoryId)
  }

  if (Array.isArray(cardIds) && cardIds.length > 0) {
    query = query.in('card_id', cardIds)
  }

  const { data, error } = await query
  
  if (error) throw error
  
  return data || []
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
  const { bank_id, reward_program, status = 'ACTIVE', limit = 50 } = filters
  
  let query = supabase
    .from('cards')
    .select('*, banks(name)')
    .eq('status', status)
  
  if (bank_id) query = query.eq('bank_id', bank_id)
  if (reward_program) query = query.eq('reward_program', reward_program)
  
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
    .select('id, bank_id, name, name_en, reward_program')
    .eq('status', 'ACTIVE')
    .order('id')
  
  if (error) throw error
  return data || []
}

export async function getCardById(id) {
  const { data, error } = await supabase
    .from('cards')
    .select('*, banks(name)')
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
