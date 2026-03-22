/**
 * Offer Parser - Extract structured data from raw offer text using AI
 * 
 * Input: raw offer text from scraping/sources
 * Output: parsed structured offer object
 */

import OpenAI from 'openai'

/**
 * Parse raw offer text into structured data using OpenAI
 * @param {string} text - Raw offer text (title + description)
 * @returns {Promise<Object>} Parsed offer object
 */
export async function parseOffer(text) {
  if (!text || text.trim().length === 0) {
    console.log('⚠️ Empty text provided')
    return null
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const prompt = `Parse this credit card offer and extract structured data.

Offer text:
"""
${text}
"""

Return ONLY valid JSON (no markdown, no explanation):
{
  "merchant": "merchant name or null",
  "category": "category name (e.g. dining, supermarket, online) or null",
  "bank": "bank name or null",
  "card": "card name or null",
  "min_spend": number or null,
  "reward_type": "PERCENT" or "FIXED" or null,
  "reward_value": number or null,
  "cap_amount": number or null
}

STRICT EXTRACTION RULES:

1. FIXED (coupon/reward):
   - If text contains: "$" + number AND ("券" OR "優惠券" OR "現金券" OR "rebate" OR "cash rebate" OR "回贈")
   - Then reward_type = "FIXED"
   - reward_value = that dollar amount (e.g., "HK$50" → 50)

2. PERCENT (percentage cashback):
   - If text contains: "%" AND ("回贈" OR "cashback" OR "現金回贈" OR "%回贈")
   - Then reward_type = "PERCENT"
   - reward_value = that percentage (e.g., "5%" → 5)

3. If BOTH exist:
   - Prefer FIXED (coupon is more explicit)

4. If CANNOT determine clearly:
   - Return null for reward_type and reward_value (do NOT guess)

5. REALISTIC VALUES validation:
   - reward_value for PERCENT should be between 0.1 and 50
   - reward_value for FIXED should be between 1 and 5000
   - If outside range → return null

6. min_spend:
   - Extract from phrases like "滿HK$500", "消費滿$500", "單一消費HK$300"
   - If not clearly stated → null

7. cap_amount:
   - Extract from phrases like "最高HK$100", "上限HK$200"
   - If not clearly stated → null`

  console.log('📝 Parsing offer:', text.substring(0, 100))

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a credit card offer parser. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 500
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      console.log('⚠️ No response from OpenAI')
      return null
    }

    // Try to parse JSON
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        console.log('❌ Failed to parse JSON:', content.substring(0, 200))
        return null
      }
    }

    // Validate realistic values
    const validated = validateParsedOffer(parsed)
    if (!validated) {
      console.log('❌ Invalid offer values - returning null')
      return null
    }

    console.log('✅ Parsed result:', JSON.stringify(parsed))

    // Map to our schema
    const result = {
      merchant_name: parsed.merchant || null,
      category: parsed.category || null,
      bank: parsed.bank || null,
      card: parsed.card || null,
      min_spend: parsed.min_spend ?? null,
      reward_type: parsed.reward_type || null,
      reward_value: parsed.reward_value ?? null,
      cap_amount: parsed.cap_amount ?? null
    }

    return result

  } catch (error) {
    console.error('❌ OpenAI error:', error.message)
    return null
  }
}

/**
 * Validate parsed offer values are realistic
 */
function validateParsedOffer(parsed) {
  if (!parsed) return false

  // Skip validation if we don't have clear reward info
  if (!parsed.reward_type || !parsed.reward_value) {
    // Allow if we have neither - means unclear offer
    return true
  }

  const rewardValue = Number(parsed.reward_value)
  
  if (parsed.reward_type === 'PERCENT') {
    // Percentage should be between 0.1% and 50%
    if (rewardValue < 0.1 || rewardValue > 50) {
      console.log('⚠️ Unrealistic percentage:', rewardValue)
      return false
    }
  } else if (parsed.reward_type === 'FIXED') {
    // Fixed amount should be between HK$1 and HK$5000
    if (rewardValue < 1 || rewardValue > 5000) {
      console.log('⚠️ Unrealistic fixed amount:', rewardValue)
      return false
    }
  }

  // Validate min_spend if present
  if (parsed.min_spend) {
    const minSpend = Number(parsed.min_spend)
    if (minSpend < 1 || minSpend > 100000) {
      console.log('⚠️ Unrealistic min_spend:', minSpend)
      return false
    }
  }

  // Validate cap_amount if present
  if (parsed.cap_amount) {
    const capAmount = Number(parsed.cap_amount)
    if (capAmount < 1 || capAmount > 100000) {
      console.log('⚠️ Unrealistic cap_amount:', capAmount)
      return false
    }
  }

  return true
}

/**
 * Detect offer type from text (legacy helper)
 */
function detectOfferType(text) {
  return 'COUPON'
}

/**
 * Extract monetary values from text (legacy helper)
 */
function extractMoney(text) {
  return null
}

/**
 * Extract percentage values from text (legacy helper)
 */
function extractPercentage(text) {
  return null
}

/**
 * Extract date ranges from text (legacy helper)
 */
function extractDates(text) {
  return { from: null, to: null }
}

export default { parseOffer }
