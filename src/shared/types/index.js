/**
 * Shared Types - Domain type definitions
 */

/**
 * Card from database
 * @typedef {Object} Card
 * @property {number} id
 * @property {string} card_name
 * @property {number} bank_id
 * @property {string} bank_name
 * @property {string} reward_program
 */

/**
 * Reward rule from database
 * @typedef {Object} RewardRule
 * @property {number} id
 * @property {number} card_id
 * @property {number} [merchant_id]
 * @property {number} [category_id]
 * @property {string} reward_kind
 * @property {string} rate_unit - PERCENT, FIXED, PER_AMOUNT
 * @property {number} rate_value
 * @property {number} [per_amount]
 * @property {number} [cap_value]
 * @property {number} [min_spend]
 * @property {string} scope_type - MERCHANT, CATEGORY, GENERAL
 */

/**
 * Merchant offer from database
 * @typedef {Object} MerchantOffer
 * @property {number} id
 * @property {number} [merchant_id]
 * @property {number} [bank_id]
 * @property {number} [card_id]
 * @property {string} title
 * @property {string} offer_type
 * @property {string} value_type - FIXED, PERCENT
 * @property {number} value
 * @property {number} [min_spend]
 * @property {number} [max_discount]
 */

/**
 * Formatted card result
 * @typedef {Object} CardCalculationResult
 * @property {number} card_id
 * @property {string} card_name
 * @property {string} bank_name
 * @property {Object} [reward_rule]
 * @property {Object} base_reward
 * @property {Array} offers
 * @property {number} offer_value
 * @property {number} total_value
 */

/**
 * Base reward calculation
 * @typedef {Object} BaseReward
 * @property {number} amount
 * @property {string} [reward_kind]
 * @property {number} [effective_rate]
 */

/**
 * Formatted offer in result
 * @typedef {Object} FormattedOffer
 * @property {number} id
 * @property {string} title
 * @property {string} offer_type
 * @property {string} value_type
 * @property {number} value
 * @property {number} estimated_value
 */

module.exports = {}
