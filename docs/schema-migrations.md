# Schema Migrations

## Migration Pack Summary

### Required Now (001_required_pipeline_fields.sql)

These fields are required for the ingestion publish pipeline to function correctly.

| # | Table | Field | Type | Default | Required |
|---|-------|-------|------|----------|-----------|
| 1 | merchant_offers | fingerprint | VARCHAR(32) | NULL | ✅ Yes |
| 2 | merchant_offers | raw_offer_id | INTEGER | NULL | ✅ Yes |
| 3 | merchant_offers | source_url | TEXT | NULL | ✅ Yes |
| 4 | merchant_offers | source_name | VARCHAR(50) | NULL | ✅ Yes |
| 5 | merchant_offers | parser_version | VARCHAR(20) | NULL | ✅ Yes |
| 6 | merchant_offers | parsed_at | TIMESTAMP | NULL | ✅ Yes |
| 7 | merchant_offers | confidence | VARCHAR(10) | 'LOW' | ✅ Yes |
| 8 | merchant_offers | is_verified | BOOLEAN | FALSE | ✅ Yes |
| 9 | raw_offers | (table) | - | - | ✅ Yes |
| 10 | raw_offers | status | VARCHAR(20) | 'new' | ✅ Yes |
| 11 | raw_offers | status_notes | JSONB | NULL | ✅ Yes |
| 12 | raw_offers | processed_at | TIMESTAMP | NULL | ✅ Yes |

### Optional Later (002_optional_indexes_performance.sql)

These are performance optimizations that can be added after initial rollout.

| # | Index | Table | Purpose |
|---|-------|-------|---------|
| 1 | UNIQUE idx_merchant_offers_fingerprint | Dedupe uniqueness |
| 2 | idx_merchant_offers_source | Source queries |
| 3 | idx_merchant_offers_lookup | Offer lookup |
| 4 | idx_merchant_offers_review | Review queue |
| 5 | idx_raw_offers_pending | Processing queue |

### Run Order

1. **First**: 001_required_pipeline_fields.sql
   - Creates required columns
   - Creates raw_offers table (if not exists)
   - Adds status tracking
   - Verifies migration success

2. **Later** (optional): 002_optional_indexes_performance.sql
   - Adds performance indexes
   - Optional - can skip

### Backfill Handling

- **Existing rows**: NULLs are acceptable - no backfill required
- **Future**: New offers will have values populated during pipeline run
- **Default values**: 
  - confidence = 'LOW'
  - is_verified = FALSE
  - status = 'new'

### Quick Test

```bash
# Check columns exist after migration
psql -c "\d merchant_offers" | grep -E "fingerprint|raw_offer_id|source_name|confidence"
psql -c "\d raw_offers" | grep -E "status|status_notes|processed_at"
```

---
