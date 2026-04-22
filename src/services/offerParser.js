/**
 * Offer Parser v1 - With Safety Gate
 * 
 * Reads raw_offers (status='new')
 * Validates offer-like before insert
 * Proper status transitions
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

/** Positive offer keywords - must have at least one */
const OFFER_KEYWORDS = [
  'offer', 'promotion', 'cashback', 'discount',
  'reward', 'welcome', 'bonus', 'gift',
  'exclusive', 'privilege', 'spend', 'get',
  'earn', 'mile', 'point', 'voucher', 'coupon'
]

/** Read raw offers needing parsing */
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

/** Safety gate - is row offer-like? */
function isLikelyOffer(text) {
  const t = text.toLowerCase()
  
  // Check for explicit non-offer content
  for (const kw of NON_OFFER_KEYWORDS) {
    if (t.includes(kw)) return { valid: false, reason: 'non_offer_keyword:' + kw }
  }
  
  // Must have at least one positive offer keyword
  let hasOfferKeyword = false
  for (const kw of OFFER_KEYWORDS) {
    if (t.includes(kw)) { hasOfferKeyword = true; break }
  }
  if (!hasOfferKeyword) return { valid: false, reason: 'no_offer_keyword' }
  
  // Must have meaningful content (not too short)
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

/** Extract min_spend */
function extractMinSpend(text) {
  const match = text.match(/(?:spend|upon|minimum)[\s\$ HK]*?(\d+)/i)
  return match ? parseInt(match[1]) : null
}

/** Extract value */
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

/** Insert into welcome_offers */
async function insertWelcomeOffer(payload) {
  const response = await fetch(SUPABASE_URL + '/rest/v1/welcome_offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error('welcome_offers insert failed')
  return true
}

/** Parse single raw offer */
async function parseRawOffer(raw) {
  const text = (raw.title || '') + ' ' + (raw.description || '')
  
  // SAFETY GATE - check if offer-like first
  const safetyCheck = isLikelyOffer(text)
  if (!safetyCheck.valid) {
    await updateRawStatus(raw.id, 'needs_review', JSON.stringify({ action: 'needs_review', reason: safetyCheck.reason, content: raw.title }))
    return { success: false, target: 'needs_review', id: raw.id, reason: safetyCheck.reason }
  }
  
  const isWelcome = isWelcomeOffer(text)
  const offerType = detectOfferType(text)
  const value = extractValue(text)
  const minSpend = extractMinSpend(text)
  const now = new Date().toISOString()

  // Handle welcome offer
  if (isWelcome) {
    const payload = {
      title: raw.title,
      description: (raw.description || text).slice(0, 1000),
      offer_type: 'WELCOME',
      reward_kind: value ? value.type : 'FIXED',
      value: value?.value || null,
      value_type: value?.type || null,
      min_spend: minSpend,
      new_customer_only: true,
      approval_required: true,
      source: raw.source,
      source_url: raw.url,
      source_name: raw.source,
      raw_offer_id: raw.id,
      parsed_at: now,
      confidence: 'MEDIUM',
      status: 'ACTIVE'
    }
    try {
      await insertWelcomeOffer(payload)
      await updateRawStatus(raw.id, 'parsed', JSON.stringify({ action: 'parsed', target: 'welcome_offers' }))
      return { success: true, target: 'welcome_offers', id: raw.id }
    } catch (e) {
      await updateRawStatus(raw.id, 'needs_review', JSON.stringify({ action: 'needs_review', reason: 'welcome_insert_failed', error: e.message }))
      return { success: false, target: 'needs_review', id: raw.id }
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
    source: raw.source,
    source_url: raw.url,
    source_name: raw.source,
    raw_offer_id: raw.id,
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
  console.log('=== Parser v1 - Safety Gate ===')
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
exports.isLikelyOffer = isLikelyOffer
