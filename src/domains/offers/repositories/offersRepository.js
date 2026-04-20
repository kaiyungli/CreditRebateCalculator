/**
 * Offers Domain - Offers Repository
 * Read-only access to merchant offers
 */

import { getMerchantOffers } from '../../../lib/db'

/**
 * Find active offers for a transaction
 * @param {number} [merchantId] - Merchant ID
 * @param {number[]} [cardIds] - Card IDs
 * @param {number[]} [bankIds] - Bank IDs
 * @returns {Promise<Array>} Active offers
 */
export async function findOffers({ merchantId, cardIds, bankIds } = {}) {
  return getMerchantOffers({
    merchantId,
    cardIds,
    bankIds
  })
}

/**
 * Find offers for a specific merchant
 * @param {number} merchantId
 * @returns {Promise<Array>}
 */
export async function findOffersForMerchant(merchantId) {
  return getMerchantOffers({ merchantId })
}

export default { findOffers, findOffersForMerchant }
