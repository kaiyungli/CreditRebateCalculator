import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_') && !supabaseUrl.includes('example'))
  ? createClient(supabaseUrl, supabaseKey)
  : null

export default supabase

// ============ Banks ============

export async function getBanks() {
  const { data, error } = await supabase.from('banks').select('*').eq('status', 'ACTIVE').order('name')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

export async function getBankById(id) {
  const { data, error } = await supabase.from('banks').select('*').eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Cards ============

export async function getActiveCards() {
  const { data, error } = await supabase
    .from('cards')
    .select(`id, bank_id, name, name_en, reward_program, annual_fee, image_url, apply_url, banks!inner(name)`)
    .eq('status', 'ACTIVE')
    .order('name')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return (data || []).map(card => ({
    id: card.id,
    card_id: card.id,
    card_name: card.name,
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
  if (!cardIds || cardIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('cards')
    .select(`id, bank_id, name, name_en, reward_program, banks!inner(name)`)
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
  const { data, error } = await supabase
    .from('cards')
    .select(`*, banks!inner(name)`)
    .eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Categories ============

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name')
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

export async function getCategoryById(id) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

// ============ Merchants ============

export async function getMerchantById(id) {
  const { data, error } = await supabase
    .from('merchants')
    .select('*, categories!inner(name)')
    .eq('id', id).single()
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

export async function searchMerchants(query) {
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
  const today = new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('reward_rules')
    .select(`*, cards!inner(name, bank_id, banks!inner(name))`)
    .eq('status', 'ACTIVE')
    .lte('valid_from', today)
    .gte('valid_to', today)
    .order('priority', { ascending: true })
  
  if (cardIds?.length > 0) {
    query = query.in('card_id', cardIds)
  }
  
  if (merchantId) {
    query = query.or(`merchant_id.eq.${merchantId},merchant_id.is.null`)
  }
  
  if (categoryId) {
    query = query.or(`category_id.eq.${categoryId},category_id.is.null`)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Database query failed: ${error.message}`)
  
  return (data || []).map(rule => ({
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
  const today = new Date().toISOString().split('T')[0]
  
  // Base query: merchant_id and status
  let query = supabase
    .from('merchant_offers')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('status', 'ACTIVE')
    .lte('valid_from', today)
    .gte('valid_to', today)
  
  // Optional: filter by card_ids
  if (cardIds?.length > 0) {
    const cardFilter = cardIds.map(id => `card_id.eq.${id}`).join(',')
    query = query.or(`card_id.is.null,${cardFilter}`)
  }
  
  // Optional: filter by bank_ids
  if (bankIds?.length > 0) {
    const bankFilter = bankIds.map(id => `bank_id.eq.${id}`).join(',')
    query = query.or(`bank_id.is.null,${bankFilter}`)
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

// ============ Users & User Cards ============

export async function getOrCreateUser(telegramId) {
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', String(telegramId))
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database query failed: ${error.message}`)
  }
  
  if (!user) {
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ telegram_id: String(telegramId) })
      .select()
      .single()
    
    if (createError) throw new Error(`Database query failed: ${createError.message}`)
    user = newUser
  }
  
  return user
}

export async function getUserCards(userId) {
  const { data, error } = await supabase
    .from('user_cards')
    .select(`card_id, is_active, cards(id, name, reward_program, banks!inner(name))`)
    .eq('user_id', userId)
    .eq('is_active', true)
  
  if (error) throw new Error(`Database query failed: ${error.message}`)
  
  return (data || []).map(uc => ({
    card_id: uc.card_id,
    is_active: uc.is_active,
    card_name: uc.cards?.name,
    bank_name: uc.cards?.banks?.name,
    reward_program: uc.cards?.reward_program,
  }))
}

export async function addUserCard(userId, cardId) {
  const { data, error } = await supabase
    .from('user_cards')
    .upsert({ user_id: userId, card_id: cardId, is_active: true })
    .select()
    .single()
  
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

export async function removeUserCard(userId, cardId) {
  const { error } = await supabase
    .from('user_cards')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('card_id', cardId)
  
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return { user_id: userId, card_id: cardId }
}

// ============ Calculations ============

export async function saveCalculation(input) {
  const { user_id, input_json, result_json } = input
  
  const { data, error } = await supabase
    .from('calculations')
    .insert({
      user_id,
      input_json: input_json || {},
      result_json: result_json || {},
    })
    .select()
    .single()
  
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data
}

export async function getUserCalculations(userId, limit = 10) {
  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw new Error(`Database query failed: ${error.message}`)
  return data || []
}

// ============ Legacy/Compatibility ============

export async function getActiveRulesAndMerchants() {
  const rules = await getRewardRules()
  
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
