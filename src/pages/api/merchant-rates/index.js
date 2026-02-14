// API: Get merchant rates for selected cards and category
import { getMerchantRates } from '../../../lib/db';

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { card_ids, category_id } = request.query;

    if (!card_ids || !category_id) {
      return new Response(JSON.stringify({ 
        error: 'card_ids and category_id are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse card_ids (comma-separated string to array)
    const cardIdArray = card_ids.split(',').map(id => parseInt(id.trim()));

    // Get merchant rates from database
    const rows = await getMerchantRates(cardIdArray, parseInt(category_id));

    // Group by merchant
    const merchantRates = {};
    rows.forEach(row => {
      if (!merchantRates[row.merchant_name]) {
        merchantRates[row.merchant_name] = {
          merchant_name: row.merchant_name,
          category_id: row.category_id,
          cards: []
        };
      }
      
      // Format the rate display
      let rateDisplay;
      if (row.rebate_type === 'MILEAGE') {
        rateDisplay = `HK$${(1 / row.rebate_rate).toFixed(0)}/里`;
      } else if (row.rebate_type === 'POINTS') {
        rateDisplay = `HK$${(1 / row.rebate_rate).toFixed(0)}/積分`;
      } else {
        rateDisplay = `${(row.rebate_rate * 100).toFixed(1)}%`;
      }

      merchantRates[row.merchant_name].cards.push({
        card_id: row.card_id,
        card_name: row.card_name,
        bank_name: row.bank_name,
        rebate_rate: row.rebate_rate,
        rebate_type: row.rebate_type,
        rate_display: rateDisplay,
        conditions: row.conditions
      });
    });

    return new Response(JSON.stringify({
      success: true,
      merchants: Object.values(merchantRates),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching merchant rates:', error);
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack ? error.stack.toString().substring(0, 500) : '';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
