# DB Fix - raw_offers Insert Permission

## Root Cause

The error `permission denied for sequence raw_offers_id_seq` indicates the service role 
lacks permission to use the auto-increment sequence for the raw_offers table.

## Fix Options

### Option 1: Grant Sequence Permission (SQL Editor)

Run in Supabase SQL Editor:

```sql
GRANT USAGE ON SEQUENCE raw_offers_id_seq TO service_role;
GRANT INSERT ON raw_offers TO service_role;
```

### Option 2: Disable RLS Temporarily (if needed)

```sql
ALTER TABLE raw_offers DISABLE ROW SECURITY;
```

### Option 3: Create a Trigger Instead (alternative)

Use a trigger to auto-set id:

```sql
-- Or use a different insert method
```

## Verification

After applying fix:

```sql
SELECT * FROM raw_offers WHERE status = 'new' ORDER BY id DESC LIMIT 10;
```

## Run Crawler After Fix

```bash
cd /home/node/.openclaw/workspace/credit-rebate-calculator
node scripts/crawl-offers.js
```
