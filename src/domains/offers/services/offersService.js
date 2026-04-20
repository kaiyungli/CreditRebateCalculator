/**
 * Offers Domain - Offers Service
 * Business logic for offers
 */

import { getAllActiveOffers, calculateOfferValue, getApplicableOffers } from '../../../lib/offers'

export async function getActiveOffersList(limit = 50) {
  return getAllActiveOffers(limit)
}

export function calculateValue(offer, amount) {
  return calculateOfferValue(offer, amount)
}

export function getMatchingOffers(offers, amount) {
  return getApplicableOffers(offers, amount)
}

export default { getActiveOffersList, calculateValue, getMatchingOffers }
