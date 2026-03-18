const { Pool } = require('pg');

// Direct connection to Supabase
const pool = new Pool({
  host: 'db.qcvileuzjzoltwttrjli.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ.Lsy0hszyCsB6ZrtREanBQcOioBV6e5JtZG9R4y8m6R4',
  ssl: { rejectUnauthorized: false }
});

async function applySchemaMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Applying new schema migration...');
    
    // Create tables
    await client.query(`
      -- BANKS
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- CARDS
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        bank_id INTEGER REFERENCES banks(id),
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        reward_program VARCHAR(20) NOT NULL,
        annual_fee INTEGER DEFAULT 0,
        image_url TEXT,
        apply_url TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cards_bank ON cards(bank_id);

      -- CATEGORIES
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        parent_id INTEGER REFERENCES categories(id),
        level INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0
      );

      -- MERCHANTS
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

      CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(default_category_id);

      -- REWARD RULES
      CREATE TABLE IF NOT EXISTS reward_rules (
        id SERIAL PRIMARY KEY,
        card_id INTEGER NOT NULL REFERENCES cards(id),
        merchant_id INTEGER REFERENCES merchants(id),
        category_id INTEGER REFERENCES categories(id),
        reward_kind VARCHAR(20) NOT NULL,
        rate_unit VARCHAR(20) NOT NULL,
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

      CREATE INDEX IF NOT EXISTS idx_rule_card ON reward_rules(card_id);
      CREATE INDEX IF NOT EXISTS idx_rule_merchant ON reward_rules(merchant_id);
      CREATE INDEX IF NOT EXISTS idx_rule_category ON reward_rules(category_id);

      -- USERS
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- USER CARDS
      CREATE TABLE IF NOT EXISTS user_cards (
        user_id INTEGER REFERENCES users(id),
        card_id INTEGER REFERENCES cards(id),
        is_active BOOLEAN DEFAULT TRUE,
        PRIMARY KEY (user_id, card_id)
      );

      -- CALCULATIONS
      CREATE TABLE IF NOT EXISTS calculations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        input_json JSONB NOT NULL,
        result_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tables created');
    
    // Insert seed data
    await client.query(`
      -- Seed banks
      INSERT INTO banks (name) VALUES ('HSBC'), ('Standard Chartered')
      ON CONFLICT DO NOTHING;

      -- Seed categories
      INSERT INTO categories (name, sort_order) VALUES 
        ('Dining', 1), ('Supermarket', 2), ('Online', 3)
      ON CONFLICT DO NOTHING;

      -- Seed merchants
      INSERT INTO merchants (name, merchant_key, default_category_id) VALUES 
        ('壽司郎', 'sushiro', 1),
        ('百佳', 'parknshop', 2),
        ('麥當勞', 'mcdonalds', 1)
      ON CONFLICT (merchant_key) DO NOTHING;

      -- Get bank IDs
      -- Seed cards (depends on banks)
      INSERT INTO cards (bank_id, name, reward_program) VALUES 
        (1, 'HSBC Red', 'CASHBACK'),
        (2, 'SCB Asia Miles', 'MILEAGE')
      ON CONFLICT DO NOTHING;

      -- Seed reward rules (depends on cards and merchants)
      INSERT INTO reward_rules (card_id, merchant_id, category_id, reward_kind, rate_unit, rate_value, cap_value, priority, valid_from, valid_to) VALUES 
        (1, NULL, 1, 'CASHBACK', 'PERCENT', 0.04, NULL, 100, '2026-01-01', '2026-12-31'),
        (1, 1, NULL, 'CASHBACK', 'PERCENT', 0.06, 30, 10, '2026-01-01', '2026-12-31'),
        (2, 2, NULL, 'MILEAGE', 'PER_AMOUNT', 1, NULL, 10, '2026-01-01', '2026-12-31')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Seed data inserted');
    
    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('banks', 'cards', 'categories', 'merchants', 'reward_rules', 'users', 'user_cards', 'calculations')
      ORDER BY table_name
    `);
    console.log('\n📋 Tables created:');
    console.table(tables.rows);
    
    const counts = await client.query(`
      SELECT 'banks' as tbl, COUNT(*) as cnt FROM banks
      UNION ALL SELECT 'cards', COUNT(*) FROM cards
      UNION ALL SELECT 'categories', COUNT(*) FROM categories
      UNION ALL SELECT 'merchants', COUNT(*) FROM merchants
      UNION ALL SELECT 'reward_rules', COUNT(*) FROM reward_rules
    `);
    console.log('\n📋 Record counts:');
    console.table(counts.rows);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

applySchemaMigration();
