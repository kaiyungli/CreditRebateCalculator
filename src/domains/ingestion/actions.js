/**
 * Review Action System v2
 * 
 * Handles manual resolution of review_needed offers
 * With safeguards and audit trail
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase config')
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
}

/** Review actions */
export const REVIEW_ACTION = {
  APPROVE: 'approved',
  REJECT: 'rejected',
  MERGE: 'merged'
}

/** Invalid starting states for review actions */
const VALID_START_STATE = 'review'

/** Parse status_notes safely */
export function parseStatusNotes(raw) {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Validate preconditions for review action
 */
export function validateReviewPreconditions(rawOffer) {
  const errors = []
  
  if (!rawOffer) {
    errors.push('Raw offer not found')
    return { valid: false, errors }
  }
  
  if (rawOffer.status !== VALID_START_STATE) {
    errors.push(`Invalid starting state: expected '${VALID_START_STATE}', got '${rawOffer.status}'`)
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Check for duplicates before approve
 */
export async function checkDuplicateForApprove(rawOffer) {
  const supabase = getClient()
  
  // Generate fingerprint
  const { generateFingerprint } = await import('./utils/fingerprint.js')
  const fingerprint = generateFingerprint({
    merchantId: rawOffer.merchant_id,
    bankId: rawOffer.bank_id,
    cardId: rawOffer.card_id,
    categoryId: rawOffer.category_id,
    offerType: rawOffer.offer_type || 'general',
    valueType: rawOffer.value_type,
    value: rawOffer.value,
    minSpend: rawOffer.min_spend,
    maxReward: rawOffer.max_reward,
    stackable: rawOffer.stackable,
    thresholdType: rawOffer.threshold_type
  })
  
  // Check for exact duplicate
  const { data: existing } = await supabase
    .from('merchant_offers')
    .select('id, title')
    .eq('fingerprint', fingerprint)
    .limit(1)
    
  if (existing && existing.length > 0) {
    return {
      hasDuplicate: true,
      duplicateId: existing[0].id,
      duplicateTitle: existing[0].title,
      action: 'skipped_duplicate'
    }
  }
  
  // Check for near duplicate (same merchant, different source)
  if (rawOffer.merchant_id) {
    const { data: near } = await supabase
      .from('merchant_offers')
      .select('id, title, source')
      .eq('merchant_id', rawOffer.merchant_id)
      .eq('value', rawOffer.value)
      .limit(1)
      
    if (near && near.length > 0) {
      return {
        hasNearDuplicate: true,
        nearDuplicateId: near[0].id,
        nearDuplicateSource: near[0].source,
        action: 'review_needed',
        reason: 'near_duplicate_detected'
      }
    }
  }
  
  return { hasDuplicate: false, action: 'approve' }
}

/**
 * Build standardized audit payload
 */
export function buildAuditPayload(action, params = {}) {
  const { 
    reason, 
    targetMerchantOfferId, 
    fingerprint, 
    confidence,
    originalStatus,
    duplicateCheck = null
  } = params
  
  const payload = {
    action,
    timestamp: new Date().toISOString()
  }
  
  if (reason) payload.reason = reason
  if (targetMerchantOfferId) payload.targetMerchantOfferId = targetMerchantOfferId
  if (fingerprint) payload.fingerprint = fingerprint
  if (confidence) payload.confidence = confidence
  if (originalStatus) payload.originalStatus = originalStatus
  
  if (duplicateCheck) {
    payload.duplicateCheck = duplicateCheck
  }
  
  return payload
}

/**
 * Approve: Convert raw_offer to merchant_offer (with safeguard)
 */
export async function approveReview(rawOfferId, approvedBy = 'system') {
  const supabase = getClient()
  
  // Get raw offer
  const { data: raw, error: fetchError } = await supabase
    .from('raw_offers')
    .select('*')
    .eq('id', rawOfferId)
    .single()
    
  if (fetchError || !raw) {
    throw new Error(`Raw offer not found: ${rawOfferId}`)
  }
  
  // Validate preconditions
  const validation = validateReviewPreconditions(raw)
  if (!validation.valid) {
    throw new Error(`Precondition failed: ${validation.errors.join(', ')}`)
  }
  
  // Check for duplicates before approve
  const duplicateCheck = await checkDuplicateForApprove(raw)
  
  if (duplicateCheck.hasDuplicate) {
    // Block approve - duplicate now exists
    const audit = buildAuditPayload(REVIEW_ACTION.APPROVE, {
      reason: duplicateCheck.action,
      originalStatus: raw.status,
      fingerprint: duplicateCheck.fingerprint,
      duplicateCheck: {
        result: duplicateCheck.action,
        duplicateId: duplicateCheck.duplicateId,
        title: duplicateCheck.duplicateTitle
      }
    })
    
    await supabase
      .from('raw_offers')
      .update({
        status: duplicateCheck.action,
        status_notes: JSON.stringify(audit),
        processed_at: new Date().toISOString()
      })
      .eq('id', rawOfferId)
      
    return {
      success: false,
      action: duplicateCheck.action,
      reason: 'duplicate_now_exists',
      duplicateId: duplicateCheck.duplicateId
    }
  }
  
  if (duplicateCheck.hasNearDuplicate) {
    // Send back to review
    const audit = buildAuditPayload(REVIEW_ACTION.APPROVE, {
      reason: duplicateCheck.reason,
      originalStatus: raw.status,
      duplicateCheck: {
        result: 'review_needed',
        nearDuplicateId: duplicateCheck.nearDuplicateId
      }
    })
    
    await supabase
      .from('raw_offers')
      .update({
        status: 'review',
        status_notes: JSON.stringify(audit),
        processed_at: new Date().toISOString()
      })
      .eq('id', rawOfferId)
      
    return {
      success: false,
      action: 'review_needed',
      reason: 'near_duplicate_detected',
      nearDuplicateId: duplicateCheck.nearDuplicateId
    }
  }
  
  // Generate fingerprint
  const { generateFingerprint } = await import('./utils/fingerprint.js')
  const fingerprint = generateFingerprint({
    merchantId: raw.merchant_id,
    bankId: raw.bank_id,
    cardId: raw.card_id,
    categoryId: raw.category_id,
    offerType: raw.offer_type || 'general',
    valueType: raw.value_type,
    value: raw.value,
    minSpend: raw.min_spend,
    maxReward: raw.max_reward,
    stackable: raw.stackable,
    thresholdType: raw.threshold_type
  })
  
  // Insert into merchant_offers
  const { data: inserted, error: insertError } = await supabase
    .from('merchant_offers')
    .insert({
      merchant_id: raw.merchant_id,
      bank_id: raw.bank_id,
      card_id: raw.card_id,
      category_id: raw.category_id,
      title: raw.title,
      description: raw.description,
      offer_type: raw.offer_type || 'general',
      value_type: raw.value_type,
      value: raw.value,
      reward_unit: raw.reward_unit,
      min_spend: raw.min_spend,
      max_reward: raw.max_reward,
      threshold_type: raw.threshold_type,
      code: raw.code,
      registration_required: raw.registration_required,
      stackable: raw.stackable,
      valid_from: raw.valid_from,
      valid_to: raw.valid_to,
      source: raw.source,
      terms: raw.terms,
      is_verified: true,
      confidence: raw.confidence || 'MEDIUM',
      status: 'ACTIVE',
      is_active: true,
      fingerprint: fingerprint,
      raw_offer_id: rawOfferId,
      source_url: raw.url,
      source_name: raw.source,
      parser_version: 'v1',
      parsed_at: raw.processed_at || new Date().toISOString()
    })
    .select()
    .single()
    
  if (insertError) {
    throw new Error(`Failed to insert merchant offer: ${insertError.message}`)
  }
  
  // Update with standardized audit
  const audit = buildAuditPayload(REVIEW_ACTION.APPROVE, {
    originalStatus: raw.status,
    fingerprint,
    confidence: raw.confidence || 'MEDIUM'
  })
  
  await supabase
    .from('raw_offers')
    .update({
      status: REVIEW_ACTION.APPROVE,
      status_notes: JSON.stringify(audit),
      processed_at: new Date().toISOString()
    })
    .eq('id', rawOfferId)
    
  return { success: true, merchantOfferId: inserted.id, fingerprint }
}

/**
 * Reject: Mark raw_offer as rejected
 */
export async function rejectReview(rawOfferId, reason, rejectedBy = 'system') {
  const supabase = getClient()
  
  // Get raw offer
  const { data: raw, error: fetchError } = await supabase
    .from('raw_offers')
    .select('*')
    .eq('id', rawOfferId)
    .single()
    
  if (fetchError || !raw) {
    throw new Error(`Raw offer not found: ${rawOfferId}`)
  }
  
  // Validate preconditions
  const validation = validateReviewPreconditions(raw)
  if (!validation.valid) {
    throw new Error(`Precondition failed: ${validation.errors.join(', ')}`)
  }
  
  // Build audit payload
  const audit = buildAuditPayload(REVIEW_ACTION.REJECT, {
    reason,
    originalStatus: raw.status
  })
  
  // Update raw offer status
  const { error: updateError } = await supabase
    .from('raw_offers')
    .update({
      status: REVIEW_ACTION.REJECT,
      status_notes: JSON.stringify(audit),
      processed_at: new Date().toISOString()
    })
    .eq('id', rawOfferId)
    
  if (updateError) {
    throw new Error(`Failed to reject: ${updateError.message}`)
  }
  
  return { success: true, status: REVIEW_ACTION.REJECT }
}

/**
 * Merge: Link raw_offer to existing merchant_offer
 */
export async function mergeReview(rawOfferId, targetMerchantOfferId, mergedBy = 'system') {
  const supabase = getClient()
  
  // Get raw offer
  const { data: raw, error: fetchError } = await supabase
    .from('raw_offers')
    .select('*')
    .eq('id', rawOfferId)
    .single()
    
  if (fetchError || !raw) {
    throw new Error(`Raw offer not found: ${rawOfferId}`)
  }
  
  // Validate preconditions
  const validation = validateReviewPreconditions(raw)
  if (!validation.valid) {
    throw new Error(`Precondition failed: ${validation.errors.join(', ')}`)
  }
  
  // Verify target exists
  const { data: target, error: targetError } = await supabase
    .from('merchant_offers')
    .select('id, title')
    .eq('id', targetMerchantOfferId)
    .single()
    
  if (targetError || !target) {
    throw new Error(`Target merchant offer not found: ${targetMerchantOfferId}`)
  }
  
  // Build audit payload
  const audit = buildAuditPayload(REVIEW_ACTION.MERGE, {
    targetMerchantOfferId,
    targetTitle: target.title,
    originalStatus: raw.status
  })
  
  // Update raw offer with merge info
  const { error: updateError } = await supabase
    .from('raw_offers')
    .update({
      status: REVIEW_ACTION.MERGE,
      status_notes: JSON.stringify(audit),
      processed_at: new Date().toISOString()
    })
    .eq('id', rawOfferId)
    
  if (updateError) {
    throw new Error(`Failed to merge: ${updateError.message}`)
  }
  
  return { success: true, status: REVIEW_ACTION.MERGE, targetMerchantOfferId }
}

/**
 * Execute action on review offer
 */
export async function executeReviewAction(rawOfferId, action, params = {}) {
  const { targetMerchantOfferId, reason, user } = params
  
  switch (action) {
    case REVIEW_ACTION.APPROVE:
      return approveReview(rawOfferId, user)
    case REVIEW_ACTION.REJECT:
      return rejectReview(rawOfferId, reason, user)
    case REVIEW_ACTION.MERGE:
      return mergeReview(rawOfferId, targetMerchantOfferId, user)
    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

export default {
  REVIEW_ACTION,
  validateReviewPreconditions,
  checkDuplicateForApprove,
  buildAuditPayload,
  parseStatusNotes,
  approveReview,
  rejectReview,
  mergeReview,
  executeReviewAction
}
