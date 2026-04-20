/**
 * Calculator Domain - Result Formatter
 * Output includes explainability fields
 */

/**
 * Format rule summary - human-readable
 */
function formatRuleSummary(rule) {
  if (!rule) return null
  
  const scopeLabel = {
    'MERCHANT': 'merchant',
    'CATEGORY': 'category',
    'GENERAL': 'base'
  }[rule.scopeType] || 'rule'
  
  const rateLabel = rule.rateUnit === 'PERCENT' 
    ? `${rule.rateValue}%` 
    : rule.rateUnit === 'FIXED'
      ? `HK$${rule.rateValue} fixed`
      : `${rule.rateValue} points per HK$100`
  
  const rewardLabel = rule.rewardKind === 'CASHBACK' 
    ? 'cashback' 
    : rule.rewardKind === 'POINTS'
      ? 'points'
      : rule.rewardKind || 'reward'
  
  return {
    ruleId: rule.id,
    scope: scopeLabel,
    reward: `${rateLabel} ${rewardLabel}`,
    effectiveRate: rule.effectiveRate ? `${rule.effectiveRate}%` : null
  }
}

/**
 * Format offer summary - human-readable
 */
function formatOfferSummary(offer) {
  if (!offer) return null
  
  let summary = ''
  
  if (offer.valueType === 'FIXED') {
    summary = `HK$${offer.value} fixed rebate`
  } else if (offer.valueType === 'PERCENT') {
    summary = `${offer.value}% extra ${offer.rewardKind || 'cashback'}`
    if (offer.maxReward) {
      summary += ` (capped at HK$${offer.maxReward})`
    }
  }
  
  const conditions = []
  if (offer.channel) conditions.push(`channel:${offer.channel}`)
  if (offer.wallet) conditions.push(`wallet:${offer.wallet}`)
  if (offer.weekday) conditions.push(`${offer.weekday}`)
  
  if (conditions.length > 0) {
    summary += ` [${conditions.join(', ')}]`
  }
  
  return {
    offerId: offer.id,
    title: offer.title,
    summary,
    value: offer.estimatedValue
  }
}

/**
 * Format a single card result with full explainability
 */
export function formatCardResult(card, rule, rewardCalc, offers, offerValue, offerDetails = [], skippedOffers = []) {
  const cardId = card.cardId

  // Applied rule
  const appliedRuleSummary = rule ? formatRuleSummary(rule) : null
  
  // Applied offers
  const appliedOffers = offers
    .filter(o => o.estimatedValue > 0)
    .map(o => formatOfferSummary({
      ...o,
      rewardKind: o.valueType === 'PERCENT' ? 'cashback' : 'rebate'
    }))
  
  // Skipped offers
  const skippedOfferDetails = []
  const skippedIds = []
  
  offerDetails.forEach(o => {
    if (o.skippedReason) {
      skippedIds.push(o.id)
      skippedOfferDetails.push({
        offerId: o.id,
        title: o.title,
        reason: o.skippedReason
      })
    }
  })

  // Assumptions from skipped offers
  const assumptions = skippedOfferDetails.map(s => s.reason)

  return {
    cardId,
    cardName: card.cardName,
    bankName: card.bankName,
    // Base reward explanation
    appliedRuleId: rule ? rule.id : null,
    appliedRuleSummary,
    baseReward: {
      amount: rewardCalc.rewardAmount,
      rewardKind: rewardCalc.rewardKind,
      effectiveRate: rewardCalc.effectiveRate
    },
    // Offers explanation
    appliedOfferIds: appliedOffers.map(o => o.offerId),
    appliedOfferSummaries: appliedOffers,
    // Skipped offers
    skippedOfferIds: skippedIds,
    skippedOfferDetails,
    // Total
    offerValue,
    totalValue: Math.round((rewardCalc.rewardAmount + offerValue) * 100) / 100,
    // Assumptions for debugging
    assumptions
  }
}

/**
 * Sort by total value desc, then by base reward desc
 */
export function sortResults(results) {
  return [...results].sort((a, b) => {
    if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue
    return b.baseReward.amount - a.baseReward.amount
  })
}

/**
 * Format full response
 */
export function formatCalculationResponse(results, bestCard) {
  return {
    success: true,
    results,
    bestCard
  }
}

export default {
  formatCardResult,
  sortResults,
  formatCalculationResponse,
  formatRuleSummary,
  formatOfferSummary
}
