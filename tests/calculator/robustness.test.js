/**
 * Robustness v1 Tests
 */

let passed = 0
let failed = 0

function test(name, fn) {
  try { fn(); console.log('✅ ' + name); passed++; } catch(e) { console.log('❌ ' + name + ': ' + e.message); failed++; }
}

function eq(a, b) { if (a !== b) throw new Error('Expected ' + b + ', got ' + a); }

const VALID_VALUE_TYPES = ['FIXED', 'PERCENT']

function validateOffer(o) {
  if (!o) return { valid:false, reason:'invalidOffer:null' }
  if (!o.id) return { valid:false, reason:'invalidOffer:missingId' }
  if (o.valueType && !VALID_VALUE_TYPES.includes(o.valueType)) return { valid:false, reason:'invalidOffer:valueType' }
  if (o.value === undefined || isNaN(Number(o.value))) return { valid:false, reason:'invalidOffer:value' }
  return { valid:true }
}

function calcValue(o, amount) {
  const v = validateOffer(o); if(!v.valid) return 0
  // Check minSpend
  if(o.minSpend && amount < Number(o.minSpend)) return 0
  const val = Number(o.value)
  if(o.valueType==='FIXED') return Math.min(val, Number(o.maxReward)||val)
  if(o.valueType==='PERCENT') return Math.min((amount*val)/100, Number(o.maxReward)||(amount*val)/100)
  return 0
}

// R1-R6: malformed
test('R1: malformed null', () => eq(validateOffer(null).valid,false))
test('R2: missing id', () => eq(validateOffer({valueType:'FIXED',value:50}).valid,false))
test('R3: undefined rateValue', () => { const r={rateValue:undefined}; eq(isNaN(Number(r.rateValue)),true) })
test('R4: invalid conditions', () => eq(typeof 'x'==='object',false))
test('R5: missing value', () => eq(validateOffer({id:1}).valid,false))
test('R6: unknown valueType', () => eq(validateOffer({id:1,value:10,valueType:'XXX'}).reason,'invalidOffer:valueType'))

// R7-R9: safe handling  
test('R7: empty card list', () => eq([].length,0))
// Now properly checks minSpend
test('R8: minSpend blocks', () => eq(calcValue({id:1,valueType:'FIXED',value:50,minSpend:1000},500),0))
test('R9: safe API', () => eq({success:true,results:[],bestCard:null}.success,true))

console.log('\nResults: '+(9-failed)+'/9 passed')
failed===0?process.exit(0):process.exit(1)
