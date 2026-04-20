/**
 * Offers Domain - Merchants Repository
 * For category derivation from merchant
 */

import { getMerchantById } from '../../../lib/db'

/**
 * Find merchant's category
 */
export async function findMerchantCategory(merchantId) {
  try {
    const merchant = await getMerchantById(merchantId)
    if (!merchant) return null
    
    return {
      id: merchant.id,
      merchantKey: merchant.merchant_key,
      categoryId: merchant.category_id || null,
      name: merchant.name
    }
  } catch (e) {
    console.warn('Failed to find merchant category:', e.message)
    return null
  }
}

export default { findMerchantCategory }
