const { calculateBestCard } = require('./src/services/calculator')

async function test() {
  console.log('=== Test 1: with offer ===')
  const r1 = await calculateBestCard({ amount: 500, merchant_id: 2, category_id: 1 })
  console.log(JSON.stringify(r1, null, 2))
  
  console.log('\n=== Test 2: without offer ===')
  const r2 = await calculateBestCard({ amount: 300, category_id: 1 })
  console.log(JSON.stringify(r2, null, 2))
  
  console.log('\n=== Test 3: below min_spend ===')
  const r3 = await calculateBestCard({ amount: 100, merchant_id: 2, category_id: 1 })
  console.log(JSON.stringify(r3, null, 2))
}

test().catch(console.error)
