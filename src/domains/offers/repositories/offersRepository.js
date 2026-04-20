/**
 * Offers Domain - Offers Repository
 * Normalized access to merchant offers
 */

import { getMerchantOffers } from '../../../lib/db'

/**
 * Normalize raw DB row into camelCase domain object
 * @param {Object} offer - Raw DB row (snake_case)
 * @returns {Object} Normalized offer
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
    maxDiscount: offer.max_discount ? Number(offer.max_discount) : null,
    startDate: offer.start_date || null,
    endDate: offer.end_date || null,
    isActive: offer.is_active !== false,
    source: offer.source || null,
    isVerified: offer.is_verified === true,
    status: offer.status
  }
}

/**
 * Normalize array of offers
 * @param {Array} offers - Raw DB rows
 * @returns {Array} Normalized offers
 */
function normalizeOffers(offers) {
  if (!offers || offers.length === 0) return []
  return offers.map(normalizeOffer).filter(Boolean)
}

/**
 * Check if offer is currently valid
 * @param {Object} normalized offer
 * @returns {boolean}
 */
function isValidOffer(offer) {
  if (!offer) return false
  if (!offer.isActive) return false
  
  const today = new Date().toISOString().split('T')[0]
  
  // Not started yet
  if (offer.startDate && offer.startDate > today) return false
  
  // Expired
  if (offer.endDate && offer.endDate < today) return false
  
  return true
}

/**
 * Filter offers by card or bank ID
 * @param {Array} offers - Normalized offers
 * @param {number[]} cardIds
 * @param {number[]} bankIds
 * @returns {Array} Filtered offers
 */
function filterByCardOrBank(offers, cardIds, bankIds) {
  if (!offers || offers.length === 0) return []
  
  return offers.filter(offer => {
    // Null card_id = all cards, match specific
    if (offer.cardId && cardIds?.length > 0 && !cardIds.includes(offer.cardId)) return false
    // Null bank_id = all banks, match specific  
    if (offer.bankId && bankIds?.length > 0 && !bankIds.includes(offer.bankId)) return false
    return true
  })
}

/**
 * Find valid offers for a transaction
 * @param {number} [merchantId]
 * @param {number[]} [cardIds]
 * @param {number[]} [bankIds]
 * @returns {Promise<Array>} Normalized offers
 */
export async function findOffers({ merchantId, cardIds, bankIds } = {}) {
  // Get raw offers from DB
  const rawOffers = await getMerchantOffers({ merchantId })
  
  // Normalize to camelCase domain objects
  const normalized = normalizeOffers(rawOffers)
  
  // Filter for validity (date, is_active)
  const validOffers = normalized.filter(isValidOffer)
  
  // Filter by card/bank
  return filterByCardOrBank(validOffers, cardIds, bankIds)
}

/**
 * Find offers for a specific merchant (all valid)
 * @param {number} merchantId
 * @returns {Promise<Array>}
 */
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
