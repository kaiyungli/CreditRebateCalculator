/**
 * Offers Domain - Offer Evaluator
 * Robust runtime handling for malformed data
 */

const THRESHOLD_TYPES = {
  PER_TXN: 'PER_TXN',
  MONTHLY_ACCUMULATED: 'MONTHLY_ACCUMULATED',
  CAMPAIGN_ACCUMULATED: 'CAMPAIGN_ACCUMULATED'
}

const SUPPORTED_CONDITIONS = ['channel', 'wallet', 'weekday']
const VALID_VALUE_TYPES = ['FIXED', 'PERCENT']
const VALID_THRESHOLD_TYPES = ['PER_TXN', 'MONTHLY_ACCUMULATED', 'CAMPAIGN_ACCUMULATED']

/**
 * Validate offer - returns valid offer or null with traceable reason
 */
function validateOffer(offer) {
  if (!offer) return { valid: false, reason: 'invalidOffer:null' }
  
  // Check required fields
  if (!offer.id) return { valid: false, reason: 'invalidOffer:missingId' }
  
  // Validate valueType
  if (offer.valueType && !VALID_VALUE_TYPES.includes(offer.valueType)) {
    return { valid: false, reason: 'invalidOffer:valueType' }
  }
  
  // Validate value is number
  if (offer.value === undefined || offer.value === null || isNaN(Number(offer.value))) {
    return { valid: false, reason: 'invalidOffer:value' }
  }
  
  // Validate thresholdType
  if (offer.thresholdType && !VALID_THRESHOLD_TYPES.includes(offer.thresholdType)) {
    return { valid: false, reason: 'invalidOffer:thresholdType' }
  }
  
  // Validate conditions_json is object or null
  if (offer.conditions !== undefined && offer.conditions !== null && typeof offer.conditions !== 'object') {
    return { valid: false, reason: 'invalidConditionJson' }
  }
  
  return { valid: true }
}

/**
 * Safely check threshold_type
 */
export function isThresholdTypeSupported(offer) {
  const validation = validateOffer(offer)
  if (!validation.valid) return false
  
  const thresholdType = offer.thresholdType || 'PER_TXN'
  return thresholdType === THRESHOLD_TYPES.PER_TXN
}

/**
 * Safely evaluate conditions_json
 */
export function evaluateConditions(conditions, input = {}) {
  if (!conditions || typeof conditions !== 'object') {
    return { satisfied: true }
  }
  
  try {
    const unsupportedKeys = Object.keys(conditions).filter(k => !SUPPORTED_CONDITIONS.includes(k))
    if (unsupportedKeys.length > 0) {
      return { satisfied: true, assumption: `unsupportedConditionKey:${unsupportedKeys.join(',')}` }
    }
    
    if (conditions.channel && conditions.channel !== 'all') {
      const inputChannel = input.channel || 'all'
      if (conditions.channel !== inputChannel) {
        return { satisfied: false, reason: 'condition:channel' }
      }
    }
    
    if (conditions.wallet && conditions.wallet !== 'all') {
      if (conditions.wallet !== (input.wallet || 'all')) {
        return { satisfied: false, reason: 'condition:wallet' }
      }
    }
    
    if (conditions.weekday && conditions.weekday !== 'all') {
      if (!input.weekday) {
        return { satisfied: false, reason: 'condition:weekday:missing_input' }
      }
      if (conditions.weekday !== input.weekday) {
        return { satisfied: false, reason: 'condition:weekday' }
      }
    }
    
    return { satisfied: true }
  } catch (e) {
    // Malformed conditions_json - skip safely
    return { satisfied: false, reason: 'invalidConditionJson' }
  }
}

/**
 * Safely estimate offer value
 */
export function estimateOfferValue(offer, amount, input = {}) {
  const validation = validateOffer(offer)
  if (!validation.valid) {
    return 0
  }

  if (!isThresholdTypeSupported(offer)) {
    return 0
  }

  if (evaluateConditions(offer.conditions, input).satisfied === false) {
    return 0
  }

  // Validate minSpend
  const minSpend = Number(offer.minSpend)
  if (offer.minSpend && (!minSpend || isNaN(minSpend) || amount < minSpend)) {
    return 0
  }

  const value = Number(offer.value)
  if (isNaN(value) || value <= 0) {
    return 0
  }

  if (offer.valueType === 'FIXED') {
    const maxReward = Number(offer.maxReward)
    return Math.min(value, maxReward || value)
  }

  if (offer.valueType === 'PERCENT') {
    let calculated = (amount * value) / 100
    const maxReward = Number(offer.maxReward)
    return Math.min(calculated, maxReward || calculated)
  }

  return 0
}

/**
 * Safe offer details with validation
 */
export function getApplicableOffersWithDetails(offers, amount, input = {}) {
  if (!offers || !Array.isArray(offers) || offers.length === 0) return []

  return offers.map(offer => {
    const validation = validateOffer(offer)
    if (!validation.valid) {
      return {
        id: offer?.id || 0,
        title: offer?.title || 'Unknown',
        estimatedValue: 0,
        skippedReason: validation.reason
      }
    }
    
    // Check threshold
    if (!isThresholdTypeSupported(offer)) {
      return {
        id: offer.id,
        title: offer.title,
        estimatedValue: 0,
        skippedReason: `threshold_type:${offer.thresholdType || 'PER_TXN'}`
      }
    }
    
    // Check conditions
    const conditionResult = evaluateConditions(offer.conditions, input)
    if (!conditionResult.satisfied) {
      return {
        id: offer.id,
        title: offer.title,
        estimatedValue: 0,
        skippedReason: conditionResult.reason
      }
    }
    
    // Check minSpend
    const minSpend = Number(offer.minSpend)
    if (offer.minSpend && (!minSpend || isNaN(minSpend) || amount < minSpend)) {
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
      assumption: conditionResult.assumption
    }
  }).filter(o => o.estimatedValue > 0 || o.skippedReason)
}

/**
 * Safe total calculation
 */
export function calculateTotalOfferValue(offers, amount, input = {}) {
  if (!offers || !Array.isArray(offers) || offers.length === 0) return 0

  // Filter to only valid offers
  const validOffers = offers.filter(o => {
    const v = validateOffer(o)
    return v.valid && isThresholdTypeSupported(o) && evaluateConditions(o.conditions, input).satisfied
  })

  const stackable = validOffers.filter(o => o.stackable === true)
  const nonStackable = validOffers.filter(o => o.stackable !== true)

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
  if (!offers || !Array.isArray(offers)) return []
  
  return offers.filter(offer => {
    if (offer.cardId && offer.cardId !== cardId) return false
    if (offer.bankId && offer.bankId !== bankId) return false
    return true
  })
}

export { THRESHOLD_TYPES, SUPPORTED_CONDITIONS }
