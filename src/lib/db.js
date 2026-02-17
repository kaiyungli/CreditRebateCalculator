// Credit Card Rebate Calculator - Database Utility
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ====================
// CARD FUNCTIONS
// ====================

// Get all cards
export async function getCards(filters = {}) {
  const { bank_id, card_type, status = 'ACTIVE', limit = 50 } = filters;
  
  let query = `
    SELECT c.*, b.name as bank_name, b.logo_url as bank_logo
    FROM cards c
    JOIN banks b ON c.bank_id = b.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (bank_id) {
    query += ` AND c.bank_id = $${paramIndex}`;
    params.push(bank_id);
    paramIndex++;
  }
  
  if (card_type) {
    query += ` AND c.card_type = $${paramIndex}`;
    params.push(card_type);
    paramIndex++;
  }
  
  query += ` AND c.status = $${paramIndex}`;
  params.push(status);
  paramIndex++;
  
  query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);
  
  const result = await pool.query(query, params);
  return result.rows;
}

// Get single card with rates
export async function getCardById(id) {
  const cardResult = await pool.query(
    `SELECT c.*, b.name as bank_name, b.logo_url as bank_logo
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

// Get all categories
export async function getCategories() {
  const result = await pool.query(
    `SELECT * FROM categories ORDER BY sort_order, name`
  );
  return result.rows;
}

// Get category by ID
export async function getCategoryById(id) {
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// ====================
// CALCULATION FUNCTIONS
// ====================

// Calculate rebate for a transaction
export async function calculateRebate(cardId, categoryId, amount) {
  const result = await pool.query(
    `SELECT calculate_rebate($1, $2, $3) as rebate_amount`,
    [cardId, categoryId, amount]
  );
  return result.rows[0]?.rebate_amount || 0;
}

// OPTIMIZED: Get all cards with rebate rates in ONE query
export async function getAllCardsWithRates() {
  const result = await pool.query(`
    SELECT 
      c.id,
      c.name as card_name,
      c.card_type,
      b.name as bank_name,
      b.logo_url as bank_logo,
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

// Find best card for a category and amount
export async function findBestCard(categoryId, amount, cardType = null) {
  let query = `
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
    query += ` AND c.card_type = $${paramIndex}`;
    params.push(cardType);
  }
  
  query += ` ORDER BY rebate_amount DESC LIMIT 5`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

// ====================
// USER FUNCTIONS
// ====================

// Get user by telegram_id
export async function getUserByTelegramId(telegramId) {
  const result = await pool.query(
    `SELECT * FROM users WHERE telegram_id = $1`,
    [telegramId]
  );
  return result.rows[0] || null;
}

// Create or update user
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

// Save calculation to history
export async function saveCalculation(userId, data) {
  const result = await pool.query(
    `INSERT INTO calculations (user_id, amount, category_id, card_id, rebate_type, rebate_amount, effective_rate)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, data.amount, data.category_id, data.card_id, data.rebate_type, data.rebate_amount, data.effective_rate]
  );
  return result.rows[0];
}

// Get user's calculation history
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

// Get all banks
export async function getBanks() {
  const result = await pool.query(
    `SELECT * FROM banks WHERE status = 'ACTIVE' ORDER BY name`
  );
  return result.rows;
}

// ====================
// MERCHANT RATES FUNCTIONS
// ====================

// Get merchant rates for specific cards and category
export async function getMerchantRates(cardIds, categoryId) {
  const result = await pool.query(
    `SELECT 
        mr.merchant_name,
        mr.category_id,
        c.id as card_id,
        c.name as card_name,
        b.name as bank_name,
        mr.rebate_rate,
        mr.rebate_type,
        mr.conditions,
        c.card_type
      FROM merchant_rates mr
      JOIN cards c ON mr.card_id = c.id
      JOIN banks b ON c.bank_id = b.id
      WHERE mr.card_id = ANY($1)
        AND mr.category_id = $2
        AND mr.status = 'ACTIVE'
        AND c.status = 'ACTIVE'
      ORDER BY mr.merchant_name, c.name`,
    [cardIds, categoryId]
  );
  return result.rows;
}

// ====================
// UTILITY
// ====================

// Test connection
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

export default pool;
