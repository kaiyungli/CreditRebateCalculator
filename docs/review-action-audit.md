# Review Action Safeguards & Audit Trail

## Overview

Review actions (approve/reject/merge) include safeguards and standardized audit logging.

---

## Preconditions

Actions only run when `raw_offers.status = 'review'`

| Action | Valid Start State |
|--------|------------------|
| approve | `review` |
| reject | `review` |
| merge | `review` |

If not in valid state → `Invalid starting state` error thrown.

---

## Approve Safeguards

Before approving, the system re-checks for duplicates:

### Duplicate Check Flow

```
approveReview called
       ↓
Check exists: exact fingerprint match?
       ↓ YES → status = 'skipped_duplicate', return result
       ↓ NO
Check exists: near duplicate (same merchant, different value)?
       ↓ YES → status = 'review', return result
       ↓ NO
Proceed with insert
```

### Duplicate Check Result

If duplicate found:
- Exact duplicate: `{ action: 'skipped_duplicate', duplicateId }`
- Near duplicate: `{ action: 'review_needed', nearDuplicateId }`

---

## Audit Payload (status_notes)

All review actions write standardized audit:

```json
{
  "action": "approve|reject|merge",
  "timestamp": "2026-04-21T05:30:00Z",
  "reason": "...",           // for reject
  "targetMerchantOfferId": 123,  // for merge
  "fingerprint": "...",
  "confidence": "LOW|MEDIUM|HIGH",
  "originalStatus": "review",
  "duplicateCheck": {
    "result": "skipped_duplicate|review_needed|approve",
    "duplicateId": 1,
    "title": "..."
  }
}
```

---

## Status Transitions

```
review → approved   (inserts to merchant_offers)
review → rejected  (keeps raw only)
review → merged     (links to target)

review → skipped_duplicate  (approve blocked by duplicate)
review → review           (approve blocked by near duplicate)
```

---

## Testing

| Test | Validates |
|------|----------|
| `approve blocked if not in review state` | Precondition |
| `reject blocked if not in review state` | Precondition |
| `approve allowed if in review state` | State check |
| `approve has action and timestamp` | Audit |
| `reject includes reason` | Audit |
| `merge includes targetMerchantOfferId` | Audit |
| `duplicate check included when present` | Duplicate detection |
| `all fields present for full audit` | Full audit |

---

## Files

- `src/domains/ingestion/actions.js` - Action handlers with safeguards
- `tests/calculator/actions-safeguards.test.mjs` - Safeguard tests

---

## Example Usage

```js
import { executeReviewAction, REVIEW_ACTION } from './actions'

// Approve (with duplicate check)
const result = await executeReviewAction(rawId, REVIEW_ACTION.APPROVE)
if (!result.success) {
  console.log(result.reason) // 'duplicate_now_exists' or 'near_duplicate_detected'
}

// Reject
await executeReviewAction(rawId, REVIEW_ACTION.REJECT, { reason: 'invalid_terms' })

// Merge
await executeReviewAction(rawId, REVIEW_ACTION.MERGE, { targetMerchantOfferId: 123 })
```
