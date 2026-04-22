/**
 * Offer Parser v1 - Fixed Metadata + Welcome Branch
 * 
 * Fixed: source_name, source_url, raw_offer_id propagation
 * Fixed: welcome_offers insert path
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Non-offer keywords to reject */
const NON_OFFER_KEYWORDS = [
  'phishing', 'fraud', 'security', 'beware', 'scam',
  'support', 'help', 'login', 'password',
  'account', 'payroll', 'all-in-one',
  'mobile app', 'currency', 'rmb', 'exchange',
  'debit card', 'employee banking'
]

/** Positive offer keywords */
const OFFER_KEYWORDS = [
  'offer', 'promotion', 'cashback', 'discount',
  'reward', 'welcome', 'bonus', 'gift',
  'exclusive', 'privilege', 'spend', 'get',
  'earn', 'mile', 'point', 'voucher', 'coupon', 'special'
]

/** Get raw offers needing parsing */
async function getRawOffers() {
  const response = await fetch(
    SUPABASE_URL + '/rest/v1/raw_offers?status=eq.new&select=*&limit=20',
    { headers: { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY } }
  )
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

/** Update raw offer status */
async function updateRawStatus(id, status, statusNotes) {
  await fetch(SUPABASE_URL + '/rest/v1/raw_offers?id=eq.' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ status, status_notes: statusNotes })
  })
}

/** Safety gate */
function isLikelyOffer(text) {
  const t = text.toLowerCase()
  for (const kw of NON_OFFER_KEYWORDS) {
    if (t.includes(kw)) return { valid: false, reason: 'non_offer_keyword:' + kw }
  }
  let hasOffer = OFFER_KEYWORDS.some(k => t.includes(k))
  if (!hasOffer) return { valid: false, reason: 'no_offer_keyword' }
  if (text.length < 20) return { valid: false, reason: 'too_short' }
  return { valid: true }
}

/** Check if welcome offer */
function isWelcomeOffer(text) {
  const t = text.toLowerCase()
  return ['welcome', 'new customer', 'apply online', 'approval', 'first ', 'application', 'sign up'].some(k => t.includes(k))
}

/** Detect offer type */
function detectOfferType(text) {
  const t = text.toLowerCase()
  if (t.includes('%') && (t.includes('cashback') || t.includes('discount'))) return 'PERCENT_DISCOUNT'
  if (t.includes('coupon') || t.includes('voucher') || t.includes('$')) {
    if (t.includes('spend') || t.includes('upon')) return 'FIXED_COUPON'
  }
  return 'GENERAL'
}

/** Extract values */
function extractMinSpend(text) {
  const match = text.match(/(?:spend|upon|minimum)[\s\$ HK]*?(\d+)/i)
  return match ? parseInt(match[1]) : null
}

function extractValue(text) {
  const pm = text.match(/(\d+)\s*%/i)
  if (pm) return { type: 'PERCENT', value: parseInt(pm[1]) }
  const fm = text.match(/HK?[\$¥]\s*?(\d+)/i)
  if (fm) return { type: 'FIXED', value: parseInt(fm[1]) }
  return null
}

/** Insert into merchant_offers */
async function insertMerchantOffer(payload) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/merchant_offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  })
  return response.ok
}

/** Insert into welcome_offers - FIXED payload */
async function insertWelcomeOffer(payload) {
  // Build minimal payload that matches schema
  const welcomePayload = {
    title: payload.title,
    description: payload.description || payload.title,
    offer_type: 'WELCOME',
    reward_kind: payload.value_type || 'FIXED',
    value: payload.value || null,
    value_type: payload.value_type || null,
    min_spend: payload.min_spend || null,
    new_customer_only: true,
    approval_required: true,
    application_channel: payload.source_url || 'ONLINE',
    source: payload.source_name || payload.source,
    source_url: payload.source_url,
    source_name: payload.source_name,
    raw_offer_id: payload.raw_offer_id,
    parsed_at: payload.parsed_at,
    confidence: payload.confidence || 'MEDIUM',
    status: 'ACTIVE'
  }
  
  const response = await fetch(SUPABASE_URL + '/rest/v1/welcome_offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(welcomePayload)
  })
  
  if (!response.ok) {
    const err = await response.text()
    throw new Error(err)
  }
  return true
}

/** Parse single raw offer */
async function parseRawOffer(raw) {
  const text = (raw.title || '') + ' ' + (raw.description || '')
  
  // Safety gate
  const safety = isLikelyOffer(text)
  if (!safety.valid) {
    await updateRawStatus(raw.id, 'needs_review', JSON.stringify({ action: 'needs_review', reason: safety.reason }))
    return { success: false, target: 'needs_review', id: raw.id }
  }
  
  const isWelcome = isWelcomeOffer(text)
  const offerType = detectOfferType(text)
  const value = extractValue(text)
  const minSpend = extractMinSpend(text)
  const now = new Date().toISOString()
  
  // Metadata from raw row
  const metadata = {
    source_name: raw.source,
    source_url: raw.url,
    raw_offer_id: raw.id
  }

  // Handle welcome offer
  if (isWelcome) {
    const payload = {
      title: raw.title,
      description: (raw.description || text).slice(0, 1000),
      offer_type: 'WELCOME',
      reward_kind: value?.type || 'FIXED',
      value: value?.value || null,
      value_type: value?.type || null,
      min_spend: minSpend,
      ...metadata,
      parsed_at: now,
      confidence: 'MEDIUM'
    }
    
    try {
      await insertWelcomeOffer(payload)
      await updateRawStatus(raw.id, 'parsed', JSON.stringify({ action: 'parsed', target: 'welcome_offers' }))
      return { success: true, target: 'welcome_offers', id: raw.id }
    } catch (e) {
      await updateRawStatus(raw.id, 'needs_review', JSON.stringify({ action: 'needs_review', reason: 'welcome_insert_failed', error: e.message }))
      return { success: false, target: 'needs_review', id: raw.id, reason: e.message }
    }
  }

  // Handle merchant offer
  const merchantPayload = {
    title: raw.title,
    description: (raw.description || text).slice(0, 1000),
    offer_type: offerType,
    reward_kind: value?.type || 'FIXED',
    value: value?.value?.toString() || null,
    value_type: value?.type || 'FIXED',
    min_spend: minSpend,
    fulfillment_type: 'POST_TRANSACTION',
    calculation_mode: 'FLAT_RATE',
    registration_required: false,
    ...metadata,  // source_name, source_url, raw_offer_id
    parsed_at: now,
    confidence: 'MEDIUM',
    status: 'ACTIVE'
  }

  try {
    await insertMerchantOffer(merchantPayload)
    await updateRawStatus(raw.id, 'parsed', JSON.stringify({ action: 'parsed', target: 'merchant_offers' }))
    return { success: true, target: 'merchant_offers', id: raw.id }
  } catch (e) {
    await updateRawStatus(raw.id, 'error', JSON.stringify({ action: 'error', reason: e.message }))
    return { success: false, target: 'error', id: raw.id }
  }
}

/** Process all */
exports.processAll = async function() {
  const rawOffers = await getRawOffers()
  console.log('=== Parser v1 - Fixed Metadata ===')
  console.log('Total read:', rawOffers.length)
  
  const stats = { merchant: 0, welcome: 0, review: 0, error: 0 }

  for (const raw of rawOffers) {
    try {
      const result = await parseRawOffer(raw)
      if (result.target === 'merchant_offers') stats.merchant++
      else if (result.target === 'welcome_offers') stats.welcome++
      else if (result.target === 'needs_review') stats.review++
      else stats.error++
      console.log('ID ' + raw.id + ': ' + result.target + (result.reason ? ' (' + result.reason + ')' : ''))
    } catch (e) {
      stats.error++
      console.log('ID ' + raw.id + ': error')
    }
  }

  console.log('\n=== Summary ===')
  console.log('merchant_offers:', stats.merchant)
  console.log('welcome_offers:', stats.welcome)
  console.log('needs_review:', stats.review)
  console.log('error:', stats.error)
  
  return { rawOffers, stats }
}

exports.parseRawOffer = parseRawOffer
exports.getRawOffers = getRawOffers
