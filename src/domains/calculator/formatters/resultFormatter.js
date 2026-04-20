/**
 * Calculator Domain - Result Formatter
 * Output includes explanation-ready fields and skipped reason tracking
 */

/**
 * Format a single card result
 */
export function formatCardResult(card, rule, rewardCalc, offers, offerValue, offerDetails = [], skippedOffers = []) {
  const cardId = card.cardId

  return {
    cardId,
    cardName: card.cardName,
    bankName: card.bankName,
    rewardRule: rule ? {
      id: rule.id,
      scopeType: rule.scopeType,
      rewardKind: rule.rewardKind,
      rateUnit: rule.rateUnit,
      rateValue: Number(rule.rateValue)
    } : null,
    baseReward: {
      amount: rewardCalc.rewardAmount,
      rewardKind: rewardCalc.rewardKind,
      effectiveRate: rewardCalc.effectiveRate
    },
    // Applied offers
    appliedOfferIds: offers.map(o => o.id),
    offers: offers.map(o => ({
      id: o.id,
      title: o.title,
      offerType: o.offerType,
      valueType: o.valueType,
      value: o.value,
      stackable: o.stackable,
      thresholdType: o.thresholdType,
      estimatedValue: o.estimatedValue
    })),
    offerValue,
    totalValue: Math.round((rewardCalc.rewardAmount + offerValue) * 100) / 100,
    // Skipped offers for debugging
    assumptions: [
      ...skippedOffers.map(s => `offerSkipped:${s}`),
      rule?.thresholdType ? `ruleThresholdType:${rule.thresholdType}` : null
    ].filter(Boolean)
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
  formatCalculationResponse
}
