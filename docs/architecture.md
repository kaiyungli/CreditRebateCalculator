# Credit Rebate Calculator - Architecture

## Overview
Domain-based architecture for maintainability. Business logic isolated from API entry points.

---

## Domain Structure

### 1. Calculator Domain
**Responsibility:** Calculate best card for a transaction

**Location:** `src/domains/calculator/`

**Components:**
- `services/calculator.js` - Main orchestration
- `services/ruleEvaluator.js` - Rule evaluation logic
- `services/offerEvaluator.js` - Offer evaluation logic

**Public API:**
```js
import { calculateBestCard } from './domains/calculator/services/calculator'
// Input: { merchant_id, category_id, amount, card_ids? }
// Output: { results: [], best_card: {} }
```

---

### 2. Rewards Domain
**Responsibility:** Reward rules data access

**Location:** `src/domains/rewards/`

**Components:**
- `repositories/rulesRepository.js` - DB queries for reward_rules

---

### 3. Offers Domain
**Responsibility:** Merchant offers data access and service

**Location:** `src/domains/offers/`

**Components:**
- `repositories/offersRepository.js` - DB queries for merchant_offers
- `services/offersService.js` - Offer business logic

---

### 4. Ingestion Domain
**Responsibility:** Parse, normalize, validate, and publish offers

**Location:** `src/domains/ingestion/`

**Components:**
- `parsers/offerParser.js` - Parse raw offer text
- `normalizers/offerNormalizer.js` - Match to merchants/cards
- `validators/offerValidator.js` - Validate parsed data
- `publishers/offerPublisher.js` - Insert to DB

**Pipeline:**
```
Raw Text → Parser → Validator → Normalizer → Publisher → DB
```

---

### 5. Shared Layer
**Responsibility:** Shared types, utilities, constants

**Location:** `src/shared/`

**Components:**
- `types/` - TypeScript type definitions (planned)
- `utils/` - Utility functions (planned)
- `constants/` - Shared constants (planned)

---

## API Routes - Orchestration Only

### Principle
API routes are entry points only. They should:
1. Parse request
2. Call domain service
3. Return response

### Example - `/api/calculate`
```js
// BEFORE (with business logic):
// - chooseBestRule()
// - calculateReward()
// - estimateOfferValue()
// - filterOffersForCard()
// - sorting logic
// - ~200 lines

// AFTER (entry point only):
import { calculateBestCard } from '../domains/...'

export default async function handler(req, res) {
  const input = parseRequest(req.body)
  const result = await calculateBestCard(input)
  return res.json(formatResponse(result))
}
```

### Business Logic Remaining in `/api/calculate`
- Request parsing (`parseRequest`) - 15 lines
- Response formatting (`formatResponse`) - 10 lines
- Error handling - 10 lines

**Total: ~35 lines** (down from ~200 lines)

---

## Layer Rules

### UI Must NOT Contain Business Logic
- UI components call hooks
- Hooks call domain services
- Domain services contain business logic

### API Routes Are Orchestration
- Parse request → Call domain → Return response
- No calculation logic in routes

### Security
- All access controlled by backend (Supabase RLS)
- Never trust frontend input

---

## Data Flow

```
HTTP Request
    ↓
API Route (parse + validate)
    ↓
Domain Service (business logic)
    ↓
Repository (DB queries)
    ↓
Supabase (data)
    ↓
Response
```

---

## Decision Log

1. **Calculator Logic Moved:** Rule evaluation + offer evaluation moved from API to domain
2. **Repositories Created:** Separate DB access layer for rewards and offers
3. **Ingestion Pipeline:** Parser → Validator → Normalizer → Publisher

---

## Notes

- Product behavior unchanged
- Calculation rules identical
- Schema unchanged
- Build passes
