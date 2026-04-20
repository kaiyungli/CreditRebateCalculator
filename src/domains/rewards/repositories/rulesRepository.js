/**
 * Rewards Domain - Rules Repository
 * Database access for reward rules
 */

import { getRewardRules } from '../../../lib/db'

export async function findRules(params) {
  return getRewardRules(params)
}

export async function findRulesForCard(cardId, merchantId, categoryId) {
  const cardIds = cardId ? [cardId] : []
  return getRewardRules({
    cardIds,
    merchantId,
    categoryId
  })
}

export default { findRules, findRulesForCard }
