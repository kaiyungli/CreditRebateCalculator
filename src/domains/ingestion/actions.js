/**
 * Review Action System
 * 
 * Handles manual resolution of review_needed offers
 * Actions: approve, reject, merge
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

/**
 * Approve: Convert raw_offer to merchant_offer
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
  
  // Generate fingerprint if not exists
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
  
  // Update raw offer status
  await supabase
    .from('raw_offers')
    .update({
      status: REVIEW_ACTION.APPROVE,
      status_notes: JSON.stringify({
        action: REVIEW_ACTION.APPROVE,
        approvedBy,
        merchantOfferId: inserted.id,
        fingerprint
      }),
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
  
  // Update raw offer status
  const { error: updateError } = await supabase
    .from('raw_offers')
    .update({
      status: REVIEW_ACTION.REJECT,
      status_notes: JSON.stringify({
        action: REVIEW_ACTION.REJECT,
        reason,
        rejectedBy
      }),
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
  
  // Verify target exists
  const { data: target, error: targetError } = await supabase
    .from('merchant_offers')
    .select('id, title')
    .eq('id', targetMerchantOfferId)
    .single()
    
  if (targetError || !target) {
    throw new Error(`Target merchant offer not found: ${targetMerchantOfferId}`)
  }
  
  // Update raw offer with merge info
  const { error: updateError } = await supabase
    .from('raw_offers')
    .update({
      status: REVIEW_ACTION.MERGE,
      status_notes: JSON.stringify({
        action: REVIEW_ACTION.MERGE,
        mergedBy,
        targetMerchantOfferId,
        targetTitle: target.title
      }),
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
  approveReview,
  rejectReview,
  mergeReview,
  executeReviewAction
}
