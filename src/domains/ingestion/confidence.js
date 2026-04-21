/**
 * Confidence Model for Offer Ingestion
 * 
 * Levels: LOW, MEDIUM, HIGH
 * Assignment during normalization
 */

/** Confidence levels */
export const CONFIDENCE = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM', 
  LOW: 'LOW'
}

/** Rules for confidence assignment */
export function calculateConfidence(parsedOffer) {
  const reasons = []
  let score = 0
  
  // HIGH confidence indicators (score thresholds: HIGH >= 60)
  if (parsedOffer.value && !isNaN(parseFloat(parsedOffer.value))) {
    score += 25
    reasons.push('clear_numeric_value')
  }
  
  if (parsedOffer.merchantId) {
    score += 25
    reasons.push('known_merchant')
  }
  
  if (parsedOffer.valueType && ['PERCENT', 'FIXED'].includes(parsedOffer.valueType)) {
    score += 25
    reasons.push('valid_valueType')
  }
  
  // MEDIUM indicators (+15 each, when not all HIGH)
  if (parsedOffer.categoryId) {
    score += 15
    reasons.push('category_matched')
  }
  
  if (parsedOffer.minSpend && !isNaN(parseFloat(parsedOffer.minSpend))) {
    score += 15
    reasons.push('valid_minSpend')
  }
  
  if (parsedOffer.bankId || parsedOffer.cardId) {
    score += 10
    reasons.push('bank_or_card_identified')
  }
  
  // LOW penalty indicators (only if none of above)
  if (!parsedOffer.value || isNaN(parseFloat(parsedOffer.value))) {
    score -= 20
    reasons.push('missing_value')
  }
  
  if (!parsedOffer.valueType) {
    score -= 15
    reasons.push('missing_valueType')
  }
  
  if (!parsedOffer.merchantId && !parsedOffer.categoryId) {
    score -= 15
    reasons.push('no_merchant_or_category')
  }
  
  // Ensure minimum score
  score = Math.max(0, Math.min(100, score))
  
  // Map score to confidence
  let level = CONFIDENCE.LOW
  if (score >= 60) {
    level = CONFIDENCE.HIGH
  } else if (score >= 30) {
    level = CONFIDENCE.MEDIUM
  }
  
  return {
    level,
    score,
    reasons,
    isValid: parsedOffer.value && !isNaN(parseFloat(parsedOffer.value))
  }
}

/** Check if offer needs review */
export function needsReview(parsedOffer, confidence, duplicateFound = null, conflictFound = null) {
  const triggers = []
  
  if (confidence.level === CONFIDENCE.LOW) {
    triggers.push('low_confidence')
  }
  
  if (duplicateFound === 'near') {
    triggers.push('near_duplicate')
  }
  
  if (conflictFound) {
    triggers.push('conflict_detected')
  }
  
  if (parsedOffer.valueType === 'PERCENT' && parseFloat(parsedOffer.value) > 50) {
    triggers.push('suspiciously_high_value')
  }
  
  if (parsedOffer.unsupportedKeys?.length > 0) {
    triggers.push('unsupported_conditions')
  }
  
  return {
    needed: triggers.length > 0,
    triggers
  }
}

/** Publish decision logic */
export function shouldPublish(parsedOffer, confidence, duplicateFound = null, conflictFound = null) {
  // Check invalid first - must have value
  if (!parsedOffer.value || isNaN(parseFloat(parsedOffer.value))) {
    return { decision: 'invalid', reason: 'missing_value' }
  }
  
  if (parsedOffer.minSpend && isNaN(parseFloat(parsedOffer.minSpend))) {
    return { decision: 'invalid', reason: 'invalid_minSpend' }
  }
  
  // Check duplicate
  if (duplicateFound === 'exact') {
    return { decision: 'skipped_duplicate', reason: 'exact_duplicate' }
  }
  
  // Check review needed
  const review = needsReview(parsedOffer, confidence, duplicateFound, conflictFound)
  if (review.needed) {
    return { decision: 'review_needed', reason: review.triggers.join(', ') }
  }
  
  // Allow publish (including LOW confidence with flag)
  return { 
    decision: 'published', 
    reason: confidence.level === CONFIDENCE.LOW ? 'published_with_low_confidence' : 'ok',
    confidence: confidence.level
  }
}

/** Extract conflict info */
export function detectConflict(newOffer, existingOffers) {
  if (!existingOffers || existingOffers.length === 0) {
    return null
  }
  
  for (const existing of existingOffers) {
    if (newOffer.merchantId === existing.merchant_id &&
        newOffer.cardId === existing.card_id &&
        newOffer.value !== existing.value) {
      return {
        type: 'different_value',
        existingId: existing.id,
        existingValue: existing.value,
        newValue: newOffer.value
      }
    }
  }
  
  return null
}

export default {
  CONFIDENCE,
  calculateConfidence,
  needsReview,
  shouldPublish,
  detectConflict
}
