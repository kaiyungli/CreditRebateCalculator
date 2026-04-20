/**
 * Offers Domain - Offer Evaluator
 * Pure offer value calculation with stackable v1 support
 */

/**
 * Estimate offer value for a given amount
 */
export function estimateOfferValue(offer, amount) {
  if (!offer) return 0

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
 * Calculate total value for multiple offers
 * Stackable v1 logic:
 * - If ALL offers are stackable → sum them
 * - If ANY non-stackable exists → pick highest non-stackable only
 * - Do NOT mix stackable + non-stackable in v1
 */
export function calculateTotalOfferValue(offers, amount) {
  if (!offers || offers.length === 0) return 0

  // Separate stackable and non-stackable offers
  const stackableOffers = offers.filter(o => o.stackable === true)
  const nonStackableOffers = offers.filter(o => o.stackable !== true)

  // Calculate values
  const stackableValue = stackableOffers.reduce((sum, offer) => {
    return sum + estimateOfferValue(offer, amount)
  }, 0)

  const nonStackableValues = nonStackableOffers.map(offer => ({
    offer,
    value: estimateOfferValue(offer, amount)
  }))

  // V1 Logic:
  // - If we have non-stackable offers, use the highest one only
  // - If all are stackable (or no non-stackable), sum stackable offers
  // - Do NOT combine stackable + non-stackable in v1
  
  if (nonStackableOffers.length > 0) {
    // Has non-stackable: pick highest non-stackable only
    const bestNonStackable = nonStackableValues
      .sort((a, b) => b.value - a.value)[0]
    return bestNonStackable ? bestNonStackable.value : 0
  } else {
    // All stackable or no offers
    return stackableValue
  }
}

/**
 * Get applicable offers with their values and stackable status
 * Returns array for debugging/explanation
 */
export function getApplicableOffersWithDetails(offers, amount) {
  if (!offers || offers.length === 0) return []

  return offers.map(offer => ({
    id: offer.id,
    title: offer.title,
    offerType: offer.offerType,
    valueType: offer.valueType,
    value: offer.value,
    minSpend: offer.minSpend,
    maxReward: offer.maxReward,
    stackable: offer.stackable,
    estimatedValue: estimateOfferValue(offer, amount)
  })).filter(o => o.estimatedValue > 0)
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
