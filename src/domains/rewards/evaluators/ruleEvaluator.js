/**
 * Rewards Domain - Rule Evaluator
 * Pure reward calculation using normalized (camelCase) objects
 */

/**
 * Choose the best reward rule for a card
 * Priority: MERCHANT > CATEGORY > GENERAL
 * Uses camelCase: cardId, merchantId, categoryId
 */
export function chooseBestRule(rules, cardId) {
  const cardRules = rules.filter(r => r.cardId === cardId)
  if (!cardRules || cardRules.length === 0) return null

  // Merchant-specific (highest priority)
  const merchantRule = cardRules.find(r => r.merchantId != null)
  if (merchantRule) return { ...merchantRule, scopeType: 'MERCHANT' }

  // Category-specific
  const categoryRule = cardRules.find(r => r.categoryId != null && r.merchantId == null)
  if (categoryRule) return { ...categoryRule, scopeType: 'CATEGORY' }

  // General (fallback)
  const generalRule = cardRules.find(r => r.merchantId == null && r.categoryId == null)
  if (generalRule) return { ...generalRule, scopeType: 'GENERAL' }

  return null
}

/**
 * Calculate reward based on rule type
 * Uses camelCase: rateUnit, rateValue, perAmount, capValue, minSpend
 */
export function calculateReward(rule, amount) {
  if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }

  const rateValue = Number(rule.rateValue)
  let rewardAmount = 0

  if (rule.rateUnit === 'PERCENT') {
    rewardAmount = (amount * rateValue) / 100
  } else if (rule.rateUnit === 'PER_AMOUNT') {
    const perAmount = Number(rule.perAmount) || 1
    rewardAmount = Math.floor(amount / perAmount) * rateValue
  } else if (rule.rateUnit === 'FIXED') {
    rewardAmount = rateValue
  }

  // Apply cap
  if (rule.capValue && rule.capValue > 0) {
    rewardAmount = Math.min(rewardAmount, Number(rule.capValue))
  }

  const rewardKind = rule.rewardKind || 'CASHBACK'
  const effectiveRate = rule.rateUnit === 'PERCENT' ? rateValue : null

  return {
    rewardAmount: Math.round(rewardAmount * 100) / 100,
    rewardKind,
    effectiveRate
  }
}

/**
 * Check if rule meets minSpend requirement
 */
export function meetsMinSpend(rule, amount) {
  if (!rule || !rule.minSpend) return true
  return amount >= Number(rule.minSpend)
}
