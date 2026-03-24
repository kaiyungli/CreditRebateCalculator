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
  const today = new Date().toISOString().split('T')[0]
  
  // Get all active rules - date filter handled in code for NULL dates
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
  
  // Filter by date and scope in JavaScript (handle NULL dates as always valid)
  let filtered = (data || []).filter(rule => {
    // Date check: NULL means always valid
    if (rule.valid_from && rule.valid_from > today) return false
    if (rule.valid_to && rule.valid_to < today) return false
    return true
  })
  
  // Filter by merchant/category if provided
  if (merchantId) {
    filtered = filtered.filter(r => r.merchant_id === merchantId || r.merchant_id === null)
  }
  
  if (categoryId) {
    filtered = filtered.filter(r => r.category_id === categoryId || r.category_id === null)
  }
  
  return filtered.map(rule => ({
    id: rule.id,
    card_id: rule.card_id,
    merchant_id: rule.merchant_id,
    category_id: rule.category_id,
    reward_kind: rule.reward_kind,
    rate_unit: rule.rate_unit,
    rate_value: Number(rule.rate_value),
    per_amount: rule.per_amount ? Number(rule.per_amount) : null,
    cap_value: rule.cap_value ? Number(rule.cap_value) : null,
    cap_period: rule.cap_period || 'MONTHLY',
    min_spend: rule.min_spend ? Number(rule.min_spend) : null,
    priority: rule.priority || 100,
    card_name: rule.cards?.name,
    bank_name: rule.cards?.banks?.name,
  }))
}

// ============ Merchant Offers ============

export async function getMerchantOffers({ merchantId, cardIds, bankIds } = {}) {
  const supabase = getSupabase()
  const today = new Date().toISOString().split('T')[0]
  
  // Filter for currently valid offers:
  // - status = 'ACTIVE' 
  // - is_active = true (if field exists)
  // - start_date is null or <= today
  // - end_date is null or >= today
  let query = supabase
    .from('merchant_offers')
    .select('*')
    .eq('status', 'ACTIVE')
  
  if (merchantId) {
    query = query.eq('merchant_id', merchantId)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Database query failed: ${error.message}`)
  
  // Filter by is_active and date validity in JS (handle both old rows without is_active and new rows with it)
  let filtered = (data || []).filter(offer => {
    // Skip inactive offers
    if (offer.is_active === false) return false
    // Skip if not started yet
    if (offer.start_date && offer.start_date > today) return false
    // Skip if already expired
    if (offer.end_date && offer.end_date < today) return false
    return true
  })
  
  // Filter by card/bank
  if (cardIds?.length > 0) {
    filtered = filtered.filter(offer => 
      !offer.card_id || cardIds.includes(offer.card_id)
    )
  }
  
  if (bankIds?.length > 0) {
    filtered = filtered.filter(offer => 
      !offer.bank_id || bankIds.includes(offer.bank_id)
    )
  }
  
  return filtered
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
