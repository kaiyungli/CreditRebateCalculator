import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if credentials are configured
const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_')) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

// Fallback demo data when no Supabase
const DEMO_MERCHANT_RATES = [
  { id: 1, card_id: 1, merchant_name: '壽司郎', category_id: 1, rebate_rate: 0.04, rebate_type: 'PERCENTAGE', conditions: '餐飲4%', status: 'ACTIVE' },
  { id: 2, card_id: 1, merchant_name: '麥當勞', category_id: 1, rebate_rate: 0.04, rebate_type: 'PERCENTAGE', conditions: '快餐4%', status: 'ACTIVE' },
  { id: 3, card_id: 1, merchant_name: '海底撈', category_id: 1, rebate_rate: 0.04, rebate_type: 'PERCENTAGE', conditions: '火鍋4%', status: 'ACTIVE' },
  { id: 4, card_id: 1, merchant_name: '百佳', category_id: 3, rebate_rate: 0.02, rebate_type: 'PERCENTAGE', conditions: '超市2%', status: 'ACTIVE' },
  { id: 5, card_id: 1, merchant_name: 'HKTVmall', category_id: 2, rebate_rate: 0.02, rebate_type: 'PERCENTAGE', conditions: '網購2%', status: 'ACTIVE' },
]

const DEMO_CATEGORIES = [
  { id: 1, name: '餐飲美食', icon: '🍜', sort_order: 1 },
  { id: 2, name: '網上購物', icon: '🛒', sort_order: 2 },
  { id: 3, name: '超市便利店', icon: '🏪', sort_order: 3 },
  { id: 4, name: '交通出行', icon: '🚗', sort_order: 4 },
  { id: 5, name: '娛樂休閒', icon: '🎬', sort_order: 5 },
]

const DEMO_CARDS = [
  { id: 1, bank_id: 1, name: '滙豐 Visa Signature', card_type: 'CASHBACK', status: 'ACTIVE' },
  { id: 2, bank_id: 1, name: '滙豐白金Visa', card_type: 'CASHBACK', status: 'ACTIVE' },
  { id: 3, bank_id: 2, name: '渣打Asia Miles', card_type: 'MILEAGE', status: 'ACTIVE' },
  { id: 4, bank_id: 2, name: '渣打Smart卡', card_type: 'CASHBACK', status: 'ACTIVE' },
  { id: 5, bank_id: 3, name: '中銀Visa白金', card_type: 'CASHBACK', status: 'ACTIVE' },
]

const DEMO_BANKS = [
  { id: 1, name: '滙豐銀行', status: 'ACTIVE' },
  { id: 2, name: '渣打銀行', status: 'ACTIVE' },
  { id: 3, name: '中銀香港', status: 'ACTIVE' },
]

export { DEMO_MERCHANT_RATES, DEMO_CATEGORIES, DEMO_CARDS, DEMO_BANKS }
export default supabase

// ============ Helper Functions ============

export async function getMerchantRates(cardIds = [], categoryId = null) {
  // Use demo data if no Supabase
  if (!supabase) {
    let rates = DEMO_MERCHANT_RATES.filter(r => r.status === 'ACTIVE')
    if (categoryId) rates = rates.filter(r => r.category_id === categoryId)
    if (cardIds?.length > 0) rates = rates.filter(r => cardIds.includes(r.card_id))
    
    // Join with card data
    return rates.map(r => {
      const card = DEMO_CARDS.find(c => c.id === r.card_id)
      return { ...r, card_name: card?.name, bank_id: card?.bank_id, card_type: card?.card_type }
    })
  }

  let query = supabase.from('merchant_rates').select('*').eq('status', 'ACTIVE')
  if (categoryId) query = query.eq('category_id', categoryId)
  if (cardIds?.length > 0) query = query.in('card_id', cardIds)

  const { data, error } = await query
  if (error) throw error

  const cardIdsNeeded = [...new Set(data.map(r => r.card_id))]
  const { data: cards } = await supabase.from('cards').select('id, name, bank_id, card_type').in('id', cardIdsNeeded)

  const cardMap = {}
  for (const c of (cards || [])) cardMap[c.id] = c

  return data.map(r => ({
    ...r,
    card_name: cardMap[r.card_id]?.name,
    bank_id: cardMap[r.card_id]?.bank_id,
    card_type: cardMap[r.card_id]?.card_type
  }))
}

export async function getCategories() {
  if (!supabase) return DEMO_CATEGORIES
  
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true })
  if (error) return DEMO_CATEGORIES
  return data?.length > 0 ? data : DEMO_CATEGORIES
}

export async function getCards(filters = {}) {
  if (!supabase) {
    let cards = DEMO_CARDS
    if (filters.bank_id) cards = cards.filter(c => c.bank_id === filters.bank_id)
    if (filters.card_type) cards = cards.filter(c => c.card_type === filters.card_type)
    if (filters.status) cards = cards.filter(c => c.status === filters.status)
    return cards.slice(0, filters.limit || 50)
  }
  
  let query = supabase.from('cards').select('*').eq('status', filters.status || 'ACTIVE')
  if (filters.bank_id) query = query.eq('bank_id', filters.bank_id)
  if (filters.card_type) query = query.eq('card_type', filters.card_type)
  
  const { data, error } = await query.limit(filters.limit || 50)
  if (error) throw error
  return data || []
}

export async function getBanks() {
  if (!supabase) return DEMO_BANKS
  
  const { data, error } = await supabase.from('banks').select('*').eq('status', 'ACTIVE').order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getActiveCards() {
  if (!supabase) return DEMO_CARDS
  
  const { data, error } = await supabase.from('cards').select('id, bank_id, name, name_en, card_type').eq('status', 'ACTIVE').order('id')
  if (error) throw error
  return data || []
}

export async function getActiveRulesAndMerchants() {
  // Returns merchantKeyToId mapping and rules for calculate API
  if (!supabase) {
    // Use demo data
    const rates = DEMO_MERCHANT_RATES.filter(r => r.status === 'ACTIVE')
    const merchantKeyToId = {}
    for (const r of rates) {
      if (r.merchant_name && !merchantKeyToId[r.merchant_name]) {
        merchantKeyToId[r.merchant_name] = r.id
      }
    }
    return { merchantKeyToId, rules: rates }
  }
  
  const { data: rates, error } = await supabase.from('merchant_rates').select('*').eq('status', 'ACTIVE').order('priority', { ascending: true })
  if (error) throw error
  
  const merchantKeyToId = {}
  for (const r of (rates || [])) {
    if (r.merchant_name && !merchantKeyToId[r.merchant_name]) {
      merchantKeyToId[r.merchant_name] = r.id
    }
  }
  
  return { merchantKeyToId, rules: rates || [] }
}

export async function getCardById(id) {
  if (!supabase) return DEMO_CARDS.find(c => c.id === id)
  
  const { data, error } = await supabase.from('cards').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function getCategoryById(id) {
  if (!supabase) return DEMO_CATEGORIES.find(c => c.id === id)
  
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
