/**
 * Calculator Domain - Rule Evaluator
 * Evaluates reward rules for a transaction
 */

import { getRewardRules } from '../../../lib/db'

/**
 * Choose the best reward rule for a card
 * Priority: MERCHANT > CATEGORY > GENERAL
 */
export function chooseBestRule(rules, cardId) {
  const cardRules = rules.filter(r => r.card_id === cardId)
  if (!cardRules || cardRules.length === 0) return null

  // Find merchant-specific rule (highest priority)
  const merchantRule = cardRules.find(r => r.merchant_id != null)
  if (merchantRule) return { ...merchantRule, scope_type: 'MERCHANT' }

  // Find category-specific rule
  const categoryRule = cardRules.find(r => r.category_id != null && r.merchant_id == null)
  if (categoryRule) return { ...categoryRule, scope_type: 'CATEGORY' }

  // Fall back to general rule
  const generalRule = cardRules.find(r => r.merchant_id == null && r.category_id == null)
  if (generalRule) return { ...generalRule, scope_type: 'GENERAL' }

  return null
}

/**
 * Calculate reward based on rule type
 */
export function calculateReward(rule, amount) {
  if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }

  const rateValue = Number(rule.rate_value)
  let rewardAmount = 0

  if (rule.rate_unit === 'PERCENT') {
    rewardAmount = (amount * rateValue) / 100
  } else if (rule.rate_unit === 'PER_AMOUNT') {
    const perAmount = Number(rule.per_amount) || 1
    rewardAmount = Math.floor(amount / perAmount) * rateValue
  } else if (rule.rate_unit === 'FIXED') {
    rewardAmount = rateValue
  }

  // Apply cap if exists
  if (rule.cap_value && rule.cap_value > 0) {
    rewardAmount = Math.min(rewardAmount, Number(rule.cap_value))
  }

  const rewardKind = rule.reward_kind || 'CASHBACK'
  const effectiveRate = rule.rate_unit === 'PERCENT' ? rateValue : null

  return {
    rewardAmount: Math.round(rewardAmount * 100) / 100,
    rewardKind,
    effectiveRate
  }
}

/**
 * Check if rule meets min_spend requirement
 */
export function meetsMinSpend(rule, amount) {
  if (!rule || !rule.min_spend) return true
  return amount >= Number(rule.min_spend)
}
