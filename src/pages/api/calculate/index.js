// API: Calculate best rebate combo for multiple items
// Supports: merchant override, percent/per_amount, caps, beam search
import { query, getActiveCards, getActiveRulesAndMerchants } from '../../../lib/db';

// ====================
// REBATE CALCULATOR
// ====================

function calculateRebateAmount(rule, amount) {
  const { rate_unit, rate_value, per_amount, cap_value, min_spend } = rule;
  
  // Check minimum spend
  if (min_spend && amount < min_spend) {
    return 0;
  }
  
  let rebate = 0;
  
  if (rate_unit === 'percent') {
    // 4% cashback = rate_value = 0.04
    rebate = amount * rate_value;
  } else if (rate_unit === 'per_amount') {
    // HK$6/里 = 每 HK$6 賺 1 里
    // rate_value = 6, per_amount = 1 (1里 per $6)
    const units = Math.floor(amount / rate_value);
    rebate = units * per_amount;
  }
  
  // Apply cap (will be applied at combo level for shared caps)
  if (cap_value) {
    return Math.min(rebate, cap_value);
  }
  
  return rebate;
}

function buildRulesMap(rules) {
  // Build efficient lookup structures
  const cardCategoryRules = {};  // card_id -> category_id -> [rules]
  const cardMerchantRules = {};  // card_id -> merchant_id -> [rules]
  const categoryFallback = {};   // category_id -> [cards with rules]
  const merchantKeyToId = {};    // merchant_key -> merchant_id (passed from DB)
  
  for (const rule of rules) {
    // Card x Category rules
    if (!cardCategoryRules[rule.card_id]) {
      cardCategoryRules[rule.card_id] = {};
    }
    if (!cardCategoryRules[rule.card_id][rule.category_id]) {
      cardCategoryRules[rule.card_id][rule.category_id] = [];
    }
    cardCategoryRules[rule.card_id][rule.category_id].push(rule);
    
    // Card x Merchant rules (if merchant_id exists)
    if (rule.merchant_id) {
      if (!cardMerchantRules[rule.card_id]) {
        cardMerchantRules[rule.card_id] = {};
      }
      if (!cardMerchantRules[rule.card_id][rule.merchant_id]) {
        cardMerchantRules[rule.card_id][rule.merchant_id] = [];
      }
      cardMerchantRules[rule.card_id][rule.merchant_id].push(rule);
    }
  }
  
  return { cardCategoryRules, cardMerchantRules, categoryFallback, merchantKeyToId };
}

function findBestCardForItem(item, rulesMap, userCardIds) {
  const { category_id, merchant_id, amount } = item;
  
  // 1. Try merchant-specific rule (highest priority)
  if (merchant_id) {
    for (const cardId of userCardIds) {
      const merchantRules = rulesMap.cardMerchantRules[cardId]?.[merchant_id] || [];
      for (const rule of merchantRules) {
        const rebate = calculateRebateAmount(rule, amount);
        if (rebate > 0) {
          return { cardId, rebate, rule, source: 'merchant' };
        }
      }
    }
  }
  
  // 2. Fallback to category rule
  for (const cardId of userCardIds) {
    const categoryRules = rulesMap.cardCategoryRules[cardId]?.[category_id] || [];
    for (const rule of categoryRules) {
      const rebate = calculateRebateAmount(rule, amount);
      if (rebate > 0) {
        return { cardId, rebate, rule, source: 'category' };
      }
    }
  }
  
  // 3. No rule found
  return null;
}

// ====================
// BEAM SEARCH FOR COMBO
// ====================

function beamSearch(items, rulesMap, userCardIds, beamWidth = 10) {
  // Beam search: keep top-K states at each step
  // State: { index, selections, totalRebate, capUsed }
  
  const initialState = {
    index: 0,
    selections: [],  // [{itemIndex, cardId, rebate, rule}]
    totalRebate: 0,
    capUsed: {}     // { cardId: { cap_type: amount } }
  };
  
  let beam = [initialState];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nextBeam = [];
    
    for (const state of beam) {
      // Try each possible card for this item
      const result = findBestCardForItem(item, rulesMap, userCardIds);
      
      if (result) {
        const { cardId, rebate, rule, source } = result;
        
        // Apply cap logic
        const newCapUsed = { ...state.capUsed };
        const capKey = `${cardId}_${rule.cap_period || 'none'}`;
        if (!newCapUsed[capKey]) newCapUsed[capKey] = 0;
        
        let effectiveRebate = rebate;
        if (rule.cap_value) {
          const currentUsed = newCapUsed[capKey];
          const remaining = rule.cap_value - currentUsed;
          effectiveRebate = Math.min(rebate, remaining);
          if (effectiveRebate > 0) {
            newCapUsed[capKey] = currentUsed + effectiveRebate;
          } else {
            effectiveRebate = 0;
          }
        }
        
        if (effectiveRebate > 0 || source === 'merchant') {
          const newState = {
            index: i + 1,
            selections: [...state.selections, { itemIndex: i, cardId, rebate: effectiveRebate, source, rule }],
            totalRebate: state.totalRebate + effectiveRebate,
            capUsed: newCapUsed
          };
          nextBeam.push(newState);
        }
      }
      
      // Also allow "no card" option
      nextBeam.push({
        ...state,
        index: i + 1,
        selections: [...state.selections, { itemIndex: i, cardId: null, rebate: 0, source: 'none' }],
        totalRebate: state.totalRebate
      });
    }
    
    // Keep top-K states
    nextBeam.sort((a, b) => b.totalRebate - a.totalRebate);
    beam = nextBeam.slice(0, beamWidth);
  }
  
  // Return best complete state
  const completeStates = beam.filter(s => s.index === items.length);
  return completeStates[0] || beam[0];
}

// ====================
// MAIN HANDLER
// ====================

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { items = [], userCardIds = [], userId = null } = await request.json();
    
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all active cards and rules
    const activeCards = await getActiveCards();
    const { merchantKeyToId, rules } = await getActiveRulesAndMerchants();
    
    // If userCardIds not provided, use all active cards
    const targetCardIds = userCardIds.length > 0 
      ? userCardIds 
      : activeCards.map(c => c.id);
    
    // Build rules lookup map
    const rulesMap = buildRulesMap(rules);
    
    // Map merchant names to IDs
    const mappedItems = items.map(item => ({
      ...item,
      merchant_id: item.merchant_name 
        ? merchantKeyToId[item.merchant_name] || null 
        : null
    }));
    
    // Run beam search to find optimal combo
    const bestState = beamSearch(mappedItems, rulesMap, targetCardIds);
    
    // Build response
    const results = bestState.selections.map((sel, idx) => {
      const item = items[sel.itemIndex];
      const card = activeCards.find(c => c.id === sel.cardId);
      return {
        itemIndex: sel.itemIndex,
        categoryId: item.category_id,
        merchantName: item.merchant_name || null,
        amount: item.amount,
        selectedCard: card ? {
          id: card.id,
          name: card.name,
          bankId: card.bank_id,
          rewardProgram: card.reward_program
        } : null,
        rebate: Math.round(sel.rebate * 100) / 100,
        source: sel.source,  // 'merchant', 'category', or 'none'
        rule: sel.rule ? {
          rateUnit: sel.rule.rate_unit,
          rateValue: sel.rule.rate_value,
          perAmount: sel.rule.per_amount,
          capValue: sel.rule.cap_value
        } : null
      };
    });
    
    const totalRebate = Math.round(bestState.totalRebate * 100) / 100;
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const effectiveRate = totalAmount > 0 ? (totalRebate / totalAmount) : 0;
    
    // Save to history if userId provided
    // TODO: Implement saveCalculation
    
    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        totalAmount,
        totalRebate,
        effectiveRate: Math.round(effectiveRate * 10000) / 10000,
        itemsCount: items.length,
        cardsUsed: [...new Set(bestState.selections.filter(s => s.cardId).map(s => s.cardId))]
      }
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
