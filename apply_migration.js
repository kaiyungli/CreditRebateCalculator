const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ.Lsy0hszyCsB6ZrtREanBQcOioBV6e5JtZG9R4y8m6R4@db.qcvileuzjzoltwttrjli.supabase.co:6543/postgres',
});

async function applyMigration() {
  const migrationSQL = `
-- Add new columns to merchant_rates table
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'scraped';
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);
ALTER TABLE merchant_rates ADD COLUMN IF NOT EXISTS verification_votes INT DEFAULT 0;

-- Add index for source column
CREATE INDEX IF NOT EXISTS idx_merchant_rates_source ON merchant_rates(source);

-- Add index for verification status
CREATE INDEX IF NOT EXISTS idx_merchant_rates_verified ON merchant_rates(is_verified);

-- Create user_offer_submissions table
CREATE TABLE IF NOT EXISTS user_offer_submissions (
    id SERIAL PRIMARY KEY,
    merchant_rate_id INTEGER REFERENCES merchant_rates(id),
    user_id INTEGER REFERENCES users(id),
    suggested_rate DECIMAL(5,3) NOT NULL,
    suggested_rebate_type VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offer_submissions_rate ON user_offer_submissions(merchant_rate_id);
CREATE INDEX IF NOT EXISTS idx_offer_submissions_user ON user_offer_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_submissions_status ON user_offer_submissions(status);

-- Create offer_votes table
CREATE TABLE IF NOT EXISTS offer_votes (
    id SERIAL PRIMARY KEY,
    merchant_rate_id INTEGER REFERENCES merchant_rates(id),
    user_id INTEGER REFERENCES users(id),
    vote_value INTEGER DEFAULT 1,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(merchant_rate_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_offer_votes_rate ON offer_votes(merchant_rate_id);
CREATE INDEX IF NOT EXISTS idx_offer_votes_user ON offer_votes(user_id);

-- Function: Update verification_votes count
CREATE OR REPLACE FUNCTION update_verification_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE merchant_rates
    SET verification_votes = (
        SELECT COALESCE(SUM(vote_value), 0)
        FROM offer_votes
        WHERE merchant_rate_id = NEW.merchant_rate_id
    )
    WHERE id = NEW.merchant_rate_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update verification_votes
DROP TRIGGER IF EXISTS trigger_update_votes ON offer_votes;
CREATE TRIGGER trigger_update_votes
AFTER INSERT OR UPDATE OR DELETE ON offer_votes
FOR EACH ROW EXECUTE FUNCTION update_verification_votes();
`;

  try {
    console.log('Connecting to Supabase database...');
    const client = await pool.connect();
    console.log('Connected successfully!');
    
    // Execute the migration
    await client.query(migrationSQL);
    console.log('\n✅ Migration applied successfully!');
    
    // Verify: check if columns were added
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'merchant_rates' 
      AND column_name IN ('source', 'start_date', 'end_date', 'is_verified', 'submitted_by', 'verification_votes')
      ORDER BY column_name
    `);
    console.log('\n📋 New columns in merchant_rates:');
    console.table(result.rows);
    
    // Verify new tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_offer_submissions', 'offer_votes')
    `);
    console.log('\n📋 New tables created:');
    console.table(tables.rows);
    
    // Check trigger
    const trigger = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_update_votes'
    `);
    console.log('\n📋 Trigger created:');
    console.table(trigger.rows);
    
    client.release();
    await pool.end();
    console.log('\n✨ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

applyMigration();
