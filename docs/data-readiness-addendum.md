# Data Readiness Addendum - Offer Ingestion Foundation

*See docs/offer-ingestion-foundation.md for detailed proposal*

## Quick Summary

### Fingerprint Formula
- Hash of: merchant_id + bank_id + card_id + category_id + offer_type + value_type + value + min_spend + stackable + threshold_type + conditions
- 32-char MD5 hash

### Priority Plan
**Phase 1 (Build First):** Fingerprint field + calculation
**Phase 2:** Source tracking via raw_offer_id link
**Phase 3:** Review/confidence flags (later)

### Migration Backlog
1. Add fingerprint column
2. Add source tracking columns  
3. Add unique index on fingerprint
4. Add confidence/review columns

*See offer-ingestion-foundation.md for complete specification*
