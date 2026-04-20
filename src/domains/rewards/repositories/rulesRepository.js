/**
 * Rewards Domain - Rules Repository
 * Normalized access to reward rules
 */

import { getRewardRules as getRawRules } from '../../../lib/db'

/**
 * Normalize raw DB row to camelCase domain object
 */
function normalizeRule(rule) {
  if (!rule) return null
  
  return {
    id: rule.id,
    cardId: rule.card_id,
    merchantId: rule.merchant_id || null,
    categoryId: rule.category_id || null,
    rewardKind: rule.reward_kind,
    rateUnit: rule.rate_unit,
    rateValue: Number(rule.rate_value),
    perAmount: rule.per_amount ? Number(rule.per_amount) : null,
    capValue: rule.cap_value ? Number(rule.cap_value) : null,
    capPeriod: rule.cap_period || 'MONTHLY',
    minSpend: rule.min_spend ? Number(rule.min_spend) : null,
    priority: rule.priority || 100,
    cardName: rule.card_name,
    bankName: rule.bank_name
  }
}

/**
 * Check if rule is currently valid
 */
function isValidRule(rule) {
  if (!rule) return false
  const today = new Date().toISOString().split('T')[0]
  // valid_from NULL = always valid
  if (rule.valid_from && rule.valid_from > today) return false
  if (rule.valid_to && rule.valid_to < today) return false
  return true
}

/**
 * Find normalized rules
 */
export async function findRules({ cardIds, merchantId, categoryId } = {}) {
  const rawRules = await getRawRules({ cardIds, merchantId, categoryId })
  
  // Filter by date validity
  const validRules = rawRules.filter(isValidRule)
  
  // Normalize
  return validRules.map(normalizeRule)
}

/**
 * Find rules for a specific card
 */
export async function findRulesForCard(cardId) {
  return findRules({ cardIds: [cardId] })
}

export default { findRules, findRulesForCard }
