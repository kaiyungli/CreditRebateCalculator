/**
 * Calculator Domain - Offer Evaluator
 * Evaluates offers for a transaction
 */

import { getMerchantOffers } from '../../../lib/db'

/**
 * Estimate offer value for a given amount
 */
export function estimateOfferValue(offer, amount) {
  if (!offer) return 0

  // Check min_spend
  if (offer.min_spend && amount < Number(offer.min_spend)) {
    return 0
  }

  const value = Number(offer.value) || 0

  if (offer.value_type === 'FIXED') {
    return Math.min(value, Number(offer.max_discount) || value)
  }

  if (offer.value_type === 'PERCENT') {
    let calculated = (amount * value) / 100
    return Math.min(calculated, Number(offer.max_discount) || calculated)
  }

  return 0
}

/**
 * Calculate value for multiple offers
 */
export function calculateTotalOfferValue(offers, amount) {
  if (!offers || offers.length === 0) return 0
  
  return offers.reduce((sum, offer) => {
    return sum + estimateOfferValue(offer, amount)
  }, 0)
}

/**
 * Get applicable offers for a specific card/bank
 */
export function filterOffersForCard(offers, cardId, bankId) {
  if (!offers) return []
  
  return offers.filter(offer => {
    // Check card_id: null = all cards, or match specific card
    if (offer.card_id && offer.card_id !== cardId) return false
    // Check bank_id: null = all banks, or match specific bank
    if (offer.bank_id && offer.bank_id !== bankId) return false
    return true
  })
}
