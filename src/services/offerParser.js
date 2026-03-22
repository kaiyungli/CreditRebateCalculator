/**
 * Offer Parser - Extract structured data from raw offer text using AI
 * 
 * Input: raw offer text from scraping/sources
 * Output: parsed structured offer object
 */

import axios from 'axios'

/**
 * Parse raw offer text into structured data using Minimax
 * @param {string} text - Raw offer text (title + description)
 * @returns {Promise<Object>} Parsed offer object
 */
export async function parseOffer(text) {
  if (!text || text.trim().length === 0) {
    console.log('⚠️ Empty text provided')
    return null
  }

  const apiKey = process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.log('⚠️ No API key configured')
    return null
  }

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
    // Use Minimax API
    const response = await axios.post(
      'https://api.minimax.chat/v1/text/chatcompletion_pro',
      {
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: 'You are a credit card offer parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data?.choices?.[0]?.message?.content

    if (!content) {
      console.log('⚠️ No response from API')
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
    console.error('❌ API error:', error.response?.data || error.message)
    return null
  }
}

/**
 * Validate parsed offer values are realistic
 */
function validateParsedOffer(parsed) {
  if (!parsed) return false

  if (!parsed.reward_type || !parsed.reward_value) {
    return true
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
