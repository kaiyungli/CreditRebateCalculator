import pg from 'pg'
const { Pool } = pg

// Create pool immediately with env check
const connectionString = process.env.DATABASE_URL
const hasDbUrl = typeof connectionString === 'string' && connectionString.length > 0

const globalForPg = globalThis

// Only create pool if DATABASE_URL exists
let __pgPool = null
if (hasDbUrl) {
  try {
    __pgPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
    console.log('✅ DB pool created')
  } catch (e) {
    console.error('❌ DB pool creation failed:', e.message)
  }
} else {
  console.warn('⚠️ DATABASE_URL not found, using fallback demo data')
}

globalForPg.__pgPool = __pgPool
export const pool = __pgPool
export default pool

// ====================
// FALLBACK DATA (Demo Mode - No DB Required)
// ====================
const FALLBACK_BANKS = [
  { id: 1, name: 'HSBC 滙豐' },
  { id: 2, name: '渣打' },
  { id: 3, name: '中銀香港' },
  { id: 4, name: '恒生' },
  { id: 5, name: '星展' },
  { id: 6, name: '安信' },
  { id: 7, name: 'AEON' },
  { id: 8, name: 'Citi' },
  { id: 9, name: '東亞' },
  { id: 10, name: '大新' },
];

const FALLBACK_CARDS = [
  // HSBC
  { id: 1, bank_id: 1, name: 'Red Card', reward_program: 'CASHBACK', bank_name: 'HSBC 滙豐' },
  { id: 2, bank_id: 1, name: 'Visa Signature', reward_program: 'CASHBACK', bank_name: 'HSBC 滙豐' },
  { id: 3, bank_id: 1, name: 'Premier Miles', reward_program: 'MILES', bank_name: 'HSBC 滙豐' },
  // 渣打
  { id: 4, bank_id: 2, name: '優先理財信用卡', reward_program: 'CASHBACK', bank_name: '渣打' },
  { id: 5, bank_id: 2, name: 'Asia Miles 信用卡', reward_program: 'MILES', bank_name: '渣打' },
  { id: 6, bank_id: 2, name: 'Smart 信用卡', reward_program: 'CASHBACK', bank_name: '渣打' },
  // 中銀
  { id: 7, bank_id: 3, name: '中都會信用卡', reward_program: 'CASHBACK', bank_name: '中銀香港' },
  { id: 8, bank_id: 3, name: 'i-card', reward_program: 'CASHBACK', bank_name: '中銀香港' },
  // 恒生
  { id: 9, bank_id: 4, name: '消費卡', reward_program: 'CASHBACK', bank_name: '恒生' },
  { id: 10, bank_id: 4, name: 'Milan Card', reward_program: 'CASHBACK', bank_name: '恒生' },
  // 星展
  { id: 11, bank_id: 5, name: 'DBS Black Card', reward_program: 'CASHBACK', bank_name: '星展' },
  { id: 12, bank_id: 5, name: 'DBS Compass Visa', reward_program: 'CASHBACK', bank_name: '星展' },
  // 安信
  { id: 13, bank_id: 6, name: 'EarnMORE 信用卡', reward_program: 'CASHBACK', bank_name: '安信' },
  { id: 14, bank_id: 6, name: 'WeWa 信用卡', reward_program: 'CASHBACK', bank_name: '安信' },
  // AEON
  { id: 15, bank_id: 7, name: 'AEON 信用卡', reward_program: 'CASHBACK', bank_name: 'AEON' },
  { id: 16, bank_id: 7, name: 'AEON Card (DC)', reward_program: 'CASHBACK', bank_name: 'AEON' },
  // Citi
  { id: 17, bank_id: 8, name: 'Citi Prestige', reward_program: 'MILES', bank_name: 'Citi' },
  { id: 18, bank_id: 8, name: 'Citi Clear Card', reward_program: 'CASHBACK', bank_name: 'Citi' },
  // 東亞
  { id: 19, bank_id: 9, name: '東亞信用卡', reward_program: 'CASHBACK', bank_name: '東亞' },
  // 大新
  { id: 20, bank_id: 10, name: '大新信用卡', reward_program: 'CASHBACK', bank_name: '大新' },
];

const FALLBACK_CATEGORIES = [
  { id: 1, name: '餐飲', icon: '🍽️', sort_order: 1 },
  { id: 2, name: '超市', icon: '🛒', sort_order: 2 },
  { id: 3, name: '網上購物', icon: '🛍️', sort_order: 3 },
  { id: 4, name: '交通', icon: '🚇', sort_order: 4 },
  { id: 5, name: '電訊', icon: '📱', sort_order: 5 },
  { id: 6, name: '電費', icon: '💡', sort_order: 6 },
  { id: 7, name: '娛樂', icon: '🎬', sort_order: 7 },
  { id: 8, name: '旅行', icon: '✈️', sort_order: 8 },
  { id: 9, name: '健康', icon: '💊', sort_order: 9 },
  { id: 10, name: '教育', icon: '📚', sort_order: 10 },
  { id: 11, name: '政府/公共服務', icon: '🏛️', sort_order: 11 },
  { id: 12, name: '其他', icon: '💳', sort_order: 99 },
];

// Reward rules with more realistic rates
const FALLBACK_RULES = [
  // HSBC Red - 餐飲 4%, 網上 2%, 超市 1%
  { id: 1, card_id: 1, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.04, priority: 100 },
  { id: 2, card_id: 1, category_id: 3, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  { id: 3, card_id: 1, category_id: 2, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.01, priority: 100 },
  // HSBC Visa Signature - 餐飲 5%, 超市 2%, 網上 2%
  { id: 4, card_id: 2, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.05, priority: 100 },
  { id: 5, card_id: 2, category_id: 2, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  { id: 6, card_id: 2, category_id: 3, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  // HSBC Premier Miles - 里數
  { id: 7, card_id: 3, category_id: 8, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 4, priority: 100 },
  { id: 8, card_id: 3, category_id: 1, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 5, priority: 100 },
  // 渣打優先理財 - 餐飲 4%, 超市 2%
  { id: 9, card_id: 4, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.04, priority: 100 },
  { id: 10, card_id: 4, category_id: 2, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  // 渣打Asia Miles - 里數
  { id: 11, card_id: 5, category_id: 1, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 4, priority: 100 },
  { id: 12, card_id: 5, category_id: 3, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 5, priority: 100 },
  { id: 13, card_id: 5, category_id: 8, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 3, priority: 100 },
  // 渣打Smart - 全單 1%
  { id: 14, card_id: 6, category_id: 12, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.01, priority: 100 },
  // 中銀 - 餐飲 2%, 超市 2%
  { id: 15, card_id: 7, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  { id: 16, card_id: 7, category_id: 2, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  { id: 17, card_id: 7, category_id: 3, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.01, priority: 100 },
  // 恒生消費卡 - 餐飲 5%, 超市 2%
  { id: 18, card_id: 9, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.05, priority: 100 },
  { id: 19, card_id: 9, category_id: 2, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  // 星展 Black Card - 全單 1.5%
  { id: 20, card_id: 11, category_id: 12, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.015, priority: 100 },
  // 安信 EarnMORE - 全單 2%
  { id: 21, card_id: 13, category_id: 12, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  // AEON - 全單 1%
  { id: 22, card_id: 15, category_id: 12, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.01, priority: 100 },
  // Citi Prestige - 里數
  { id: 23, card_id: 17, category_id: 1, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 3, priority: 100 },
  { id: 24, card_id: 17, category_id: 8, reward_kind: 'MILES', rate_unit: 'PER_AMOUNT', rate_value: 1, per_amount: 2, priority: 100 },
  // Citi Clear - 餐飲 2%, 網上 2%
  { id: 25, card_id: 18, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  { id: 26, card_id: 18, category_id: 3, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  // 東亞
  { id: 27, card_id: 19, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.02, priority: 100 },
  // 大新
  { id: 28, card_id: 20, category_id: 1, reward_kind: 'CASHBACK', rate_unit: 'PERCENT', rate_value: 0.015, priority: 100 },
];

// Helper to check if we're in fallback mode
function isFallbackMode() {
  return !hasDbUrl || !__pgPool;
}

// ====================
// BASE QUERY FUNCTION (with fallback support)
// ====================

export async function query(text, params) {
  if (!pool) {
    throw new Error('Database not configured');
  }
  const result = await pool.query(text, params);
  return result;
}

// ====================
// CARD FUNCTIONS (with fallback)
// ====================

export async function getActiveCards() {
  if (isFallbackMode()) {
    return FALLBACK_CARDS;
  }
  const { rows } = await query(
    `SELECT id, bank_id, name, name_en, reward_program 
     FROM cards 
     WHERE status = 'ACTIVE' 
     ORDER BY id`
  );
  return rows;
}

export async function getCards(filters = {}) {
  if (isFallbackMode()) {
    let cards = [...FALLBACK_CARDS];
    if (filters.bank_id) {
      cards = cards.filter(c => c.bank_id === filters.bank_id);
    }
    if (filters.reward_program) {
      cards = cards.filter(c => c.reward_program === filters.reward_program);
    }
    return cards.slice(0, filters.limit || 50);
  }
  
  const { bank_id, reward_program, status = 'ACTIVE', limit = 50 } = filters;
  
  let queryStr = `
    SELECT c.*, b.name as bank_name
    FROM cards c
    JOIN banks b ON c.bank_id = b.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (bank_id) {
    queryStr += ` AND c.bank_id = $${paramIndex}`;
    params.push(bank_id);
    paramIndex++;
  }
  
  if (reward_program) {
    queryStr += ` AND c.reward_program = $${paramIndex}`;
    params.push(reward_program);
    paramIndex++;
  }
  
  queryStr += ` AND c.status = $${paramIndex}`;
  params.push(status);
  paramIndex++;
  
  queryStr += ` ORDER BY c.created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);
  
  const result = await pool.query(queryStr, params);
  return result.rows;
}

export async function getCardById(id) {
  if (isFallbackMode()) {
    const card = FALLBACK_CARDS.find(c => c.id === id);
    if (!card) return null;
    const bank = FALLBACK_BANKS.find(b => b.id === card.bank_id);
    return { ...card, bank_name: bank?.name };
  }
  
  const cardResult = await pool.query(
    `SELECT c.*, b.name as bank_name
     FROM cards c
     JOIN banks b ON c.bank_id = b.id
     WHERE c.id = $1`,
    [id]
  );
  
  if (cardResult.rows.length === 0) return null;
  
  const ratesResult = await pool.query(
    `SELECT rr.*, cat.name as category_name
     FROM rebate_rates rr
     JOIN categories cat ON rr.category_id = cat.id
     WHERE rr.card_id = $1 AND rr.status = 'ACTIVE'
     ORDER BY cat.name`,
    [id]
  );
  
  return {
    ...cardResult.rows[0],
    rebate_rates: ratesResult.rows,
  };
}

// ====================
// CATEGORY FUNCTIONS (with fallback)
// ====================

export async function getCategories() {
  if (isFallbackMode()) {
    return FALLBACK_CATEGORIES;
  }
  const result = await pool.query(
    `SELECT * FROM categories ORDER BY sort_order, name`
  );
  return result.rows;
}

export async function getCategoryById(id) {
  if (isFallbackMode()) {
    return FALLBACK_CATEGORIES.find(c => c.id === id) || null;
  }
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// ====================
// RULES & MERCHANTS FUNCTIONS (with fallback)
// ====================

export async function getActiveRulesAndMerchants() {
  if (isFallbackMode()) {
    // For fallback, we just return rules grouped by card
    return {
      merchantKeyToId: {},
      rules: FALLBACK_RULES,
    };
  }
  
  const merchantsRes = await query(
    `SELECT id, merchant_key, name FROM merchants WHERE status = 'ACTIVE'`
  );
  
  const rulesRes = await query(
    `SELECT id, card_id, merchant_id, category_id, reward_kind, rate_unit, 
            rate_value, per_amount, cap_value, cap_period, min_spend, 
            valid_from, valid_to, priority, status
     FROM reward_rules 
     WHERE status = 'ACTIVE' 
     ORDER BY priority ASC, id ASC`
  );
  
  const merchantKeyToId = {};
  for (const m of merchantsRes.rows) {
    merchantKeyToId[m.merchant_key] = m.id;
  }
  
  return {
    merchantKeyToId,
    rules: rulesRes.rows,
  };
}

// ====================
// BANK FUNCTIONS (with fallback)
// ====================

export async function getBanks() {
  if (isFallbackMode()) {
    return FALLBACK_BANKS;
  }
  const result = await pool.query(
    `SELECT * FROM banks WHERE status = 'ACTIVE' ORDER BY name`
  );
  return result.rows;
}

// ====================
// MERCHANT RATES FUNCTIONS (with fallback)
// ====================

export async function getMerchantRates(cardIds = [], categoryId = null) {
  if (isFallbackMode()) {
    // Return rules filtered by cardIds and categoryId
    let rules = [...FALLBACK_RULES];
    
    if (cardIds && cardIds.length > 0) {
      const ids = cardIds.map(Number);
      rules = rules.filter(r => ids.includes(r.card_id));
    }
    
    if (categoryId != null) {
      rules = rules.filter(r => r.category_id === Number(categoryId));
    }
    
    // Transform to match API response format
    const cardMap = {};
    for (const card of FALLBACK_CARDS) {
      cardMap[card.id] = card;
    }
    
    return rules.map(r => ({
      rule_id: r.id,
      card_id: r.card_id,
      card_name: cardMap[r.card_id]?.name || '',
      reward_program: cardMap[r.card_id]?.reward_program || '',
      category_id: r.category_id,
      reward_kind: r.reward_kind,
      rate_unit: r.rate_unit,
      rate_value: r.rate_value,
      per_amount: r.per_amount,
      cap_value: r.cap_value,
      cap_period: r.cap_period,
      priority: r.priority,
    }));
  }

  const params = []
  const where = [
    `rr.status = 'ACTIVE'`,
    `rr.merchant_id IS NOT NULL`,
  ]

  // filter: category
  if (categoryId != null) {
    params.push(Number(categoryId))
    where.push(`rr.category_id = $${params.length}`)
  }

  // filter: cardIds (optional)
  if (Array.isArray(cardIds) && cardIds.length > 0) {
    params.push(cardIds.map(Number))
    where.push(`rr.card_id = ANY($${params.length}::int[])`)
  }

  const sql = `
    SELECT 
      rr.id AS rule_id,
      m.id AS merchant_id,
      m.merchant_key,
      m.name AS merchant_name,
      m.default_category_id,
      rr.category_id,
      c.id AS card_id,
      c.name AS card_name,
      c.bank_id,
      c.reward_program,
      rr.reward_kind,
      rr.rate_unit,
      rr.rate_value,
      rr.per_amount,
      rr.cap_value,
      rr.cap_period,
      rr.min_spend,
      rr.priority,
      rr.valid_from,
      rr.valid_to
    FROM reward_rules rr
    JOIN merchants m ON m.id = rr.merchant_id
    JOIN cards c ON c.id = rr.card_id
    WHERE ${where.join(' AND ')}
    ORDER BY rr.priority ASC, m.name ASC, c.name ASC
  `
  const result = await pool.query(sql, params)
  return result.rows
}

export async function getAllMerchants() {
  if (isFallbackMode()) {
    return [];
  }
  const result = await pool.query(`
    SELECT id, name, aliases_json, default_category_id, is_active
    FROM merchants
    WHERE is_active = true
    ORDER BY name
  `);
  return result.rows;
}

export async function getMerchantRatesForCards(cardIds) {
  if (isFallbackMode()) {
    return getMerchantRates(cardIds);
  }
  
  const result = await pool.query(`
    SELECT 
      mr.id,
      mr.card_id,
      mr.merchant_id,
      m.name as merchant_name,
      mr.category_id,
      mr.rate_value,
      mr.rate_unit,
      mr.cap_amount_monthly,
      mr.min_spend,
      mr.priority,
      c.name as card_name,
      b.name as bank_name
    FROM merchant_rates mr
    LEFT JOIN merchants m ON mr.merchant_id = m.id
    JOIN cards c ON mr.card_id = c.id
    JOIN banks b ON c.bank_id = b.id
    WHERE mr.card_id = ANY($1)
      AND mr.status = 'ACTIVE'
      AND c.status = 'ACTIVE'
      AND (mr.valid_from IS NULL OR mr.valid_from <= CURRENT_DATE)
      AND (mr.valid_to IS NULL OR mr.valid_to >= CURRENT_DATE)
    ORDER BY mr.priority DESC, mr.rate_value DESC
  `, [cardIds]);
  return result.rows;
}

// ====================
// USER FUNCTIONS
// ====================

export async function getUserByTelegramId(telegramId) {
  if (isFallbackMode()) return null;
  const result = await pool.query(
    `SELECT * FROM users WHERE telegram_id = $1`,
    [telegramId]
  );
  return result.rows[0] || null;
}

export async function upsertUser(telegramId, data = {}) {
  if (isFallbackMode()) return null;
  const result = await pool.query(
    `INSERT INTO users (telegram_id, my_cards, preferences)
     VALUES ($1, $2, $3)
     ON CONFLICT (telegram_id)
     DO UPDATE SET my_cards = $2, preferences = $3, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [telegramId, JSON.stringify(data.my_cards || []), JSON.stringify(data.preferences || {})]
  );
  return result.rows[0];
}

export async function saveCalculation(userId, data) {
  if (isFallbackMode()) return null;
  const result = await pool.query(
    `INSERT INTO calculations (user_id, amount, category_id, card_id, rebate_type, rebate_amount, effective_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, data.amount, data.category_id, data.card_id, data.rebate_type, data.rebate_amount, data.effective_rate]
  );
  return result.rows[0];
}

export async function getUserCalculations(userId, limit = 20) {
  if (isFallbackMode()) return [];
  const result = await pool.query(
    `SELECT calc.*, c.name as card_name, cat.name as category_name
     FROM calculations calc
     LEFT JOIN cards c ON calc.card_id = c.id
     LEFT JOIN categories cat ON calc.category_id = cat.id
     WHERE calc.user_id = $1
     ORDER BY calc.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

// ====================
// UTILITY
// ====================

export async function testConnection() {
  if (isFallbackMode()) {
    console.log('📦 Running in fallback/demo mode');
    return true;
  }
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
