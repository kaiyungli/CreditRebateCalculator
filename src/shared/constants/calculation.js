/**
 * Calculation Constants
 */

const SCOPE_PRIORITY = {
  MERCHANT: 1,
  CATEGORY: 2,
  GENERAL: 3
}

const RATE_UNITS = {
  PERCENT: 'PERCENT',
  FIXED: 'FIXED',
  PER_AMOUNT: 'PER_AMOUNT'
}

const REWARD_KINDS = {
  CASHBACK: 'CASHBACK',
  POINTS: 'POINTS',
  MILES: 'MILES'
}

const SORT_ORDER = {
  TOTAL_VALUE_DESC: 'total_value_desc',
  BASE_REWARD_DESC: 'base_reward_desc'
}

const DEFAULT_PAGE_SIZE = 50
const MAX_CARDS = 100

module.exports = {
  SCOPE_PRIORITY,
  RATE_UNITS,
  REWARD_KINDS,
  SORT_ORDER,
  DEFAULT_PAGE_SIZE,
  MAX_CARDS
}
