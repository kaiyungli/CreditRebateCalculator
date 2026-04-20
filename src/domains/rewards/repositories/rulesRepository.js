/**
 * Rewards Domain - Rules Repository
 * Robust runtime handling
 */

import { getRewardRules as getRawRules } from '../../../lib/db'

/**
 * Safely normalize rule
 */
function normalizeRule(rule) {
  if (!rule) return null
  
  return {
    id: rule.id,
    cardId: rule.cardId || rule.card_id,
    merchantId: rule.merchantId || rule.merchant_id || null,
    categoryId: rule.categoryId || rule.category_id || null,
    rewardKind: rule.rewardKind || rule.reward_kind || 'CASHBACK',
    rateUnit: rule.rateUnit || rule.rate_unit,
    rateValue: Number(rule.rateValue || rule.rate_value) || 0,
    perAmount: rule.perAmount || rule.per_amount ? Number(rule.perAmount || rule.per_amount) : null,
    capValue: rule.capValue || rule.cap_value ? Number(rule.capValue || rule.cap_value) : null,
    capPeriod: rule.capPeriod || rule.cap_period || 'MONTHLY',
    minSpend: rule.minSpend || rule.min_spend ? Number(rule.minSpend || rule.min_spend) : null,
    priority: rule.priority || 100,
    cardName: rule.cardName || rule.card_name,
    bankName: rule.bankName || rule.bank_name
  }
}

/**
 * Safely validate rule
 */
function isValidRule(rule) {
  if (!rule) return false
  const today = new Date().toISOString().split('T')[0]
  if (rule.validFrom && rule.validFrom > today) return false
  if (rule.validTo && rule.validTo < today) return false
  return true
}

/**
 * Find normalized rules - safe
 */
export async function findRules({ cardIds, merchantId, categoryId } = {}) {
  try {
    const rawRules = await getRawRules({ cardIds, merchantId, categoryId })
    if (!rawRules || !Array.isArray(rawRules)) return []
    
    const normalized = rawRules.map(normalizeRule).filter(Boolean)
    return normalized.filter(isValidRule)
  } catch (e) {
    console.error('Error fetching rules:', e.message)
    return []
  }
}

/**
 * Find rules for a card - safe
 */
export async function findRulesForCard(cardId) {
  return findRules({ cardIds: [cardId] })
}

export default { findRules, findRulesForCard }
