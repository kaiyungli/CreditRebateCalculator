/**
 * Offers Domain - Offer Evaluator
 * Pure offer value calculation with threshold_type v1 support
 */

const THRESHOLD_TYPES = {
  PER_TXN: 'PER_TXN',
  MONTHLY_ACCUMULATED: 'MONTHLY_ACCUMULATED',
  CAMPAIGN_ACCUMULATED: 'CAMPAIGN_ACCUMULATED'
}

/**
 * Check if threshold_type is supported in v1
 */
export function isThresholdTypeSupported(offer) {
  return !offer.thresholdType || offer.thresholdType === THRESHOLD_TYPES.PER_TXN
}

/**
 * Estimate offer value for a given amount
 * v1: Only PER_TXN is supported
 */
export function estimateOfferValue(offer, amount) {
  if (!offer) return 0

  // Check threshold_type - v1 only supports PER_TXN
  if (!isThresholdTypeSupported(offer)) {
    return 0  // Unsupported threshold type returns 0 in v1
  }

  if (offer.minSpend && amount < Number(offer.minSpend)) {
    return 0
  }

  const value = Number(offer.value) || 0

  if (offer.valueType === 'FIXED') {
    return Math.min(value, Number(offer.maxReward) || value)
  }

  if (offer.valueType === 'PERCENT') {
    let calculated = (amount * value) / 100
    return Math.min(calculated, Number(offer.maxReward) || calculated)
  }

  return 0
}

/**
 * Get offer details with skip reason for unsupported threshold_type
 */
export function getApplicableOffersWithDetails(offers, amount) {
  if (!offers || offers.length === 0) return []

  return offers.map(offer => {
    if (!isThresholdTypeSupported(offer)) {
      return {
        id: offer.id,
        title: offer.title,
        offerType: offer.offerType,
        valueType: offer.valueType,
        value: offer.value,
        minSpend: offer.minSpend,
        maxReward: offer.maxReward,
        stackable: offer.stackable,
        thresholdType: offer.thresholdType,
        estimatedValue: 0,
        skippedReason: `threshold_type:${offer.thresholdType}`
      }
    }
    
    if (offer.minSpend && amount < Number(offer.minSpend)) {
      return {
        id: offer.id,
        title: offer.title,
        estimatedValue: 0,
        skippedReason: 'minSpend:not_met'
      }
    }
    
    const estimatedValue = estimateOfferValue(offer, amount)
    
    return {
      id: offer.id,
      title: offer.title,
      offerType: offer.offerType,
      valueType: offer.valueType,
      value: offer.value,
      minSpend: offer.minSpend,
      maxReward: offer.maxReward,
      stackable: offer.stackable,
      thresholdType: offer.thresholdType,
      estimatedValue
    }
  }).filter(o => o.estimatedValue > 0 || o.skippedReason)
}

/**
 * Calculate total value with stackable v1 and threshold_type v1
 */
export function calculateTotalOfferValue(offers, amount) {
  if (!offers || offers.length === 0) return 0

  // Separate by stackable
  const stackable = offers.filter(o => o.stackable === true && isThresholdTypeSupported(o))
  const nonStackable = offers.filter(o => o.stackable !== true && isThresholdTypeSupported(o))

  const stackableValue = stackable.reduce((sum, offer) => {
    return sum + estimateOfferValue(offer, amount)
  }, 0)

  const nonStackableValues = nonStackable.map(offer => ({
    offer,
    value: estimateOfferValue(offer, amount)
  }))

  if (nonStackable.length > 0) {
    return Math.max(...nonStackableValues.map(n => n.value))
  }
  
  return stackableValue
}

/**
 * Filter offers for specific card/bank
 */
export function filterOffersForCard(offers, cardId, bankId) {
  if (!offers) return []
  
  return offers.filter(offer => {
    if (offer.cardId && offer.cardId !== cardId) return false
    if (offer.bankId && offer.bankId !== bankId) return false
    return true
  })
}

export { THRESHOLD_TYPES }
