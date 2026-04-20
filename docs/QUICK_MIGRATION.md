# Quick Migration Run - COPY INTO SUPABASE SQL EDITOR

## Execute This SQL Now

Copy below into Supabase SQL Editor and click "Run":

```sql
-- --- MIGRATION RUN --- 

-- Step 1: Add columns to merchant_offers
ALTER TABLE merchant_offers ADD COLUMN fingerprint VARCHAR(32);
ALTER TABLE merchant_offers ADD COLUMN raw_offer_id INTEGER;
ALTER TABLE merchant_offers ADD COLUMN source_url TEXT;
ALTER TABLE merchant_offers ADD COLUMN source_name VARCHAR(50);
ALTER TABLE merchant_offers ADD COLUMN parser_version VARCHAR(20);
ALTER TABLE merchant_offers ADD COLUMN parsed_at TIMESTAMP;
ALTER TABLE merchant_offers ADD COLUMN confidence VARCHAR(10) DEFAULT 'LOW';
ALTER TABLE merchant_offers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- Step 2: Create raw_offers table
CREATE TABLE IF NOT EXISTS raw_offers (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    reward_type VARCHAR(20),
    reward_value TEXT,
    raw_text TEXT,
    source_url TEXT,
    source_name VARCHAR(50),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'new',
    status_notes JSONB,
    processed_at TIMESTAMP
);

-- Step 3: Add FK constraint
ALTER TABLE merchant_offers 
ADD CONSTRAINT fk_merchant_offers_raw_offer 
FOREIGN KEY (raw_offer_id) 
REFERENCES raw_offers(id) 
ON DELETE SET NULL;

SELECT 'Migration Complete' as result;
```

## Verification After Run

In SQL Editor, run:

```sql
-- Verify merchant_offers columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'merchant_offers' 
AND column_name IN ('fingerprint','raw_offer_id','source_url','source_name','parser_version','parsed_at','confidence','is_verified');

-- Verify raw_offers table  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'raw_offers' 
AND column_name IN ('status','status_notes','processed_at');
```

## Expected Output

First query: 8 rows (merchant_offers columns)
Second query: 3 rows (raw_offers columns)

---
