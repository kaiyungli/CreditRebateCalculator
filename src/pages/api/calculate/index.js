// API: Calculate best rebate for multiple expenses
import { findBestCard, calculateRebate, getCardById, getCategoryById, getCategories } from '../../../lib/db';

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

    // 計算每筆消費的最佳卡片
    const results = await Promise.all(
      expenses.map(async (expense) => {
        const categoryIdNum = parseInt(expense.categoryId);
        const amountNum = parseFloat(expense.amount);
        
        // 獲取最佳卡片
        const bestCards = await findBestCard(categoryIdNum, amountNum);
        
        // 根據用戶已選卡片過濾
        let availableCards = bestCards;
        if (userCards.length > 0) {
          availableCards = bestCards.filter(card => userCards.includes(card.id));
        }
        
        // 如果用戶有選卡片，搵最佳嗰張
        let bestCard;
        if (availableCards.length > 0) {
          bestCard = availableCards[0]; // 已經按回贈金額排序
        } else {
          // 如果冇選卡片，用最佳嗰張
          bestCard = bestCards[0] || null;
        }
        
        // 如果冇找到卡片，回傳 null
        if (!bestCard) {
          return {
            ...expense,
            bestCard: null,
            rebate: 0,
          };
        }
        
        // 計算回贈金額
        const rebateAmount = await calculateRebate(bestCard.id, categoryIdNum, amountNum);
        
        return {
          ...expense,
          bestCard: {
            id: bestCard.id,
            bank_name: bestCard.bank_name,
            card_name: bestCard.card_name,
            icon: '💳', // 可從 database 拎
            base_rate: bestCard.base_rate,
            rebate_type: bestCard.rebate_type,
          },
          rebate: rebateAmount,
        };
      })
    );

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
