/**
 * Merchants Repository - Robust handling
 */

import { getMerchantById } from '../../../lib/db'

/**
 * Find merchant with category info
 */
export async function findMerchantWithCategory(merchantId) {
  try {
    const merchant = await getMerchantById(merchantId)
    if (!merchant) return { exists: false }
    
    return {
      exists: true,
      id: merchant.id,
      merchantKey: merchant.merchant_key,
      categoryId: merchant.category_id || null,
      name: merchant.name
    }
  } catch (e) {
    return { exists: false, error: e.message }
  }
}

export default { findMerchantWithCategory }
