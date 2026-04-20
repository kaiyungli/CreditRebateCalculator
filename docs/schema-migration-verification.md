# Migration Verification

## Verification Summary

This document confirms the migration SQL matches code assumptions.

---

## 1. Field Name Verification

### merchant_offers Columns

| Code Uses | Migration Has | Match |
|-----------|---------------|-------|
| raw_offer_id | raw_offer_id INTEGER | ✅ YES |
| source_url | source_url TEXT | ✅ YES |
| source_name | source_name VARCHAR(50) | ✅ YES |
| parser_version | parser_version VARCHAR(20) | ✅ YES |
| parsed_at | parsed_at TIMESTAMP | ✅ YES |
| confidence | confidence VARCHAR(10) | ✅ YES |
| is_verified | is_verified BOOLEAN | ✅ YES |
| fingerprint | fingerprint VARCHAR(32) | ✅ YES |

### raw_offers Columns

| Code Uses | Migration Has | Match |
|-----------|---------------|-------|
| status | status VARCHAR(20) | ✅ YES |
| status_notes | status_notes JSONB | ✅ YES |
| processed_at | processed_at TIMESTAMP | ✅ YES |

---

## 2. Type Verification

### raw_offer_id Link

- **Code expects**: `raw_offer_id: rawOffer.id`
- **raw_offers.id**: SERIAL (auto-incrementing integer)
- **Migration uses**: INTEGER
- **Match**: ✅ YES (SERIAL creates integer)

### Fingerprint

- **Code generates**: 32-character string (pipe-delimited parts)
- **Migration field**: VARCHAR(32)
- **Match**: ✅ YES (holds 32-char string)

### Confidence Values

- **Code sets**: 'LOW' (default)
- **Migration default**: 'LOW'
- **Match**: ✅ YES

---

## 3. Foreign Key Verification

- **raw_offer_id FK**: References raw_offers(id)
- **Migration includes**: ADD CONSTRAINT fk_merchant_offers_raw_offer FOREIGN KEY (raw_offer_id) REFERENCES raw_offers(id)
- **Match**: ✅ YES

---

## 4. Status Lifecycle Verification

### Code Expected Values (raw_offers.status)

| State | Used By | Migration Default |
|-------|---------|-------------------|
| new | publisher | 'new' |
| published | publisher | - (handled by update) |
| skipped | publisher | - (handled by update) |
| review | publisher | - (handled by update) |
| invalid | publisher | - (handled by update) |

**Migration default**: 'new'
**Match**: ✅ YES

---

## 5. Mismatch Risk Summary

No mismatches found.

- Field names: ✅ EXACT MATCH
- Field types: ✅ EXACT MATCH  
- Defaults: ✅ EXACT MATCH
- Foreign keys: ✅ EXACT MATCH
- Status values: ✅ EXACT MATCH

---

## Safe Run Checklist

### Before Running Migrations

- [ ] Backup database
- [ ] Run migrations in order: 001 then 002
- [ ] Verify columns exist: `\d merchant_offers`
- [ ] Verify table exists: `\d raw_offers`

### Running Migration 001 (Required)

```bash
psql -f migrations/001_required_pipeline_fields.sql
```

Expected output: 
- 8 ALTER TABLE statements
- 1 CREATE TABLE statement
- 1 ALTER TABLE ADD CONSTRAINT
- 1 DO block verification

### After Running

- [ ] Verify columns: `SELECT column_name FROM information_schema.columns WHERE table_name = 'merchant_offers';`
- [ ] Verify table: `SELECT * FROM raw_offers LIMIT 1;` (should show empty or existing)
- [ ] Test publish pipeline with a test offer

### Running Migration 002 (Optional)

```bash
psql -f migrations/002_optional_indexes_performance.sql
```

- [ ] Indexes created
- [ ] No data changes

---

## Current Risk Assessment

| Area | Risk Level |
|------|------------|
| Field mismatch | LOW ✅ |
| Type mismatch | LOW ✅ |
| FK broken | LOW ✅ |
| Backfill issues | LOW ✅ |

**Overall Risk**: LOW - Ready to run

---

## Schema Migration Complete

Migration package is verified and ready for execution.
