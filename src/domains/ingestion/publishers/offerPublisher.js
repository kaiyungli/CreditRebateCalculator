/**
 * Ingestion Domain - Offer Publisher v1
 * End-to-end publish pipeline with fingerprint dedupe
 */

import { generateFingerprint } from '../../offers/utils/fingerprint'
import { findOffers } from '../../offers/repositories/offersRepository'
import { normalizeOffer } from '../../offers/repositories/offersRepository'
import { supabase } from '../../../lib/supabase-server'

const PUBLISH_STATUS = {
  PUBLISHED: 'published',
  SKIPPED_DUPLICATE: 'skipped_duplicate',
  REVIEW_NEEDED: 'review_needed',
  INVALID: 'invalid'
}

/**
 * Parse raw offer text into structured object
 */
export function parseRawOffer(rawOffer) {
  if (!rawOffer) return { valid: false, reason: 'no_raw_offer' }
  
  // Basic parsing from raw_offers table
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
  
  // Basic validation
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
 * Check for duplicates using fingerprint
 */
export async function checkDuplicate(normalizedOffer) {
  const fingerprint = generateFingerprint(normalizedOffer)
  
  // Get all active offers
  const offers = await findOffers({})
  
  // Find exact match
  const exactMatch = offers.find(o => generateFingerprint(o) === fingerprint)
  
  if (exactMatch) {
    return {
      isDuplicate: true,
      exactMatch: true,
      reason: 'exact_fingerprint_match',
      existingId: exactMatch.id
    }
  }
  
  // Check for near/ambiguous duplicates (same target different value)
  const nearMatches = offers.filter(o => {
    const fp = generateFingerprint(o)
    const parts = fp.split('|')
    const normParts = fingerprint.split('|')
    // Same targeting, different value
    return parts[0] === normParts[0] && // merchant_id
           parts[4] === normParts[4] && // offer_type
           fp !== fingerprint // but different value
  })
  
  if (nearMatches.length > 0) {
    return {
      isDuplicate: true,
      exactMatch: false,
      reason: 'near_match_conflict',
      nearMatches: nearMatches.map(m => m.id),
      note: 'Different value, may need review'
    }
  }
  
  return { isDuplicate: false }
}

/**
 * Publish v1 pipeline
 */
export async function publishOffer(rawOffer) {
  // Step 1: Parse
  const parseResult = parseRawOffer(rawOffer)
  if (!parseResult.valid) {
    return {
      status: PUBLISH_STATUS.INVALID,
      reason: parseResult.reason,
      rawOfferId: rawOffer?.id
    }
  }
  
  // Step 2: Normalize
  const normalized = normalizeParsedOffer(parseResult.parsed)
  
  // Step 3: Generate fingerprint
  const fingerprint = generateFingerprint(normalized)
  
  // Step 4: Check duplicates
  const duplicateCheck = await checkDuplicate(normalized)
  
  if (duplicateCheck.isDuplicate) {
    if (duplicateCheck.exactMatch) {
      return {
        status: PUBLISH_STATUS.SKIPPED_DUPLICATE,
        reason: duplicateCheck.reason,
        fingerprint,
        rawOfferId: rawOffer.id,
        existingId: duplicateCheck.existingId
      }
    } else {
      return {
        status: PUBLISH_STATUS.REVIEW_NEEDED,
        reason: duplicateCheck.reason,
        fingerprint,
        rawOfferId: rawOffer.id,
        note: duplicateCheck.note
      }
    }
  }
  
  // Step 5: Publish
  try {
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
        confidence: 'LOW',  // New offers start low
        is_verified: false
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      status: PUBLISH_STATUS.PUBLISHED,
      reason: 'success',
      fingerprint,
      rawOfferId: rawOffer.id,
      merchantOfferId: data.id
    }
  } catch (e) {
    return {
      status: PUBLISH_STATUS.INVALID,
      reason: 'insert_failed: ' + e.message,
      rawOfferId: rawOffer.id
    }
  }
}

export { PUBLISH_STATUS }
export default { publishOffer, PUBLISH_STATUS }
