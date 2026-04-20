# Credit Rebate Calculator - Architecture

## Domain Structure

### 1. Cards Domain
**Responsibility:** Card data access and management
**Location:** `src/domains/cards/`
- `repositories/cardsRepository.js` - Read cards from DB

---

### 2. Rewards Domain
**Responsibility:** Reward rules and evaluation
**Location:** `src/domains/rewards/`
- `repositories/rulesRepository.js` - Read reward_rules
- `evaluators/ruleEvaluator.js` - Pure reward calculation

**Owned By Rewards:**
- `chooseBestRule()` - Priority: MERCHANT > CATEGORY > GENERAL
- `calculateReward()` - PERCENT, FIXED, PER_AMOUNT, cap handling
- `meetsMinSpend()` - Min spend validation

---

### 3. Offers Domain
**Responsibility:** Merchant offers and evaluation
**Location:** `src/domains/offers/`
- `repositories/offersRepository.js` - Read merchant_offers
- `services/offersService.js` - Offer business logic
- `evaluators/offerEvaluator.js` - Pure offer value calculation

**Owned By Offers:**
- `estimateOfferValue()` - FIXED/PERCENT, min_spend, max_discount
- `filterOffersForCard()` - Match offers to card/bank
- `calculateTotalOfferValue()` - Sum offer values

---

### 4. Calculator Domain
**Responsibility:** Orchestration only - cross-domain decision flow
**Location:** `src/domains/calculator/`
- `services/calculator.js` - Orchestration (NOT calculation logic)
- `formatters/resultFormatter.js` - Output formatting

**Calculator MUST:**
- Load cards → Cards Domain
- Load rules → Rewards Domain  
- Load offers → Offers Domain
- Call evaluators → Respective domains
- Aggregate results
- Call formatter

**Calculator MUST NOT:**
- Contain calculation logic (belongs to rewards/offers)
- Duplicate repository calls

---

### 5. Ingestion Domain
**Responsibility:** Parse, normalize, validate, publish offers
**Location:** `src/domains/ingestion/`

---

### 6. Shared Layer
**Responsibility:** Types, utilities, constants
**Location:** `src/shared/`

---

## Data Flow

```
HTTP Request
    ↓
API Route (entry point)
    ↓
Calculator (orchestration only)
    ↓
┌─────────────────────────────────────────┐
│  Cards Domain     → get cards           │
│  Rewards Domain   → get rules           │
│  Offers Domain    → get offers          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Rewards Evaluator  → calculate reward  │
│  Offers Evaluator   → calculate offer  │
└─────────────────────────────────────────┘
    ↓
Result Formatter
    ↓
Response
```

---

## API Routes - Orchestration Only

API routes handle:
1. Method check
2. Input validation
3. Call calculator service
4. Return JSON
5. Error handling

All business logic is in domain layers.

---

## Layer Rules

- **UI → Hooks → Services → Repositories → DB**
- **API = Entry Point → Domain Orchestration → Response**
- Evaluators belong to their respective domains
- Calculator orchestrates, does not calculate
