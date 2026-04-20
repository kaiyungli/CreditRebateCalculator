/**
 * Offers Domain - Offers Repository
 * Database access for merchant offers
 */

import { getMerchantOffers } from '../../../lib/db'

export async function findOffers(params) {
  return getMerchantOffers(params)
}

export async function findOffersForMerchant(merchantId, cardIds, bankIds) {
  return getMerchantOffers({
    merchantId,
    cardIds,
    bankIds
  })
}

export default { findOffers, findOffersForMerchant }
