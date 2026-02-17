// API: Get merchant rates (merchant-specific rules, shown regardless of category)
import { getMerchantRates } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all merchant-specific rules (regardless of category)
    const rows = await getMerchantRates();

    // Group by merchant
    const merchantRates = {};
    rows.forEach(row => {
      if (!merchantRates[row.merchant_name]) {
        merchantRates[row.merchant_name] = {
          merchant_name: row.merchant_name,
          merchant_key: row.merchant_key,
          default_category_id: row.category_id,
          cards: []
        };
      }
      
      // Format the rate display based on rate_unit
      let rateDisplay = '';
      const rateVal = parseFloat(row.rate_value) || 0;
      const perAmount = parseFloat(row.per_amount) || 0;
      
      if (row.rate_unit === 'PER_AMOUNT' && perAmount > 0) {
        // PER_AMOUNT: e.g., HK$6/里 → rate_value = 1/6 = 0.1667
        const hkdPerUnit = perAmount > 0 ? perAmount : (rateVal > 0 ? (1 / rateVal) : 0);
        rateDisplay = `HK$${hkdPerUnit.toFixed(0)}/里`;
      } else if (rateVal > 0) {
        // PERCENT: e.g., 4% → rate_value = 0.04
        rateDisplay = `${(rateVal * 100).toFixed(1)}%`;
      } else {
        rateDisplay = '-';
      }

      merchantRates[row.merchant_name].cards.push({
        rule_id: row.rule_id,
        card_id: row.card_id,
        card_name: row.card_name,
        reward_program: row.reward_program,
        reward_kind: row.reward_kind,
        rate_value: row.rate_value,
        rate_unit: row.rate_unit,
        per_amount: row.per_amount,
        cap_value: row.cap_value,
        cap_period: row.cap_period,
        min_spend: row.min_spend,
        rate_display: rateDisplay
      });
    });

    return res.status(200).json({
      success: true,
      merchants: Object.values(merchantRates),
    });
  } catch (error) {
    console.error('Error fetching merchant rates:', error);
    return res.status(500).json({ error: error.message });
  }
}
