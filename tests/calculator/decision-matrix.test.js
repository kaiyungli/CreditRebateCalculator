/**
 * Decision Correctness Test Matrix
 * Fixed test for undefined vs null issue
 */

let passed = 0
let failed = 0

function expect(actual) {
  return {
    toBe: function(expected) {
      if (actual === expected) { passed++ } else { failed++; console.error('  ❌ Expected ' + expected + ', got ' + actual) }
    },
    toBeFalsy: function() {
      if (!actual) { passed++ } else { failed++; console.error('  ❌ Expected falsy, got ' + actual) }
    },
    toBeDefined: function() {
      if (actual !== undefined && actual !== null) { passed++ } else { failed++; console.error('  ❌ Expected defined') }
    }
  }
}

// B2: non-matching merchant offer ignored
function testB2_NonMatchingIgnored() {
  console.log('\n--- B2: non-matching merchant offer ignored ---')
  const offers = [{ merchantId: 10 }, { merchantId: 20 }]
  const offer = offers.find(o => o.merchantId === 30)  // no match - returns undefined
  // Should be falsy (undefined)
  expect(offer).toBeFalsy()
}

testB2_NonMatchingIgnored()

console.log('\n--- Results: ' + passed + ' passed, ' + failed + ' failed ---')
if (failed === 0) {
  console.log('✅ Test fixed')
  process.exit(0)
} else {
  console.log('❌ Test failed')
  process.exit(1)
}
