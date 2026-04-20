/**
 * Ingestion Domain - Offer Publisher v1 + State Persistence
 * Publish pipeline with result persistence
 */

import { generateFingerprint } from '../../offers/utils/fingerprint'
import { findOffers } from '../../offers/repositories/offersRepository'
import { normalizeOffer } from '../../offers/repositories/offersRepository'
import { getSupabase } from '../../../lib/db'

const PUBLISH_STATUS = {
  PUBLISHED: 'published',
  SKIPPED_DUPLICATE: 'skipped_duplicate',
  REVIEW_NEEDED: 'review_needed',
  INVALID: 'invalid'
}

const RAW_OFFER_STATUS = {
  NEW: 'new',
  PUBLISHED: 'published',
  SKIPPED: 'skipped',
  REVIEW: 'review',
  INVALID: 'invalid'
}

/**
 * Update raw_offers status after publish attempt
 */
async function updateRawOfferStatus(rawOfferId, newStatus, details = {}) {
  const supabase = getSupabase()
  
  // Build status_notes JSON
  const statusNotes = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
    ...details
  }
  
  try {
    const { error } = await supabase
      .from('raw_offers')
      .update({
        status: newStatus,
        status_notes: JSON.stringify(statusNotes),
        processed_at: new Date().toISOString()
      })
      .eq('id', rawOfferId)
    
    if (error) throw error
    return true
  } catch (e) {
    console.warn('Failed to update raw_offer status:', e.message)
    return false
  }
}

/**
 * Parse raw offer
 */
export function parseRawOffer(rawOffer) {
  if (!rawOffer) return { valid: false, reason: 'no_raw_offer' }
  
  const parsed = {
    merchantId: rawOffer.merchant_id,
    bankId: rawOffer.bank_id,
    cardId: rawOffer.card_id,
    title: rawOffer.title,
    offerType: rawOffer.offer_type || 'general',
    valueType: rawOffer.reward_type === 'percent' ? 'PERCENT' : 'FIXED',
    value: parseFloat(rawOffer.reward_value) || 0,
    minSpend: rawOffer.min_spend ? parseFloat(rawOffer.min_spend) : null,
    maxReward: rawOffer.max_reward ? parseFloat(rawOffer.max_reward) : null,
    conditions: rawOffer.conditions,
    rawOfferId: rawOffer.id,
    sourceUrl: rawOffer.source_url,
    sourceName: rawOffer.source_name,
    parserVersion: 'v1',
    parsedAt: new Date().toISOString()
  }
  
  if (!parsed.title) return { valid: false, reason: 'missing_title' }
  if (!parsed.valueType) return { valid: false, reason: 'missing_value_type' }
  if (!parsed.value || parsed.value <= 0) return { valid: false, reason: 'invalid_value' }
  
  return { valid: true, parsed }
}

/**
 * Normalize parsed offer
 */
export function normalizeParsedOffer(parsed) {
  return normalizeOffer({
    title: parsed.title,
    merchant_id: parsed.merchantId,
    bank_id: parsed.bankId,
    card_id: parsed.cardId,
    offer_type: parsed.offerType,
    value_type: parsed.valueType,
    value: parsed.value,
    min_spend: parsed.minSpend,
    max_reward: parsed.maxReward,
    conditions_json: parsed.conditions
  })
}

/**
 * Check for duplicates
 */
export async function checkDuplicate(normalized) {
  const fingerprint = generateFingerprint(normalized)
  const offers = await findOffers({})
  
  // Exact match
  const exact = offers.find(o => generateFingerprint(o) === fingerprint)
  if (exact) {
    return { isDuplicate: true, exactMatch: true, existingId: exact.id }
  }
  
  // Near match (same target, different value)
  const parts = fingerprint.split('|')
  const near = offers.filter(o => {
    const fp = generateFingerprint(o)
    const p = fp.split('|')
    return p[0] === parts[0] && p[4] === parts[4] && fp !== fingerprint
  })
  
  if (near.length > 0) {
    return { isDuplicate: true, exactMatch: false, nearMatches: near.map(m => m.id) }
  }
  
  return { isDuplicate: false }
}

/**
 * Main publish pipeline with state persistence
 */
export async function publishOffer(rawOffer) {
  const result = {
    status: null,
    fingerprint: null,
    rawOfferId: rawOffer?.id,
    merchantOfferId: null,
    reason: null,
    details: null
  }
  
  // Step 1: Parse
  const parseResult = parseRawOffer(rawOffer)
  if (!parseResult.valid) {
    result.status = PUBLISH_STATUS.INVALID
    result.reason = parseResult.reason
    // Persist invalid state
    await updateRawOfferStatus(rawOffer.id, RAW_OFFER_STATUS.INVALID, {
      reason: parseResult.reason
    })
    return result
  }
  
  // Step 2: Normalize
  const normalized = normalizeParsedOffer(parseResult.parsed)
  
  // Step 3: Generate fingerprint
  const fingerprint = generateFingerprint(normalized)
  result.fingerprint = fingerprint
  
  // Step 4: Check duplicates
  const duplicateCheck = await checkDuplicate(normalized)
  
  if (duplicateCheck.isDuplicate) {
    if (duplicateCheck.exactMatch) {
      result.status = PUBLISH_STATUS.SKIPPED_DUPLICATE
      result.reason = 'exact_fingerprint_match'
      result.details = { existingId: duplicateCheck.exactMatch }
      
      // Persist skipped state
      await updateRawOfferStatus(rawOffer.id, RAW_OFFER_STATUS.SKIPPED, {
        fingerprint,
        reason: 'exact_match',
        duplicateOf: duplicateCheck.existingId
      })
    } else {
      result.status = PUBLISH_STATUS.REVIEW_NEEDED
      result.reason = 'near_match_conflict'
      result.details = { nearMatches: duplicateCheck.nearMatches }
      
      // Persist review state
      await updateRawOfferStatus(rawOffer.id, RAW_OFFER_STATUS.REVIEW, {
        fingerprint,
        reason: 'near_match',
        nearMatches: duplicateCheck.nearMatches
      })
    }
    return result
  }
  
  // Step 5: Publish
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('merchant_offers')
      .insert({
        merchant_id: normalized.merchantId,
        bank_id: normalized.bankId,
        card_id: normalized.cardId,
        title: normalized.title,
        offer_type: normalized.offerType,
        value_type: normalized.valueType,
        value: normalized.value,
        min_spend: normalized.minSpend,
        max_reward: normalized.maxReward,
        status: 'ACTIVE',
        is_active: true,
        fingerprint: fingerprint,
        raw_offer_id: rawOffer.id,
        source_url: parseResult.parsed.sourceUrl,
        source_name: parseResult.parsed.sourceName,
        parser_version: parseResult.parsed.parserVersion,
        parsed_at: parseResult.parsed.parsedAt,
        confidence: 'LOW',
        is_verified: false
      })
      .select()
      .single()
    
    if (error) throw error
    
    result.status = PUBLISH_STATUS.PUBLISHED
    result.reason = 'success'
    result.merchantOfferId = data.id
    
    // Persist published state
    await updateRawOfferStatus(rawOffer.id, RAW_OFFER_STATUS.PUBLISHED, {
      fingerprint,
      merchantOfferId: data.id
    })
    
    return result
  } catch (e) {
    result.status = PUBLISH_STATUS.INVALID
    result.reason = 'insert_failed: ' + e.message
    
    // Persist invalid state
    await updateRawOfferStatus(rawOffer.id, RAW_OFFER_STATUS.INVALID, {
      reason: e.message
    })
    
    return result
  }
}

export { PUBLISH_STATUS, RAW_OFFER_STATUS }
export default { publishOffer, PUBLISH_STATUS, RAW_OFFER_STATUS }
