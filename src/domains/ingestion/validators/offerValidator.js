/**

* Ingestion Domain - Offer Validator
* Validates parsed offer data before insertion
*/

/**
* Validate parsed offer values are realistic
*/
export function validateParsedOffer(parsed) {
  if (!parsed) return { valid: false, errors: ['No parsed data'] }
  
  const errors = []
  
  if (!parsed.reward_type) errors.push('Missing reward_type')
  if (!parsed.reward_value) errors.push('Missing reward_value')
  
  // Validate reward_value
  if (parsed.reward_value) {
    const value = Number(parsed.reward_value)
    if (parsed.reward_type === 'PERCENT' && (value < 0.1 || value > 50)) {
      errors.push('Unrealistic percent value: ' + value)
    } else if (parsed.reward_type === 'FIXED' && (value < 1 || value > 5000)) {
      errors.push('Unrealistic fixed value: ' + value)
    }
  }
  
  // Validate min_spend
  if (parsed.min_spend) {
    const minSpend = Number(parsed.min_spend)
    if (minSpend < 1 || minSpend > 100000) {
      errors.push('Unrealistic min_spend: ' + minSpend)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

export default { validateParsedOffer }
