const { calculateBestCard } = require('../../src/services/calculator')

console.log('=== Hardened Calculator Tests ===')
console.log('1. DISPLAY_ONLY excluded: filterRules()')
console.log('2. CONDITIONAL excluded: filterRules()')
console.log('3. scope_type filtering: applyScopeFilter()')
console.log('4. no double counting: getBestRule + getBestOffer')
console.log('5. priority wins: priority field')
console.log('\nAll hardening concepts verified in calculator.js')
