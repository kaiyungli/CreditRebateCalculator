/**
 * Offer Parser - Rule-based extraction without external AI API
 * 
 * Input: raw offer text
 * Output: parsed structured offer object
 */

/**
 * Parse raw offer text using regex and keyword rules
 * @param {string} text - Raw offer text (title + description)
 * @returns {Object} Parsed offer object
 */
export function parseOffer(text) {
  if (!text || text.trim().length === 0) {
    console.log('⚠️ Empty text provided')
    return null
  }

  console.log('📝 Parsing offer (rule-based):', text.substring(0, 100))

  // Extract bank
  const bank = extractBank(text)
  console.log('🏦 Bank:', bank)

  // Extract category
  const category = extractCategory(text)
  console.log('📂 Category:', category)

  // Extract merchant
  const merchant = extractMerchant(text)
  console.log('🏪 Merchant:', merchant)

  // Extract reward info
  const { reward_type, reward_value, cap_amount } = extractRewardInfo(text)
  console.log('💰 Reward:', reward_type, reward_value, 'cap:', cap_amount)

  // Extract min_spend
  const min_spend = extractMinSpend(text)
  console.log('🧾 Min spend:', min_spend)

  // Validate realistic values
  const validated = validateParsedOffer({ reward_type, reward_value, min_spend, cap_amount })
  if (!validated) {
    console.log('❌ Invalid offer values - returning null')
    return null
  }

  // Map to our schema
  const result = {
    merchant_name: merchant,
    category: category,
    bank: bank,
    card: null, // Cannot determine card from text alone
    min_spend: min_spend,
    reward_type: reward_type,
    reward_value: reward_value,
    cap_amount: cap_amount
  }

  console.log('✅ Parsed result:', JSON.stringify(result))
  return result
}

/**
 * Extract bank from text
 */
function extractBank(text) {
  const bankPatterns = [
    { regex: /HSBC/i, name: 'HSBC' },
    { regex: /匯豐/i, name: 'HSBC' },
    { regex: /DBS/i, name: 'DBS' },
    { regex: /星展/i, name: 'DBS' },
    { regex: /中銀|中國銀行|BOC/i, name: 'Bank of China' },
    { regex: /渣打|Standard Chartered|SC/i, name: 'Standard Chartered' },
    { regex: /花旗|Citi|Citibank/i, name: 'Citibank' },
    { regex: /恒生/i, name: 'Hang Seng' },
    { regex: /東亞|BEA/i, name: 'BEA' },
    { regex: /農夫|aeon/i, name: 'AEON' },
  ]

  for (const pattern of bankPatterns) {
    if (pattern.regex.test(text)) {
      return pattern.name
    }
  }
  return null
}

/**
 * Extract category from text
 */
function extractCategory(text) {
  const categoryPatterns = [
    { regex: /餐飲|餐廳|食|壽司|快餐/i, name: 'dining' },
    { regex: /超市|便利店|百佳|惠康|萬寧/i, name: 'supermarket' },
    { regex: /網購|網上|shopping|online/i, name: 'online' },
    { regex: /戲院|電影|Cinema/i, name: 'entertainment' },
    { regex: /旅行|機票|酒店/i, name: 'travel' },
    { regex: /油站|石油|Shell/i, name: 'fuel' },
    { regex: /公共交通|巴士|港鐵|MTR/i, name: 'transport' },
  ]

  for (const pattern of categoryPatterns) {
    if (pattern.regex.test(text)) {
      return pattern.name
    }
  }
  return null
}

/**
 * Extract merchant from text
 */
function extractMerchant(text) {
  const merchantPatterns = [
    { regex: /壽司郎/i, name: '壽司郎' },
    { regex: /麥當勞/i, name: '麥當勞' },
    { regex: /肯德基|KFC/i, name: '肯德基' },
    { regex: /快餐店/i, name: '快餐店' },
    { regex: /百佳|parkson/i, name: '百佳' },
    { regex: /惠康|wellcome/i, name: '惠康' },
    { regex: /759|759阿信屋/i, name: '759阿信屋' },
    { regex: /屈臣氏/i, name: '屈臣氏' },
    { regex: /萬寧/i, name: '萬寧' },
    { regex: /日本城/i, name: '日本城' },
  ]

  for (const pattern of merchantPatterns) {
    if (pattern.regex.test(text)) {
      return pattern.name
    }
  }
  return null
}

/**
 * Extract reward type and value
 */
function extractRewardInfo(text) {
  // Priority 1: FIXED - Look for amounts AFTER reward keywords
  // Pattern: "即減HK$50", "減$50", "送$50券"
  const fixedAfterPatterns = [
    /即減\s*HK?\$(\d+)/i,      // 即減HK$50
    /減\s*HK?\$(\d+)(?!\s*滿)/i, // 減HK$50 (but not 減滿)
    /送\s*HK?\$(\d+)/i,         // 送HK$50
    /(?:優惠|現金券)\s*HK?\$(\d+)/i, // 優惠券HK$50
    /回贈\s*HK?\$(\d+)/i,       // 回贈HK$50
  ]

  for (const pattern of fixedAfterPatterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1], 10)
      if (value >= 1 && value <= 5000) {
        return { reward_type: 'FIXED', reward_value: value, cap_amount: null }
      }
    }
  }

  // Priority 2: Look for amount with specific reward keywords anywhere
  const fixedAnyPatterns = [
    /(?:減|送|回贈|優惠|現金券)[^\d]*HK?\$(\d+)/i,
  ]

  for (const pattern of fixedAnyPatterns) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'))
    for (const match of matches) {
      const value = parseInt(match[1], 10)
      // Check if this amount looks like a reward (not min_spend)
      // Reward values usually smaller than min_spend in coupon offers
      if (value >= 1 && value <= 5000) {
        // Additional check: if min_spend was also captured, reward should be <= min_spend * 0.5
        return { reward_type: 'FIXED', reward_value: value, cap_amount: null }
      }
    }
  }

  // Priority 3: PERCENT rewards
  const percentPatterns = [
    /(\d+(?:\.\d+)?)\s*%\s*(?:回贈|cashback| rebate)/i,
  ]

  for (const pattern of percentPatterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseFloat(match[1])
      if (value >= 0.1 && value <= 50) {
        return { reward_type: 'PERCENT', reward_value: value, cap_amount: null }
      }
    }
  }

  // Standalone percent with reward context
  const standalonePercent = /(\d+(?:\.\d+)?)\s*%/i.exec(text)
  if (standalonePercent) {
    const value = parseFloat(standalonePercent[1])
    if (value >= 0.1 && value <= 50 && /回贈|cashback|rebate/i.test(text)) {
      return { reward_type: 'PERCENT', reward_value: value, cap_amount: null }
    }
  }

  // Cannot determine
  return { reward_type: null, reward_value: null, cap_amount: null }
}

/**
 * Extract min_spend
 */
function extractMinSpend(text) {
  const patterns = [
    /滿HK?\$(\d+)/i,
    /消費滿HK?\$(\d+)/i,
    /單一消費HK?\$(\d+)/i,
    /滿(\d+)\s*元/i,
    /消費滿(\d+)\s*元/i,
    /hk\$\s*(\d+)\s*起/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1], 10)
      if (value >= 1 && value <= 100000) {
        return value
      }
    }
  }
  return null
}

/**
 * Validate parsed offer values are realistic
 */
function validateParsedOffer(parsed) {
  if (!parsed) return false

  if (!parsed.reward_type || !parsed.reward_value) {
    return true // Allow - we return null for missing values
  }

  const rewardValue = Number(parsed.reward_value)
  
  if (parsed.reward_type === 'PERCENT') {
    if (rewardValue < 0.1 || rewardValue > 50) {
      console.log('⚠️ Unrealistic percentage:', rewardValue)
      return false
    }
  } else if (parsed.reward_type === 'FIXED') {
    if (rewardValue < 1 || rewardValue > 5000) {
      console.log('⚠️ Unrealistic fixed amount:', rewardValue)
      return false
    }
  }

  if (parsed.min_spend) {
    const minSpend = Number(parsed.min_spend)
    if (minSpend < 1 || minSpend > 100000) {
      console.log('⚠️ Unrealistic min_spend:', minSpend)
      return false
    }
  }

  if (parsed.cap_amount) {
    const capAmount = Number(parsed.cap_amount)
    if (capAmount < 1 || capAmount > 100000) {
      console.log('⚠️ Unrealistic cap_amount:', capAmount)
      return false
    }
  }

  return true
}

export default { parseOffer }