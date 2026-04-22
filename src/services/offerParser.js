/**
 * Offer Parser v1
 * 
 * Reads raw_offers (status='new')
 * Classifies into: merchant_offers or welcome_offers
 * No AI API used
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Read raw offers needing parsing */
async function getRawOffers() {
  const response = await fetch(
    SUPABASE_URL + '/rest/v1/raw_offers?status=eq.new&select=*&limit=20',
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    }
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

/** Check if welcome offer */
function isWelcomeOffer(text) {
  const t = text.toLowerCase()
  const welcomeKeywords = ['welcome', 'new customer', 'apply online', 'approval', 'first ', 'application', 'sign up', 'approved']
  return welcomeKeywords.some(k => t.includes(k))
}

/** Detect offer type */
function detectOfferType(text) {
  const t = text.toLowerCase()
  if (t.includes('%') && (t.includes('cashback') || t.includes('discount'))) {
    return 'PERCENT_DISCOUNT'
  }
  if (t.includes('coupon') || t.includes('voucher') || t.includes('$')) {
    if (t.includes('spend') || t.includes('upon')) {
      return 'FIXED_COUPON'
    }
  }
  return 'GENERAL'
}

/** Extract min_spend */
function extractMinSpend(text) {
  const match = text.match(/(?:spend|upon|minimum)[\s\$ HK]*?(\d+)/i) || text.match(/HK?[\$¥]\s*?(\d+)/i)
  if (match) return parseInt(match[1])
  return null
}

/** Extract value */
function extractValue(text) {
  const percentMatch = text.match(/(\d+)\s*%/i)
  if (percentMatch) return { type: 'PERCENT', value: parseInt(percentMatch[1]) }
  const fixedMatch = text.match(/HK?[\$¥]\s*?(\d+)/i)
  if (fixedMatch) return { type: 'FIXED', value: parseInt(fixedMatch[1]) }
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

/** Insert into welcome_offers (with graceful fallback) */
async function insertWelcomeOffer(payload) {
  try {
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
    if (response.ok) return true
    // Table doesn't exist - mark for review
    throw new Error('welcome_offers table not available')
  } catch (e) {
    throw e
  }
}

/** Parse single raw offer */
async function parseRawOffer(raw) {
  const text = (raw.title || '') + ' ' + (raw.description || '')
  const isWelcome = isWelcomeOffer(text)
  const offerType = detectOfferType(text)
  const value = extractValue(text)
  const minSpend = extractMinSpend(text)
  const now = new Date().toISOString()

  // Welcome offer
  if (isWelcome) {
    try {
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
      await insertWelcomeOffer(payload)
      await updateRawStatus(raw.id, 'parsed', JSON.stringify({ action: 'parsed', target: 'welcome_offers' }))
      return { success: true, target: 'welcome_offers', id: raw.id }
    } catch (e) {
      // Table doesn't exist - mark needs_review
      await updateRawStatus(raw.id, 'needs_review', JSON.stringify({ reason: 'welcome_offers_pending', error: e.message }))
      return { success: false, target: 'needs_review', id: raw.id, reason: 'welcome_offers_missing' }
    }
  }

  // Merchant offer
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

  await insertMerchantOffer(merchantPayload)
  await updateRawStatus(raw.id, 'parsed', JSON.stringify({ action: 'parsed', target: 'merchant_offers' }))
  return { success: true, target: 'merchant_offers', id: raw.id }
}

/** Process all new raw offers */
exports.processAll = async function() {
  const rawOffers = await getRawOffers()
  console.log('Found ' + rawOffers.length + ' new raw offers')
  const results = []
  for (const raw of rawOffers) {
    try {
      const result = await parseRawOffer(raw)
      results.push(result)
      console.log('Parsed ' + raw.id + ' -> ' + result.target)
    } catch (e) {
      console.log('Error: ' + raw.id + ': ' + e.message)
      await updateRawStatus(raw.id, 'error', JSON.stringify({ error: e.message }))
    }
  }
  return results
}

exports.parseRawOffer = parseRawOffer
exports.getRawOffers = getRawOffers
