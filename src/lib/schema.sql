-- =====================================
-- CardCal Phase 1 - Full DB Schema
-- =====================================

-- Use DROP IF EXISTS for clean migration (comment out in production)
DROP TABLE IF EXISTS calculations CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS reward_rules CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS banks CASCADE;

-- =====================================
-- BANKS
-- =====================================
CREATE TABLE IF NOT EXISTS banks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- CARDS
-- =====================================
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER REFERENCES banks(id),
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  reward_program VARCHAR(20) NOT NULL,  -- CASHBACK | MILES | POINTS
  annual_fee INTEGER DEFAULT 0,
  image_url TEXT,
  apply_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cards_bank ON cards(bank_id);

-- =====================================
-- CATEGORIES
-- =====================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  parent_id INTEGER REFERENCES categories(id),
  level INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- =====================================
-- MERCHANTS
-- =====================================
CREATE TABLE IF NOT EXISTS merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  merchant_key VARCHAR(120) UNIQUE NOT NULL,
  default_category_id INTEGER REFERENCES categories(id),
  aliases TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_category ON merchants(default_category_id);

-- =====================================
-- REWARD RULES (核心)
-- =====================================
CREATE TABLE IF NOT EXISTS reward_rules (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  merchant_id INTEGER REFERENCES merchants(id),
  category_id INTEGER REFERENCES categories(id),
  reward_kind VARCHAR(20) NOT NULL,  -- CASHBACK | MILES | POINTS
  rate_unit VARCHAR(20) NOT NULL,   -- PERCENT | PER_AMOUNT
  rate_value NUMERIC(12,6) NOT NULL,
  per_amount NUMERIC(12,2),
  cap_value NUMERIC(12,2),
  cap_period VARCHAR(20) DEFAULT 'MONTHLY',
  min_spend NUMERIC(12,2),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  priority INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rule_card ON reward_rules(card_id);
CREATE INDEX idx_rule_merchant ON reward_rules(merchant_id);
CREATE INDEX idx_rule_category ON reward_rules(category_id);

-- =====================================
-- USERS
-- =====================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- USER CARDS
-- =====================================
CREATE TABLE IF NOT EXISTS user_cards (
  user_id INTEGER REFERENCES users(id),
  card_id INTEGER REFERENCES cards(id),
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, card_id)
);

-- =====================================
-- CALCULATIONS
-- =====================================
CREATE TABLE IF NOT EXISTS calculations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  input_json JSONB NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- SEED DATA（示範）
-- =====================================

-- BANKS
INSERT INTO banks (name) VALUES ('HSBC'), ('Standard Chartered');

-- CATEGORIES
INSERT INTO categories (name) VALUES ('Dining'), ('Supermarket'), ('Online');

-- MERCHANTS
INSERT INTO merchants (name, merchant_key) VALUES 
  ('壽司郎', 'sushiro'), 
  ('百佳', 'parknshop');

-- CARDS
INSERT INTO cards (bank_id, name, reward_program) VALUES 
  (1, 'HSBC Red', 'CASHBACK'), 
  (2, 'SCB Asia Miles', 'MILEAGE');

-- RULES
-- RULE 1：HSBC Dining 4%
INSERT INTO reward_rules (card_id, category_id, reward_kind, rate_unit, rate_value) 
VALUES (1, 1, 'CASHBACK', 'PERCENT', 0.04);

-- RULE 2：HSBC 壽司郎 6% cap $30
INSERT INTO reward_rules (card_id, merchant_id, reward_kind, rate_unit, rate_value, cap_value, priority) 
VALUES (1, 1, 'CASHBACK', 'PERCENT', 0.06, 30, 10);

-- RULE 3：SCB 百佳 $6/里
INSERT INTO reward_rules (card_id, merchant_id, reward_kind, rate_unit, rate_value, per_amount) 
VALUES (2, 2, 'MILEAGE', 'PER_AMOUNT', 1, 6);
