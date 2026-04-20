/**
 * Offers Domain - Offer Evaluator
 * Pure offer value calculation using normalized (camelCase) objects
 * Domain field: maxReward (NOT maxDiscount)
 */

/**
 * Estimate offer value for a given amount
 * Uses camelCase: minSpend, valueType, maxReward, value
 */
export function estimateOfferValue(offer, amount) {
  if (!offer) return 0

  // Check minSpend
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
 */
export function calculateTotalOfferValue(offers, amount) {
  if (!offers || offers.length === 0) return 0
  
  return offers.reduce((sum, offer) => {
    return sum + estimateOfferValue(offer, amount)
  }, 0)
}

/**
 * Get applicable offers for a specific card/bank
 * Uses camelCase: cardId, bankId
 */
export function filterOffersForCard(offers, cardId, bankId) {
  if (!offers) return []
  
  return offers.filter(offer => {
    if (offer.cardId && offer.cardId !== cardId) return false
    if (offer.bankId && offer.bankId !== bankId) return false
    return true
  })
}
