# Schema Current Snapshot

## Overview

This document provides an up-to-date snapshot of the database schema as currently understood by the codebase. Last updated: 2024-04-20

---

## Tables

### banks
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| name | VARCHAR(100) | ✅ Yes | Display |
| name_en | VARCHAR(100) | ❌ No | |
| status | VARCHAR(20) | ✅ Yes | Active filter |
| created_at | TIMESTAMP | ❌ No | |
| updated_at | TIMESTAMP | ❌ No | |

### cards
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| bank_id | INTEGER | ✅ Yes | FK → banks |
| name | VARCHAR(255) | ✅ Yes | Display |
| name_en | VARCHAR(255) | ❌ No | |
| reward_program | VARCHAR(20) | ✅ Yes | CASHBACK/MILES/POINTS |
| annual_fee | INTEGER | ✅ Yes | Display |
| image_url | TEXT | ✅ Yes | Display |
| apply_url | TEXT | ✅ Yes | Display |
| status | VARCHAR(20) | ✅ Yes | Active filter |
| created_at | TIMESTAMP | ❌ No | |
| updated_at | TIMESTAMP | ❌ No | |

### categories
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| name | VARCHAR(100) | ✅ Yes | Display |
| name_en | VARCHAR(100) | ❌ No | |
| parent_id | INTEGER | ❌ No | Not used yet |
| level | INTEGER | ❌ No | |
| sort_order | INTEGER | ❌ No | |

### merchants
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| name | VARCHAR(255) | ✅ Yes | Display |
| name_en | VARCHAR(255) | ❌ No | |
| merchant_key | VARCHAR(120) | ✅ Yes | Unique |
| default_category_id | INTEGER | ✅ Yes | FK → categories |
| aliases | TEXT[] | ❌ No | Not used yet |
| status | VARCHAR(20) | ✅ Yes | Active filter |
| created_at | TIMESTAMP | ❌ No | |
| updated_at | TIMESTAMP | ❌ No | |

### reward_rules
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| card_id | INTEGER | ✅ Yes | FK → cards |
| merchant_id | INTEGER | ✅ Yes | FK → merchants |
| category_id | INTEGER | ✅ Yes | FK → categories |
| reward_kind | VARCHAR(20) | ✅ Yes | CASHBACK/MILES/POINTS |
| rate_unit | VARCHAR(20) | ✅ Yes | PERCENT/PER_AMOUNT |
| rate_value | NUMERIC(12,6) | ✅ Yes | The value |
| per_amount | NUMERIC(12,2) | ✅ Yes | For PER_AMOUNT |
| cap_value | NUMERIC(12,2) | ✅ Yes | Monthly cap |
| cap_period | VARCHAR(20) | ✅ Yes | Monthly (default) |
| min_spend | NUMERIC(12,2) | ✅ Yes | Min spend |
| valid_from | DATE | ✅ Yes | Date validity |
| valid_to | DATE | ✅ Yes | Date validity |
| priority | INTEGER | ✅ Yes | Tie-breaker |
| status | VARCHAR(20) | ✅ Yes | ACTIVE |
| created_at | TIMESTAMP | ❌ No | |
| updated_at | TIMESTAMP | ❌ No | |

### merchant_offers
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| merchant_id | INTEGER | ✅ Yes | FK → merchants |
| bank_id | INTEGER | ✅ Yes | |
| card_id | INTEGER | ✅ Yes | |
| category_id | INTEGER | ✅ Yes | |
| title | TEXT | ✅ Yes | Display |
| description | TEXT | ⚠️ Partial | Saved |
| offer_type | VARCHAR(50) | ✅ Yes | |
| value_type | VARCHAR(20) | ✅ Yes | FIXED/PERCENT |
| value | NUMERIC(12,6) | ✅ Yes | |
| min_spend | NUMERIC(12,2) | ✅ Yes | |
| max_reward | NUMERIC(12,2) | ✅ Yes | |
| start_date | DATE | ✅ Yes | |
| end_date | DATE | ✅ Yes | |
| is_active | BOOLEAN | ✅ Yes | |
| status | VARCHAR(20) | ✅ Yes | |
| **fingerprint** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **raw_offer_id** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **source_url** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **source_name** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **parser_version** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **parsed_at** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **confidence** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **is_verified** | ❌ **Not in schema** | ✅ Code expects | **NEEDS MIGRATION** |
| stackable | BOOLEAN | ✅ Yes | |
| threshold_type | VARCHAR(20) | ✅ Yes | |

### raw_offers (Support Table - Not in main schema file)
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK (expectation) |
| title | TEXT | ✅ Yes | Raw title |
| reward_type | VARCHAR(20) | ✅ Yes | |
| reward_value | TEXT | ✅ Yes | |
| raw_text | TEXT | ⚠️ Partial | |
| source_url | TEXT | ✅ Yes | |
| source_name | TEXT | ✅ Yes | |
| scraped_at | TIMESTAMP | ❌ No | |
| **status** | ❌ **Not in formal schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **status_notes** | ❌ **Not in formal schema** | ✅ Code expects | **NEEDS MIGRATION** |
| **processed_at** | ❌ **Not in formal schema** | ✅ Code expects | **NEEDS MIGRATION** |

### calculations
| Field | Type | Used By Code | Notes |
|-------|------|--------------|-------|
| id | SERIAL | ✅ Yes | PK |
| user_id | INTEGER | ✅ Yes | FK → users |
| input_json | JSONB | ✅ Yes | |
| result_json | JSONB | ✅ Yes | |
| created_at | TIMESTAMP | ✅ Yes | |

---

## Migration Consistency Checklist

### Required Before Production (Needs Migration)

| # | Table | Field | Type | Code Expects |
|---|-------|-------|------|--------------|
| 1 | merchant_offers | fingerprint | VARCHAR(32) | ✅ Yes - dedupe key |
| 2 | merchant_offers | raw_offer_id | INTEGER | ✅ Yes - source link |
| 3 | merchant_offers | source_url | TEXT | ✅ Yes - source trace |
| 4 | merchant_offers | source_name | VARCHAR(50) | ✅ Yes - source trace |
| 5 | merchant_offers | parser_version | VARCHAR(20) | ✅ Yes - version track |
| 6 | merchant_offers | parsed_at | TIMESTAMP | ✅ Yes - timestamp |
| 7 | merchant_offers | confidence | VARCHAR(10) | ✅ Yes - review flag |
| 8 | merchant_offers | is_verified | BOOLEAN | ✅ Yes - review flag |
| 9 | raw_offers | status | VARCHAR(20) | ✅ Yes - state track |
| 10 | raw_offers | status_notes | JSONB | ✅ Yes - detail track |
| 11 | raw_offers | processed_at | TIMESTAMP | ✅ Yes - timestamp |
| 12 | merchant_offers | UNIQUE INDEX | fingerprint | ✅ Yes - dedupe |

### Already in Schema

| # | Table | Field | Status |
|---|-------|-------|--------|
| 1 | banks | All | ✅ In schema |
| 2 | cards | All | ✅ In schema |
| 3 | categories | All | ✅ In schema |
| 4 | merchants | All | ✅ In schema |
| 5 | reward_rules | All core fields | ✅ In schema |
| 6 | calculations | All | ✅ In schema |

### Optional (Nice to Have)

- Indexes on merchant_offers(merchant_id), merchant_offers(bank_id)
- Add aliases to merchants table
- Add parent_id usage for category hierarchy

---

## Code/Schema Mismatch Summary

### Merchant_Offers Fields Missing from Schema

- fingerprint ❌ Not in schema
- raw_offer_id ❌ Not in schema
- source_url ❌ Not in schema  
- source_name ❌ Not in schema
- parser_version ❌ Not in schema
- parsed_at ❌ Not in schema
- confidence ❌ Not in schema
- is_verified ❌ Not in schema

### Raw_Offers Fields Missing from Schema

- status ❌ Not in schema
- status_notes ❌ Not in schema  
- processed_at ❌ Not in schema

---

## Summary

- **Total tables**: 8 (active 6 + support 2)
- **Fields in schema**: ~100
- **Fields used by code**: ~80
- **Missing from schema (needed)**: 12 fields across 2 tables
- **Migration needed**: YES (12 fields)

Current engine is functioning fully but ingestion pipeline expects fields that don't exist in current schema. A migration must run before production scaling.

---

## Migration Status

### Required Migration File

- **migrations/001_required_pipeline_fields.sql**
  - Adds 12 required fields to merchant_offers
  - Creates raw_offers table with status tracking
  - Adds status columns to raw_offers
  - Ready to run now

### Optional Migration File

- **migrations/002_optional_indexes_performance.sql**
  - Performance indexes for queries
  - Can run after production scales

---

---

## Migration Status

### Verified

- Migration 001: **Ready to run**
- Migration 002: Optional, ready later
- Code assumptions: **Verified match**

See docs/schema-migration-verification.md for full verification details.
