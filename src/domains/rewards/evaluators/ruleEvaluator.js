/**
 * Rewards Domain - Rule Evaluator
 * Robust runtime handling for malformed data
 */

const VALID_RATE_UNITS = ['PERCENT', 'FIXED', 'PER_AMOUNT']
const VALID_REWARD_KINDS = ['CASHBACK', 'POINTS', 'MILES']

/**
 * Validate rule - returns valid rule or null with reason
 */
function validateRule(rule) {
  if (!rule) return { valid: false, reason: 'invalidRule:null' }
  
  if (!rule.cardId && rule.id) {
    // Allow if has id for tracking
  }
  
  // Validate rateUnit
  if (rule.rateUnit && !VALID_RATE_UNITS.includes(rule.rateUnit)) {
    return { valid: false, reason: 'invalidRule:rateUnit' }
  }
  
  // Validate rateValue is a number
  const rateValue = Number(rule.rateValue)
  if (isNaN(rateValue) || rateValue < 0) {
    return { valid: false, reason: 'invalidRule:rateValue' }
  }
  
  // Validate minSpend if present
  if (rule.minSpend !== undefined && rule.minSpend !== null) {
    const minSpend = Number(rule.minSpend)
    if (isNaN(minSpend) || minSpend < 0) {
      return { valid: false, reason: 'invalidRule:minSpend' }
    }
  }
  
  // Validate capValue if present
  if (rule.capValue !== undefined && rule.capValue !== null) {
    const capValue = Number(rule.capValue)
    if (isNaN(capValue) || capValue < 0) {
      return { valid: false, reason: 'invalidRule:capValue' }
    }
  }
  
  return { valid: true }
}

/**
 * Choose best rule - safely
 */
export function chooseBestRule(rules, cardId) {
  if (!rules || !Array.isArray(rules) || rules.length === 0) return null
  
  // Filter to only valid rules
  const validRules = rules.filter(r => validateRule(r).valid)
  
  const cardRules = validRules.filter(r => r.cardId === cardId)
  if (!cardRules || cardRules.length === 0) return null

  const merchantRule = cardRules.find(r => r.merchantId != null)
  if (merchantRule) return { ...merchantRule, scopeType: 'MERCHANT' }

  const categoryRule = cardRules.find(r => r.categoryId != null && r.merchantId == null)
  if (categoryRule) return { ...categoryRule, scopeType: 'CATEGORY' }

  const generalRule = cardRules.find(r => r.merchantId == null && r.categoryId == null)
  if (generalRule) return { ...generalRule, scopeType: 'GENERAL' }

  return null
}

/**
 * Calculate reward - safely
 */
export function calculateReward(rule, amount) {
  if (!rule) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }
  
  const validation = validateRule(rule)
  if (!validation.valid) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }

  const rateValue = Number(rule.rateValue)
  if (isNaN(rateValue)) return { rewardAmount: 0, rewardKind: null, effectiveRate: null }

  let rewardAmount = 0

  if (rule.rateUnit === 'PERCENT') {
    rewardAmount = (amount * rateValue) / 100
  } else if (rule.rateUnit === 'PER_AMOUNT') {
    const perAmount = Number(rule.perAmount) || 1
    rewardAmount = Math.floor(amount / perAmount) * rateValue
  } else if (rule.rateUnit === 'FIXED') {
    rewardAmount = rateValue
  }

  const capValue = Number(rule.capValue)
  if (rule.capValue && !isNaN(capValue) && capValue > 0) {
    rewardAmount = Math.min(rewardAmount, capValue)
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
 * Safely check minSpend
 */
export function meetsMinSpend(rule, amount) {
  if (!rule) return true
  
  const validation = validateRule(rule)
  if (!validation.valid) return true

  const minSpend = Number(rule.minSpend)
  if (!minSpend || isNaN(minSpend)) return true
  
  return amount >= minSpend
}
