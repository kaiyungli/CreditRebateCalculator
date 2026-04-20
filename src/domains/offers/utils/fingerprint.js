/**
 * Offer Fingerprint Utility
 * Deterministic deduplication key
 */

/**
 * Canonicalize conditions_json for stable fingerprint
 */
export function canonicalizeConditions(conditions) {
  if (!conditions) return ''
  if (typeof conditions !== 'object') return ''
  
  function canon(obj) {
    if (obj === null || obj === undefined) return ''
    if (typeof obj === 'string') return obj.toLowerCase().trim()
    if (typeof obj === 'number') return String(obj)
    if (Array.isArray(obj)) {
      return obj.map(canon).filter(Boolean).sort().join(',')
    }
    if (typeof obj === 'object') {
      const keys = Object.keys(obj).sort()
      return keys.map(k => `${k}=${canon(obj[k])}`).join('|')
    }
    return ''
  }
  
  return canon(conditions)
}

/**
 * Generate deterministic fingerprint
 */
export function generateFingerprint(offer) {
  if (!offer) return null
  
  const identity = {
    merchant_id: offer.merchantId || offer.merchant_id || null,
    bank_id: offer.bankId || offer.bank_id || null,
    card_id: offer.cardId || offer.card_id || null,
    category_id: offer.categoryId || offer.category_id || null,
    offer_type: offer.offerType || offer.offer_type || 'general',
    value_type: offer.valueType || offer.value_type || 'PERCENT',
    value: Number(offer.value) || 0,
    min_spend: offer.minSpend ? Number(offer.minSpend) : null,
    max_reward: offer.maxReward ? Number(offer.maxReward) : null,
    stackable: offer.stackable === true,
    threshold_type: offer.thresholdType || offer.threshold_type || 'PER_TXN',
    conditions: canonicalizeConditions(offer.conditions || offer.conditions_json)
  }
  
  const parts = [
    identity.merchant_id,
    identity.bank_id,
    identity.card_id,
    identity.category_id,
    identity.offer_type,
    identity.value_type,
    Math.round(identity.value * 1000) / 1000,
    identity.min_spend,
    identity.max_reward,
    identity.stackable ? '1' : '0',
    identity.threshold_type,
    identity.conditions
  ].map(v => v === null || v === undefined ? '' : String(v))
  
  return parts.join('|')
}

export function isSameOffer(offer1, offer2) {
  return generateFingerprint(offer1) === generateFingerprint(offer2)
}

export default { canonicalizeConditions, generateFingerprint, isSameOffer }
