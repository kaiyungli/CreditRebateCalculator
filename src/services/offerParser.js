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
  "reward_type": "PERCENT" or "FIXED",
  "reward_value": number,
  "cap_amount": number or null
}

Rules:
- merchant: Exact merchant name (e.g. "壽司郎", "麥當勞")
- category: dining/supermarket/online/travel/etc. or null
- bank: e.g. "HSBC", "中銀", "渣打"
- card: e.g. "Red Card", "Flyer Card"
- min_spend: Minimum spend requirement in HKD (number only, no currency)
- reward_type: PERCENT for % cashback, FIXED for fixed amount
- reward_value: The actual value (e.g. 5 for 5%, 50 for HK$50)
- cap_amount: Maximum reward cap in HKD, or null if no cap

If uncertain, use null.`

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

    console.log('✅ Parsed result:', JSON.stringify(parsed))

    // Map to our schema
    const result = {
      merchant_name: parsed.merchant || null,
      category: parsed.category || null,
      bank: parsed.bank || null,
      card: parsed.card || null,
      min_spend: parsed.min_spend ?? null,
      reward_type: parsed.reward_type || 'FIXED',
      reward_value: parsed.reward_value ?? 0,
      cap_amount: parsed.cap_amount ?? null
    }

    return result

  } catch (error) {
    console.error('❌ OpenAI error:', error.message)
    return null
  }
}

/**
 * Detect offer type from text (legacy helper)
 */
function detectOfferType(text) {
  // This is now handled by AI parsing
  return 'COUPON'
}

/**
 * Extract monetary values from text (legacy helper)
 */
function extractMoney(text) {
  // This is now handled by AI parsing
  return null
}

/**
 * Extract percentage values from text (legacy helper)
 */
function extractPercentage(text) {
  // This is now handled by AI parsing
  return null
}

/**
 * Extract date ranges from text (legacy helper)
 */
function extractDates(text) {
  // This is now handled by AI parsing
  return { from: null, to: null }
}

export default { parseOffer }
