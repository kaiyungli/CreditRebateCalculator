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
  console.warn('⚠️ DATABASE_URL not found, pool not created')
}

globalForPg.__pgPool = __pgPool
export const pool = __pgPool
export default pool

// ====================
// BASE QUERY FUNCTION
// ====================

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

// ====================
// CARD FUNCTIONS
// ====================

export async function getActiveCards() {
  const { rows } = await query(
    `SELECT id, bank_id, name, name_en, reward_program 
     FROM cards 
     WHERE status = 'ACTIVE' 
     ORDER BY id`
  );
  return rows;
}

export async function getCards(filters = {}) {
  const { bank_id, card_type, status = 'ACTIVE', limit = 50 } = filters;
  
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
  
  if (card_type) {
    queryStr += ` AND c.card_type = $${paramIndex}`;
    params.push(card_type);
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
// CATEGORY FUNCTIONS
// ====================

export async function getCategories() {
  const result = await pool.query(
    `SELECT * FROM categories ORDER BY sort_order, name`
  );
  return result.rows;
}

export async function getCategoryById(id) {
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// ====================
// RULES & MERCHANTS FUNCTIONS
// ====================

export async function getActiveRulesAndMerchants() {
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
// OPTIMIZED CALCULATION FUNCTIONS
// ====================

export async function getAllCardsWithRates() {
  const result = await pool.query(`
    SELECT 
      c.id,
      c.name as card_name,
      c.card_type,
      b.name as bank_name,
      rr.category_id,
      rr.base_rate,
      rr.rebate_type,
      rr.cap_amount,
      rr.cap_type,
      rr.min_spend,
      rr.valid_from,
      rr.valid_to
    FROM cards c
    JOIN banks b ON c.bank_id = b.id
    JOIN rebate_rates rr ON c.id = rr.card_id
    WHERE c.status = 'ACTIVE'
      AND rr.status = 'ACTIVE'
      AND (rr.valid_to IS NULL OR rr.valid_to >= CURRENT_DATE)
    ORDER BY c.id, rr.category_id
  `);
  return result.rows;
}

export async function findBestCard(categoryId, amount, cardType = null) {
  let queryStr = `
    SELECT 
      c.id,
      c.name as card_name,
      b.name as bank_name,
      rr.base_rate,
      rr.rebate_type,
      rr.cap_amount,
      rr.cap_type,
      (calculate_rebate(c.id, $1, $2)) as rebate_amount
    FROM cards c
    JOIN rebate_rates rr ON c.id = rr.card_id
    JOIN banks b ON c.bank_id = b.id
    WHERE rr.category_id = $1 
      AND c.status = 'ACTIVE'
      AND rr.status = 'ACTIVE'
      AND (rr.valid_to IS NULL OR rr.valid_to >= CURRENT_DATE)
  `;
  
  const params = [categoryId, amount];
  let paramIndex = 3;
  
  if (cardType) {
    queryStr += ` AND c.card_type = $${paramIndex}`;
    params.push(cardType);
  }
  
  queryStr += ` ORDER BY rebate_amount DESC LIMIT 5`;
  
  const result = await pool.query(queryStr, params);
  return result.rows;
}

// ====================
// USER FUNCTIONS
// ====================

export async function getUserByTelegramId(telegramId) {
  const result = await pool.query(
    `SELECT * FROM users WHERE telegram_id = $1`,
    [telegramId]
  );
  return result.rows[0] || null;
}

export async function upsertUser(telegramId, data = {}) {
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
  const result = await pool.query(
    `INSERT INTO calculations (user_id, amount, category_id, card_id, rebate_type, rebate_amount, effective_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, data.amount, data.category_id, data.card_id, data.rebate_type, data.rebate_amount, data.effective_rate]
  );
  return result.rows[0];
}

export async function getUserCalculations(userId, limit = 20) {
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
// BANK FUNCTIONS
// ====================

export async function getBanks() {
  const result = await pool.query(
    `SELECT * FROM banks WHERE status = 'ACTIVE' ORDER BY name`
  );
  return result.rows;
}

// ====================
// MERCHANT RATES FUNCTIONS
// ====================

// Replace your existing getMerchantRates(cardIds, categoryId)
// New source: reward_rules + merchants + cards
export async function getMerchantRates(cardIds = [], categoryId = null) {
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
  const result = await pool.query(`
    SELECT id, name, aliases_json, default_category_id, is_active
    FROM merchants
    WHERE is_active = true
    ORDER BY name
  `);
  return result.rows;
}

export async function getMerchantRatesForCards(cardIds) {
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
// UTILITY
// ====================

export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
