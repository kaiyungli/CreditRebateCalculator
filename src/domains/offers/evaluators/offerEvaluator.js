/**
 * Offers Domain - Offer Evaluator
 * Pure offer value calculation with conditions_json v1 support
 */

const THRESHOLD_TYPES = {
  PER_TXN: 'PER_TXN',
  MONTHLY_ACCUMULATED: 'MONTHLY_ACCUMULATED',
  CAMPAIGN_ACCUMULATED: 'CAMPAIGN_ACCUMULATED'
}

const SUPPORTED_CONDITIONS = ['channel', 'wallet', 'weekday']

/**
 * Check if threshold_type is supported in v1
 */
export function isThresholdTypeSupported(offer) {
  return !offer.thresholdType || offer.thresholdType === THRESHOLD_TYPES.PER_TXN
}

/**
 * Check if conditions_json is satisfied
 * v1: supports channel, wallet, weekday
 * 
 * @param {Object} conditions - conditions_json from offer
 * @param {Object} input - transaction input { channel, wallet, weekday }
 * @returns {{ satisfied: boolean, reason?: string }}
 */
export function evaluateConditions(conditions, input = {}) {
  if (!conditions || typeof conditions !== 'object') {
    return { satisfied: true }
  }
  
  const unsupportedKeys = Object.keys(conditions).filter(k => !SUPPORTED_CONDITIONS.includes(k))
  if (unsupportedKeys.length > 0) {
    // Unknown keys are ignored in v1, but we record assumption
    return { satisfied: true, assumption: `unsupportedConditionKey:${unsupportedKeys.join(',')}` }
  }
  
  // Check channel
  if (conditions.channel && conditions.channel !== 'all') {
    const inputChannel = input.channel || 'all'
    if (conditions.channel !== inputChannel) {
      return { satisfied: false, reason: 'channel' }
    }
  }
  
  // Check wallet
  if (conditions.wallet && conditions.wallet !== 'all') {
    const inputWallet = input.wallet || 'all'
    if (conditions.wallet !== inputWallet) {
      return { satisfied: false, reason: 'wallet' }
    }
  }
  
  // Check weekday
  if (conditions.weekday && conditions.weekday !== 'all') {
    const inputWeekday = input.weekday || null
    if (!inputWeekday) {
      return { satisfied: false, reason: 'weekday:missing_input' }
    }
    if (conditions.weekday !== inputWeekday) {
      return { satisfied: false, reason: 'weekday' }
    }
  }
  
  return { satisfied: true }
}

/**
 * Estimate offer value for a given amount
 */
export function estimateOfferValue(offer, amount, input = {}) {
  if (!offer) return 0

  // Check threshold_type
  if (!isThresholdTypeSupported(offer)) {
    return 0
  }

  // Check conditions_json
  if (offer.conditions) {
    const conditionResult = evaluateConditions(offer.conditions, input)
    if (!conditionResult.satisfied) {
      return 0
    }
  }

  if (offer.minSpend && amount < Number(offer.minSpend)) {
    return 0
  }

  const value = Number(offer.value) || 0

  if (offer.valueType === 'FIXED') {
    return Math.min(value, Number(offer.maxReward) || value)
  }

  if (offer.valueType === 'PERCENT') {
    let calculated = (amount * value) / 100
    return Math.min(calculated, Number(offer.maxReward) || calculated)
  }

  return 0
}

/**
 * Get offer details with skip reason
 */
export function getApplicableOffersWithDetails(offers, amount, input = {}) {
  if (!offers || offers.length === 0) return []

  return offers.map(offer => {
    let skipReason = null
    let assumption = null
    
    // Check threshold_type
    if (!isThresholdTypeSupported(offer)) {
      return {
        id: offer.id,
        title: offer.title,
        offerType: offer.offerType,
        valueType: offer.valueType,
        value: offer.value,
        stackable: offer.stackable,
        thresholdType: offer.thresholdType,
        estimatedValue: 0,
        skippedReason: `threshold_type:${offer.thresholdType}`
      }
    }
    
    // Check conditions
    if (offer.conditions) {
      const conditionResult = evaluateConditions(offer.conditions, input)
      if (!conditionResult.satisfied) {
        return {
          id: offer.id,
          title: offer.title,
          estimatedValue: 0,
          skippedReason: `condition:${conditionResult.reason}`
        }
      }
      if (conditionResult.assumption) {
        assumption = conditionResult.assumption
      }
    }
    
    // Check minSpend
    if (offer.minSpend && amount < Number(offer.minSpend)) {
      return {
        id: offer.id,
        title: offer.title,
        estimatedValue: 0,
        skippedReason: 'minSpend:not_met'
      }
    }
    
    const estimatedValue = estimateOfferValue(offer, amount, input)
    
    return {
      id: offer.id,
      title: offer.title,
      offerType: offer.offerType,
      valueType: offer.valueType,
      value: offer.value,
      minSpend: offer.minSpend,
      maxReward: offer.maxReward,
      stackable: offer.stackable,
      thresholdType: offer.thresholdType,
      conditions: offer.conditions,
      estimatedValue,
      assumption
    }
  }).filter(o => o.estimatedValue > 0 || o.skippedReason || o.assumption)
}

/**
 * Calculate total value
 */
export function calculateTotalOfferValue(offers, amount, input = {}) {
  if (!offers || offers.length === 0) return 0

  const stackable = offers.filter(o => o.stackable === true && isThresholdTypeSupported(o) && evaluateConditions(o.conditions, input).satisfied)
  const nonStackable = offers.filter(o => o.stackable !== true && isThresholdTypeSupported(o) && evaluateConditions(o.conditions, input).satisfied)

  const stackableValue = stackable.reduce((sum, offer) => {
    return sum + estimateOfferValue(offer, amount, input)
  }, 0)

  const nonStackableValues = nonStackable.map(offer => ({
    offer,
    value: estimateOfferValue(offer, amount, input)
  }))

  if (nonStackable.length > 0) {
    return Math.max(...nonStackableValues.map(n => n.value))
  }
  
  return stackableValue
}

export function filterOffersForCard(offers, cardId, bankId) {
  if (!offers) return []
  
  return offers.filter(offer => {
    if (offer.cardId && offer.cardId !== cardId) return false
    if (offer.bankId && offer.bankId !== bankId) return false
    return true
  })
}

export { THRESHOLD_TYPES, SUPPORTED_CONDITIONS }
