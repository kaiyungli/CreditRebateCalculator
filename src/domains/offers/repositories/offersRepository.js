/**
 * Offers Domain - Offers Repository
 * Normalized access to merchant offers
 */

import { getMerchantOffers } from '../../../lib/db'

/**
 * Normalize raw DB row into camelCase domain object
 */
function normalizeOffer(offer) {
  if (!offer) return null
  
  return {
    id: offer.id,
    merchantId: offer.merchant_id || null,
    bankId: offer.bank_id || null,
    cardId: offer.card_id || null,
    categoryId: offer.category_id || null,
    title: offer.title,
    description: offer.description || null,
    offerType: offer.offer_type,
    valueType: offer.value_type,
    value: Number(offer.value) || 0,
    minSpend: offer.min_spend ? Number(offer.min_spend) : null,
    maxReward: offer.max_reward ? Number(offer.max_reward) : null,
    thresholdType: offer.threshold_type || 'PER_TXN',  // Default: PER_TXN
    startDate: offer.start_date || null,
    endDate: offer.end_date || null,
    isActive: offer.is_active !== false,
    stackable: offer.stackable === true,
    source: offer.source || null,
    isVerified: offer.is_verified === true,
    status: offer.status
  }
}

function normalizeOffers(offers) {
  if (!offers || offers.length === 0) return []
  return offers.map(normalizeOffer).filter(Boolean)
}

function isValidOffer(offer) {
  if (!offer) return false
  if (!offer.isActive) return false
  
  const today = new Date().toISOString().split('T')[0]
  
  if (offer.startDate && offer.startDate > today) return false
  if (offer.endDate && offer.endDate < today) return false
  
  return true
}

function filterByCardOrBank(offers, cardIds, bankIds) {
  if (!offers || offers.length === 0) return []
  
  return offers.filter(offer => {
    if (offer.cardId && cardIds?.length > 0 && !cardIds.includes(offer.cardId)) return false
    if (offer.bankId && bankIds?.length > 0 && !bankIds.includes(offer.bankId)) return false
    return true
  })
}

export async function findOffers({ merchantId, cardIds, bankIds } = {}) {
  const rawOffers = await getMerchantOffers({ merchantId })
  
  const normalized = normalizeOffers(rawOffers)
  const validOffers = normalized.filter(isValidOffer)
  
  return filterByCardOrBank(validOffers, cardIds, bankIds)
}

export async function findOffersForMerchant(merchantId) {
  const rawOffers = await getMerchantOffers({ merchantId })
  const normalized = normalizeOffers(rawOffers)
  return normalized.filter(isValidOffer)
}

export default { 
  findOffers, 
  findOffersForMerchant,
  normalizeOffer,
  normalizeOffers,
  isValidOffer,
  filterByCardOrBank
}
