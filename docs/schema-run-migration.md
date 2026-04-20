# Migration Execution Guide

## Running the Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard
2. Select your project: `qcvileuzjzoltwttrjli`
3. Navigate to: SQL Editor
4. Copy and paste contents of `migrations/001_required_pipeline_fields.sql`
5. Click "Run"

### Option 2: Supabase CLI

```bash
supabase db push
```

Note: This will apply all pending migrations in the migrations/ folder.

### Option 3: psql (Local Development)

```bash
psql -h your-host -U postgres -d postgres -f migrations/001_required_pipeline_fields.sql
```

---

## Migration 001 Steps

1. **Add columns to merchant_offers**
   - fingerprint
   - raw_offer_id
   - source_url
   - source_name
   - parser_version
   - parsed_at
   - confidence
   - is_verified

2. **Create raw_offers table** (if not exists)

3. **Add status tracking** to raw_offers

4. **Add foreign key** constraint

---

## After Running Migration 001

### Verify Columns Exist

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'merchant_offers' 
AND column_name IN ('fingerprint', 'raw_offer_id', 'source_url', 'confidence');
```

Expected: 7 rows with data types

### Verify raw_offers Table

```sql
SELECT * FROM raw_offers LIMIT 1;
```

Expected: Empty or existing rows

---

## Running Optional Migration 002

After verifying 001 is working:

```sql
-- In SQL Editor or psql
\i migrations/002_optional_indexes_performance.sql
```

This creates performance indexes.

---

## Smoke Test After Migration

Once migration runs, test publish flow:

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"merchant_id": 1, "category_id": 2, "amount": 1000}'
```

Expected: Valid response with state tracked in DB.

---

## Rollback (If Needed)

```sql
-- Only if absolutely needed and database allows

-- Drop columns (caution: destructive)
ALTER TABLE merchant_offers DROP COLUMN fingerprint;
ALTER TABLE merchant_offers DROP COLUMN raw_offer_id;
-- etc.

DROP TABLE raw_offers;
```

Caution: This will destroy data. Only use in development.
