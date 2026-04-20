/**
 * Request/Response Schemas
 * Centralized validation for calculation flow
 */

/**
 * Expense input validation rules
 */
const EXPENSE_INPUT = {
  amount: {
    type: 'number',
    required: true,
    min: 1,
    message: 'Amount must be greater than 0'
  }
}

/**
 * Card selection validation rules
 */
const CARD_SELECTION = {
  card_ids: {
    type: 'array',
    required: false,
    itemType: 'number',
    message: 'card_ids must be an array of numbers'
  }
}

/**
 * Condition inputs for conditions_json v1
 */
const CONDITION_INPUT = {
  channel: {
    type: 'string',
    required: false,
    values: ['online', 'in_store', 'app', 'all'],
    message: 'channel must be online, in_store, app, or all'
  },
  wallet: {
    type: 'string',
    required: false,
    values: ['apple_pay', 'google_pay', 'samsung_pay', 'visa_pay', 'all'],
    message: 'wallet must be a valid wallet type'
  },
  weekday: {
    type: 'string',
    required: false,
    values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    message: 'weekday must be a day of week'
  }
}

/**
 * Location identification validation rules
 */
const LOCATION_IDENTIFICATION = {
  merchant_id: { type: 'number', required: false },
  category_id: { type: 'number', required: false },
  requireEither: ['merchant_id', 'category_id'],
  message: 'Either merchant_id or category_id is required'
}

/**
 * Full calculation request validation
 */
const CALCULATION_REQUEST = {
  ...EXPENSE_INPUT,
  ...CARD_SELECTION,
  ...LOCATION_IDENTIFICATION,
  ...CONDITION_INPUT,
  user_id: { type: 'number', required: false }
}

/**
 * Validate calculation request
 */
function validateCalculationRequest(data) {
  const errors = []
  
  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push('amount is required')
  } else if (typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('amount must be greater than 0')
  }
  
  // Either merchant_id or category_id
  if (!data.merchant_id && !data.category_id) {
    errors.push('Either merchant_id or category_id is required')
  }
  
  // card_ids validation
  if (data.card_ids !== undefined) {
    if (!Array.isArray(data.card_ids)) {
      errors.push('card_ids must be an array')
    } else if (data.card_ids.some(id => typeof id !== 'number')) {
      errors.push('card_ids must contain only numbers')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: {
      merchant_id: data.merchant_id ? Number(data.merchant_id) : undefined,
      category_id: data.category_id ? Number(data.category_id) : undefined,
      amount: Number(data.amount),
      card_ids: data.card_ids ? data.card_ids.map(Number) : undefined,
      user_id: data.user_id ? Number(data.user_id) : undefined,
      // Condition inputs
      channel: data.channel,
      wallet: data.wallet,
      weekday: data.weekday
    }
  }
}

/**
 * API Response shape
 */
const CALCULATION_RESPONSE = {
  success: 'boolean',
  input: 'object',
  results: 'array',
  best_card: 'object|null'
}

/**
 * Card result shape
 */
const CARD_RESULT = {
  card_id: 'number',
  card_name: 'string',
  bank_name: 'string',
  reward_rule: 'object|null',
  base_reward: 'object',
  offers: 'array',
  offer_value: 'number',
  total_value: 'number'
}

module.exports = {
  EXPENSE_INPUT,
  CARD_SELECTION,
  LOCATION_IDENTIFICATION,
  CONDITION_INPUT,
  CALCULATION_REQUEST,
  validateCalculationRequest,
  CALCULATION_RESPONSE,
  CARD_RESULT
}
