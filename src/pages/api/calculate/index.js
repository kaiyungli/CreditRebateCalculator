// API: Calculate best rebate
import { findBestCard, calculateRebate, getCardById, getCategoryById } from '../../../lib/db';

export default async function handler(request) {
  const { category_id, amount, card_type, card_id } = request.query;

  if (!category_id || !amount) {
    return new Response(JSON.stringify({ 
      error: 'category_id and amount are required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const amountNum = parseFloat(amount);
    const categoryIdNum = parseInt(category_id);

    // If specific card_id provided, calculate for that card
    if (card_id) {
      const card = await getCardById(parseInt(card_id));
      const category = await getCategoryById(categoryIdNum);
      
      if (!card) {
        return new Response(JSON.stringify({ error: 'Card not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const rebateAmount = await calculateRebate(parseInt(card_id), categoryIdNum, amountNum);
      const effectiveRate = amountNum > 0 ? rebateAmount / amountNum : 0;

      return new Response(JSON.stringify({
        card,
        category,
        amount: amountNum,
        rebate_amount: rebateAmount,
        effective_rate: effectiveRate,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find best cards
    const bestCards = await findBestCard(categoryIdNum, amountNum, card_type);

    return new Response(JSON.stringify({
      category_id: categoryIdNum,
      amount: amountNum,
      best_cards: bestCards,
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
