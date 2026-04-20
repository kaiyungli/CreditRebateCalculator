// Database helper functions - uses server-side Supabase client
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set - API routes require service role key')
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export default {}

// ============ Banks ============

export async function getBanks() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('banks').select('*').eq('status', 'ACTIVE').order('name')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

export async function getBankById(id) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('banks').select('*').eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Cards ============

export async function getActiveCards() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('cards')
    .select(`*, banks!inner(name)`)
    .eq('status', 'ACTIVE')
    .order('name')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return (data || []).map(card => ({
    id: card.id,
    card_id: card.id,
    card_name: card.name,
    bank_id: card.bank_id,
    bank_name: card.banks?.name,
    reward_currency: card.reward_program,
    reward_program: card.reward_program,
    network: 'VISA',
    annual_fee: card.annual_fee,
    image_url: card.image_url,
    apply_url: card.apply_url,
  }))
}

export async function getCardsByIds(cardIds) {
  const supabase = getSupabase()
  if (!cardIds || cardIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('cards')
    .select(`*, banks!inner(name)`)
    .in('id', cardIds)
    .eq('status', 'ACTIVE')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return (data || []).map(card => ({
    id: card.id,
    card_id: card.id,
    card_name: card.name,
    bank_id: card.bank_id,
    bank_name: card.banks?.name,
    reward_program: card.reward_program,
  }))
}

export async function getCardById(id) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('cards')
    .select(`*, banks!inner(name)`)
    .eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Categories ============

export async function getCategories() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

export async function getCategoryById(id) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Merchants ============

export async function getMerchantById(id) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('merchants')
    .select('*, categories!inner(name)')
    .eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

export async function searchMerchants(query) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .ilike('name', `%${query}%`)
    .eq('status', 'ACTIVE')
    .order('name')
    .limit(20)
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

export async function getMerchantByKey(merchantKey) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('merchant_key', merchantKey)
    .single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Reward Rules ============

export async function getRewardRules({ cardIds, merchantId, categoryId } = {}) {
  const supabase = getSupabase()
  
  // Returns raw DB rows - normalization done in repository
  let query = supabase
    .from('reward_rules')
    .select(`*, cards!inner(name, bank_id, banks!inner(name))`)
    .eq('status', 'ACTIVE')
    .order('priority', { ascending: true })
  
  if (cardIds?.length > 0) {
    query = query.in('card_id', cardIds)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Database query failed: ${error.message}`)
  
  return data || []
}

// ============ Merchant Offers ============

export async function getMerchantOffers({ merchantId } = {}) {
  const supabase = getSupabase()
  
  // Returns raw DB rows - filtering done in repository layer
  let query = supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
  
  if (merchantId) {
    query = query.eq('merchant_id', merchantId)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Database query failed: ${error.message}`)
  
  return data || []
}

// ============ Legacy/Compatibility ============

export async function getActiveRulesAndMerchants() {
  const rules = await getRewardRules()
  
  const supabase = getSupabase()
  const { data: merchantsData, error: merchError } = await supabase
    .from('merchants')
    .select('id, merchant_key')
    .eq('status', 'ACTIVE')
  
  if (merchError) throw new Error(`Database query failed: ${merchError.message}`)
  
  const merchantKeyToId = {}
  if (merchantsData) {
    for (const m of merchantsData) {
      merchantKeyToId[m.merchant_key] = m.id
    }
  }
  
  return { merchantKeyToId, rules }
}

// ============ Calculations ============

export async function saveCalculation({ user_id, input_json, result_json }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('calculations')
    .insert({
      user_id,
      input_json,
      result_json
    })
    .select()
    .single()
  
  if (error) throw new Error(`Failed to save calculation: ${error.message}`)
  return data
}
