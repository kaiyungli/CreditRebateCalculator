// API: Calculate best rebate combo for multiple items
// Features: beam search, merchant override, caps, miles/points valuation
import { getActiveCards, getActiveRulesAndMerchants } from '../../../lib/db'

const BEAM_WIDTH = 80

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return res.status(400).json({ ok: false, error: 'items is required' })
    }

    // miles/points 轉 HKD 比較（可由前端覆寫）
    const valuation = {
      MILES: Number(body.valuation?.MILES ?? 0.05),
      POINTS: Number(body.valuation?.POINTS ?? 0.01),
    }

    const [cards, { merchantKeyToId, rules }] = await Promise.all([
      getActiveCards(),
      getActiveRulesAndMerchants(),
    ])

    // rules by card for faster lookup
    const rulesByCard = new Map()
    for (const r of rules) {
      if (!rulesByCard.has(r.card_id)) rulesByCard.set(r.card_id, [])
      rulesByCard.get(r.card_id).push(r)
    }

    // normalize items: merchant_key -> merchant_id
    const normalizedItems = items.map((it, idx) => {
      const amount = Number(it.amount ?? 0)
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`item[${idx}].amount invalid`)
      }
      const merchant_id = it.merchant_id ?? (it.merchant_key ? merchantKeyToId[it.merchant_key] : null)
      const category_id = it.category_id ?? null
      return {
        idx,
        amount,
        merchant_id: merchant_id ?? null,
        category_id,
        merchant_key: it.merchant_key ?? null,
        note: it.note ?? null,
      }
    })

    // Beam search state
    let states = [{
      totalHKD: 0,
      totalBreakdown: { cashback: 0, miles: 0, points: 0 },
      capUsed: {},
      plan: [],
    }]

    for (const item of normalizedItems) {
      const next = []
      for (const st of states) {
        for (const card of cards) {
          const rule = pickBestRule(rulesByCard.get(card.id), item)
          if (!rule) continue

          // min spend (per txn) - Phase 1
          if (rule.min_spend != null && item.amount < Number(rule.min_spend)) {
            continue
          }

          const rawReward = calcReward(item.amount, rule)
          const { appliedReward, capNote, capUsedNext } = applyCap(rawReward, rule, st.capUsed)
          const hkd = rewardToHKD(appliedReward, rule, valuation)
          const breakdown = { ...st.totalBreakdown }

          if (rule.reward_kind === 'CASHBACK') breakdown.cashback += appliedReward
          if (rule.reward_kind === 'MILES') breakdown.miles += appliedReward
          if (rule.reward_kind === 'POINTS') breakdown.points += appliedReward

          next.push({
            totalHKD: st.totalHKD + hkd,
            totalBreakdown: breakdown,
            capUsed: capUsedNext,
            plan: st.plan.concat([{
              item,
              card: {
                id: card.id,
                name: card.name,
                reward_program: card.reward_program,
              },
              rule: {
                id: rule.id,
                reward_kind: rule.reward_kind,
                rate_unit: rule.rate_unit,
                rate_value: Number(rule.rate_value),
                per_amount: rule.per_amount == null ? null : Number(rule.per_amount),
                cap_value: rule.cap_value == null ? null : Number(rule.cap_value),
                cap_period: rule.cap_period ?? 'MONTHLY',
                priority: rule.priority ?? 100,
              },
              reward: appliedReward,
              rewardHKD: hkd,
              note: capNote,
            }]),
          })
        }
      }

      // keep best N
      next.sort((a, b) => b.totalHKD - a.totalHKD)
      states = dedupeAndTrim(next, BEAM_WIDTH)

      if (states.length === 0) break
    }

    const best = states[0]

    return res.status(200).json({
      ok: true,
      totalHKD: round2(best.totalHKD),
      breakdown: {
        cashback: round2(best.totalBreakdown.cashback),
        miles: Math.floor(best.totalBreakdown.miles),
        points: Math.floor(best.totalBreakdown.points),
      },
      plan: best.plan,
      assumptions: {
        capTracking: 'not-tracked', // 無登入：唔知道本月已用 cap
        valuation,
      },
    })

  } catch (e) {
    console.error('calculate error:', e)
    return res.status(500).json({ ok: false, error: e.message })
  }
}

/**
 * Rule priority:
 * 1) merchant match
 * 2) category match
 * pick lowest priority number
 */
function pickBestRule(rules, item) {
  if (!rules || rules.length === 0) return null

  const merchantMatches = item.merchant_id
    ? rules.filter(r => r.merchant_id === item.merchant_id)
    : []

  if (merchantMatches.length > 0) {
    merchantMatches.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    return merchantMatches[0]
  }

  const categoryMatches = item.category_id
    ? rules.filter(r => r.category_id === item.category_id && r.merchant_id == null)
    : []

  if (categoryMatches.length > 0) {
    categoryMatches.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    return categoryMatches[0]
  }

  return null
}

function calcReward(amount, rule) {
  const unit = String(rule.rate_unit || '').toUpperCase()

  if (unit === 'PERCENT') {
    return amount * Number(rule.rate_value)
  }

  if (unit === 'PER_AMOUNT') {
    const per = Number(rule.per_amount)
    if (!Number.isFinite(per) || per <= 0) return 0
    const units = Math.floor(amount / per)
    return units * Number(rule.rate_value) // 通常 rate_value=1
  }

  return 0
}

/**
 * Phase 1 cap: cap_value is cap on reward value (cash/miles/points)
 * We share cap within the SAME rule id (good enough for MVP).
 */
function applyCap(rawReward, rule, capUsed) {
  const cap = rule.cap_value == null ? null : Number(rule.cap_value)

  if (!cap || cap <= 0) {
    return { appliedReward: rawReward, capNote: null, capUsedNext: capUsed }
  }

  const key = `rule:${rule.id}` // MVP: rule-level cap sharing
  const used = Number(capUsed[key] ?? 0)
  const remaining = Math.max(0, cap - used)
  const applied = Math.max(0, Math.min(rawReward, remaining))
  const next = { ...capUsed, [key]: used + applied }

  const note = rawReward > applied
    ? `cap applied: ${round2(applied)} (remaining ${round2(remaining)})`
    : `cap remaining ${round2(remaining - applied)}`

  return { appliedReward: applied, capNote: note, capUsedNext: next }
}

function rewardToHKD(reward, rule, valuation) {
  const kind = String(rule.reward_kind || '').toUpperCase()

  if (kind === 'CASHBACK') return reward
  if (kind === 'MILES') return reward * valuation.MILES
  if (kind === 'POINTS') return reward * valuation.POINTS

  return 0
}

function dedupeAndTrim(states, maxN) {
  // 去重：同一個分配 pattern + capUsed key (粗略) -> 取最高
  const map = new Map()

  for (const st of states) {
    const sig = signature(st)
    const prev = map.get(sig)
    if (!prev || st.totalHKD > prev.totalHKD) map.set(sig, st)
    if (map.size > maxN * 5) break
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalHKD - a.totalHKD)
    .slice(0, maxN)
}

function signature(st) {
  const cards = st.plan.map(p => p.card.id).join(',')
  const capKeys = Object.keys(st.capUsed).sort().map(k => `${k}:${Math.floor(st.capUsed[k] * 1000)}`).join('|')
  return `${cards}__${capKeys}`
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}
