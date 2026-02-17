// API: Calculate best rebate for multiple expenses (OPTIMIZED - N+1 eliminated)
import { getAllCardsWithRates } from '../../../lib/db';

function calculateRebateInMemory(card, categoryId, amount) {
  // Find matching rebate rate for this category
  const rate = card.rebate_rates?.find(r => r.category_id === categoryId);
  
  if (!rate) return 0;
  
  // Check minimum spend
  if (rate.min_spend && amount < rate.min_spend) return 0;
  
  // Calculate based on rebate type
  let rebate = 0;
  
  if (rate.rebate_type === 'PERCENTAGE') {
    rebate = amount * rate.base_rate;
  } else if (rate.rebate_type === 'MILEAGE') {
    // HK$ per mile (e.g., HK$6/里 = base_rate of 1/6)
    rebate = amount / rate.base_rate;
  } else if (rate.rebate_type === 'POINTS') {
    // HK$ per point (e.g., HK$5/分 = base_rate of 1/5)
    rebate = amount / rate.base_rate;
  }
  
  // Apply cap
  if (rate.cap_amount && rate.cap_type === 'MONTHLY') {
    rebate = Math.min(rebate, rate.cap_amount);
  }
  
  return Math.round(rebate * 100) / 100;
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { expenses = [], userCards = [] } = await request.json();
    
    if (expenses.length === 0) {
      return new Response(JSON.stringify({ error: 'No expenses provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // OPTIMIZATION: Fetch ALL cards with rates in ONE query
    const cardsData = await getAllCardsWithRates();
    
    // Transform flat data into nested structure: cardId -> card with rates array
    const cardsMap = {};
    cardsData.forEach(row => {
      if (!cardsMap[row.id]) {
        cardsMap[row.id] = {
          id: row.id,
          card_name: row.card_name,
          card_type: row.card_type,
          bank_name: row.bank_name,
          bank_logo: row.bank_logo,
          rebate_rates: []
        };
      }
      cardsMap[row.id].rebate_rates.push({
        category_id: row.category_id,
        base_rate: row.base_rate,
        rebate_type: row.rebate_type,
        cap_amount: row.cap_amount,
        cap_type: row.cap_type,
        min_spend: row.min_spend
      });
    });
    
    const allCards = Object.values(cardsMap);

    // OPTIMIZATION: Calculate everything in memory (no more DB queries!)
    const results = expenses.map(expense => {
      const categoryIdNum = parseInt(expense.categoryId);
      const amountNum = parseFloat(expense.amount);
      
      // Get all cards that have rates for this category
      const availableCards = allCards.filter(card => 
        card.rebate_rates.some(rate => rate.category_id === categoryIdNum)
      );
      
      // Calculate rebate for each card
      const cardsWithRebate = availableCards.map(card => ({
        id: card.id,
        bank_name: card.bank_name,
        card_name: card.card_name,
        rebate: calculateRebateInMemory(card, categoryIdNum, amountNum)
      }));
      
      // Sort by rebate amount (descending)
      cardsWithRebate.sort((a, b) => b.rebate - a.rebate);
      
      // Apply user card filter if provided
      let finalCards = cardsWithRebate;
      if (userCards.length > 0) {
        finalCards = cardsWithRebate.filter(card => userCards.includes(card.id));
      }
      
      // Pick best card
      const bestCard = finalCards.length > 0 ? finalCards[0] : (cardsWithRebate[0] || null);
      
      return {
        ...expense,
        bestCard: bestCard ? {
          id: bestCard.id,
          bank_name: bestCard.bank_name,
          card_name: bestCard.card_name,
          icon: '💳'
        } : null,
        rebate: bestCard ? bestCard.rebate : 0,
        allOptions: finalCards.slice(0, 5) // Top 5 options
      };
    });

    return new Response(JSON.stringify({
      success: true,
      results: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating rebate:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
