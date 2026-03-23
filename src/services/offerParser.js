/**
 * Offer Parser - Extract structured data from raw offer text using Google Gemini
 * 
 * Input: raw offer text from scraping/sources
 * Output: parsed structured offer object
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Parse raw offer text into structured data using Gemini
 * @param {string} text - Raw offer text (title + description)
 * @returns {Promise<Object>} Parsed offer object
 */
export async function parseOffer(text) {
  if (!text || text.trim().length === 0) {
    console.log('⚠️ Empty text provided')
    return null
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY not configured')
    return null
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are a system that extracts structured data from credit card offers.

Return ONLY valid JSON. No explanation, no markdown.

{
  "merchant": "...",
  "category": "...",
  "bank": "...",
  "card": "...",
  "min_spend": number,
  "reward_type": "PERCENT" | "FIXED" | null,
  "reward_value": number,
  "cap_amount": number | null
}

Rules:
- "$50" or "HK$50 coupon" or "現金券" or "優惠券" → reward_type = "FIXED", reward_value = 50
- "5% cashback" or "5%回贈" → reward_type = "PERCENT", reward_value = 5
- If both exist → prefer FIXED
- If unclear → return null for reward_type and reward_value

Extract min_spend from phrases like "滿HK$500", "消費滿$500"
Extract cap_amount from phrases like "最高HK$100", "上限HK$200"

Offer text:
"""
${text}
"""`

  console.log('📝 Parsing offer:', text.substring(0, 100))

  try {
    const result = await model.generateContent(prompt)
    const content = result.response.text()

    if (!content) {
      console.log('⚠️ No response from Gemini')
      return null
    }

    // Try to parse JSON from response
    let parsed
    try {
      // Try direct parse first
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
    const resultMapped = {
      merchant_name: parsed.merchant || null,
      category: parsed.category || null,
      bank: parsed.bank || null,
      card: parsed.card || null,
      min_spend: parsed.min_spend ?? null,
      reward_type: parsed.reward_type || null,
      reward_value: parsed.reward_value ?? null,
      cap_amount: parsed.cap_amount ?? null
    }

    return resultMapped

  } catch (error) {
    console.error('❌ Gemini error:', error.message)
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