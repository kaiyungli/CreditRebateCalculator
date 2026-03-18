// API: Calculate best card for a single transaction
// Uses new schema: reward_rules, merchant_offers
import { getActiveCards, getCardsByIds, getRewardRules, getMerchantOffers, saveCalculation } from '../../../lib/db'

/**
 * Choose the best reward rule for a card
 * Priority: MERCHANT > CATEGORY > GENERAL
 */
function chooseBestRule(rules, cardId) {
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
function calculateReward(rule, amount) {
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
 * Estimate offer value for a given amount
 */
function estimateOfferValue(offer, amount) {
  if (!offer) return 0

  // Check min_spend
  if (offer.min_spend && amount < Number(offer.min_spend)) {
    return 0
  }

  const value = Number(offer.value) || 0

  if (offer.value_type === 'FIXED') {
    return Math.min(value, Number(offer.max_discount) || value)
  }

  if (offer.value_type === 'PERCENT') {
    let calculated = (amount * value) / 100
    return Math.min(calculated, Number(offer.max_discount) || calculated)
  }

  return 0
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { merchant_id, category_id, amount, card_ids, user_id } = body

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' })
    }

    if (!merchant_id && !category_id) {
      return res.status(400).json({ success: false, error: 'merchant_id or category_id required' })
    }

    // Get cards: use card_ids if provided, otherwise get all active
    let cards
    if (card_ids && Array.isArray(card_ids) && card_ids.length > 0) {
      cards = await getCardsByIds(card_ids.map(Number))
    } else {
      cards = await getActiveCards()
    }

    if (!cards || cards.length === 0) {
      return res.status(404).json({ success: false, error: 'No cards found' })
    }

    // Get card IDs and bank IDs for queries
    const cardIds = cards.map(c => c.id || c.card_id)
    const bankIds = [...new Set(cards.map(c => c.bank_id).filter(Boolean))]

    // Load reward rules
    const rules = await getRewardRules({
      cardIds,
      merchantId: merchant_id ? Number(merchant_id) : undefined,
      categoryId: category_id ? Number(category_id) : undefined
    })

    // Load offers
    const offers = await getMerchantOffers({
      merchantId: merchant_id ? Number(merchant_id) : undefined,
      cardIds,
      bankIds
    })

    // Calculate for each card
    const results = cards.map(card => {
      const cardId = card.id || card.card_id
      const cardBankId = card.bank_id

      // Get best rule for this card
      const rule = chooseBestRule(rules, cardId)

      // Check min_spend
      if (rule && rule.min_spend && amount < Number(rule.min_spend)) {
        return {
          card_id: cardId,
          card_name: card.card_name || card.name,
          bank_name: card.bank_name,
          reward_rule: null,
          base_reward: { amount: 0, reward_kind: null, effective_rate: null },
          offers: [],
          offer_value: 0,
          total_value: 0
        }
      }

      // Calculate base reward
      const rewardCalc = calculateReward(rule, amount)

      // Find matching offers for this card
      const matchingOffers = offers
        .filter(offer => {
          // Check card_id: null = all cards, or match specific card
          if (offer.card_id && offer.card_id !== cardId) return false
          // Check bank_id: null = all banks, or match specific bank
          if (offer.bank_id && offer.bank_id !== cardBankId) return false
          return true
        })
        .map(offer => ({
          id: offer.id,
          title: offer.title,
          offer_type: offer.offer_type,
          value_type: offer.value_type,
          value: offer.value,
          estimated_value: estimateOfferValue(offer, amount)
        }))
        .filter(o => o.estimated_value > 0)

      const offerValue = matchingOffers.reduce((sum, o) => sum + o.estimated_value, 0)
      const totalValue = rewardCalc.rewardAmount + offerValue

      return {
        card_id: cardId,
        card_name: card.card_name || card.name,
        bank_name: card.bank_name,
        reward_rule: rule ? {
          id: rule.id,
          scope_type: rule.scope_type,
          reward_kind: rule.reward_kind,
          rate_unit: rule.rate_unit,
          rate_value: Number(rule.rate_value)
        } : null,
        base_reward: {
          amount: rewardCalc.rewardAmount,
          reward_kind: rewardCalc.rewardKind,
          effective_rate: rewardCalc.effectiveRate
        },
        offers: matchingOffers,
        offer_value: offerValue,
        total_value: Math.round(totalValue * 100) / 100
      }
    })

    // Sort results: total_value desc, then base_reward.amount desc
    results.sort((a, b) => {
      if (b.total_value !== a.total_value) return b.total_value - a.total_value
      return b.base_reward.amount - a.base_reward.amount
    })

    const bestCard = results[0] || null

    // Save calculation history
    try {
      await saveCalculation({
        user_id: user_id ? Number(user_id) : null,
        input_json: { merchant_id, category_id, amount, card_ids },
        result_json: { results, best_card: bestCard }
      })
    } catch (saveErr) {
      console.warn('Failed to save calculation:', saveErr.message)
    }

    return res.status(200).json({
      success: true,
      input: { merchant_id, category_id, amount },
      results,
      best_card: bestCard
    })

  } catch (error) {
    console.error('Calculate API error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
