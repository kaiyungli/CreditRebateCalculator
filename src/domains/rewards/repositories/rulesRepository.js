/**
 * Rewards Domain - Rules Repository
 * Read-only access to reward rules
 */

import { getRewardRules } from '../../../lib/db'

/**
 * Find all active reward rules for given cards
 * @param {number[]} cardIds - Card IDs to query
 * @param {number} [merchantId] - Optional merchant ID filter
 * @param {number} [categoryId] - Optional category ID filter
 * @returns {Promise<Array>} Active reward rules
 */
export async function findRules({ cardIds, merchantId, categoryId } = {}) {
  return getRewardRules({
    cardIds,
    merchantId,
    categoryId
  })
}

/**
 * Find rules for a specific card
 * @param {number} cardId 
 * @returns {Promise<Array>}
 */
export async function findRulesForCard(cardId) {
  return getRewardRules({ cardIds: [cardId] })
}

export default { findRules, findRulesForCard }
