/**
 * Calculator Domain - Result Formatter with Decision Trace
 */

function formatRuleSummary(rule) {
  if (!rule) return null
  const scopeLabel = { 'MERCHANT': 'merchant', 'CATEGORY': 'category', 'GENERAL': 'base' }[rule.scopeType] || 'rule'
  const rateLabel = rule.rateUnit === 'PERCENT' ? `${rule.rateValue}%` : rule.rateUnit === 'FIXED' ? `HK$${rule.rateValue} fixed` : `${rule.rateValue} pts`
  return { id: rule.id, scope: scopeLabel, reward: `${rateLabel} ${rule.rewardKind || 'reward'}`, effectiveRate: rule.effectiveRate }
}

function formatOfferSummary(offer) {
  if (!offer) return null
  let summary = offer.valueType === 'FIXED' ? `HK$${offer.value} fixed` : `${offer.value}%`
  if (offer.maxReward) summary += ` (capped HK$${offer.maxReward})`
  return { id: offer.id, title: offer.title, summary, value: offer.estimatedValue }
}

/**
 * Build decision trace for a card
 */
function buildTrace(card, rule, rewardCalc, offerDetails, offerValue) {
  const trace = { steps: [], appliedRule: null, appliedOffers: [], skippedOffers: [], assumptions: [] }
  
  // Step 1: Base rule
  if (rule) {
    trace.appliedRule = { id: rule.id, scope: rule.scopeType || 'rule', reward: rewardCalc.rewardAmount }
    trace.steps.push({
      step: 'base',
      action: `base rule selected`,
      detail: `${rule.scopeType || 'rule'} rule #${rule.id}`,
      value: rewardCalc.rewardAmount
    })
  } else {
    trace.steps.push({ step: 'base', action: 'no base rule', detail: 'no applicable rule', value: 0 })
  }
  
  // Step 2: Analyze offers
  offerDetails.forEach(offer => {
    if (offer.estimatedValue > 0) {
      // Applied offer
      trace.appliedOffers.push({ id: offer.id, title: offer.title, value: offer.estimatedValue })
      trace.steps.push({
        step: 'offer',
        action: 'offer applied',
        detail: `#${offer.id}: ${offer.valueType === 'FIXED' ? 'HK$' + offer.value : offer.value + '%'}`,
        value: offer.estimatedValue
      })
    } else if (offer.skippedReason) {
      // Skipped offer
      trace.skippedOffers.push({ id: offer.id, title: offer.title, reason: offer.skippedReason })
      trace.steps.push({
        step: 'offer',
        action: 'offer skipped',
        detail: `#${offer.id}: ${offer.skippedReason}`,
        value: 0
      })
    }
  })
  
  // Check for non-stackable wins
  const appliedNonStackable = trace.appliedOffers.filter(o => {
    const detail = offerDetails.find(d => d.id === o.id)
    return detail && !detail.stackable
  })
  
  const skippedNonStackable = trace.skippedOffers.filter(s => {
    return trace.appliedOffers.some(a => a.id !== s.id)  // was skipped but another was used
  })
  
  if (appliedNonStackable.length > 0 && skippedNonStackable.length > 0) {
    trace.steps.push({
      step: 'resolution',
      action: 'non-stackable wins',
      detail: `highest non-stackable offer selected, other skipped`
    })
  }
  
  // Total
  trace.steps.push({
    step: 'total',
    action: 'total value',
    detail: `base + offers`,
    value: rewardCalc.rewardAmount + offerValue
  })
  
  return trace
}

export function formatCardResult(card, rule, rewardCalc, offers, offerValue, offerDetails = [], skippedOffers = []) {
  const cardId = card.cardId

  const appliedRuleSummary = rule ? formatRuleSummary(rule) : null
  
  // Applied offers summary
  const appliedOffers = offers
    .filter(o => o.estimatedValue > 0)
    .map(o => formatOfferSummary(o))
  
  // Skipped offers details
  const skippedOfferDetails = []
  const skippedIds = []
  
  offerDetails.forEach(o => {
    if (o.skippedReason) {
      skippedIds.push(o.id)
      skippedOfferDetails.push({ id: o.id, title: o.title, reason: o.skippedReason })
    }
  })

  // Build trace
  const trace = buildTrace(card, rule, rewardCalc, offerDetails, offerValue)

  return {
    cardId,
    cardName: card.cardName,
    bankName: card.bankName,
    // Applied rule
    appliedRuleId: rule ? rule.id : null,
    appliedRuleSummary,
    baseReward: { amount: rewardCalc.rewardAmount, rewardKind: rewardCalc.rewardKind, effectiveRate: rewardCalc.effectiveRate },
    // Applied offers
    appliedOfferIds: appliedOffers.map(o => o.id),
    appliedOfferSummaries: appliedOffers,
    // Skipped
    skippedOfferIds: skippedIds,
    skippedOfferDetails,
    // Total
    offerValue,
    totalValue: Math.round((rewardCalc.rewardAmount + offerValue) * 100) / 100,
    // Decision trace
    trace
  }
}

export function sortResults(results) {
  return [...results].sort((a, b) => {
    if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue
    return b.baseReward.amount - a.baseReward.amount
  })
}

export function formatCalculationResponse(results, bestCard) {
  return { success: true, results, bestCard }
}

export default { formatCardResult, sortResults, formatCalculationResponse, buildTrace }
