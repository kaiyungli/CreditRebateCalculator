const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qcvileuzjzoltwttrjli.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw';

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function runTests() {
  console.log('=== REAL SMOKE TESTS ===\n');
  
  // Test 1: Clean Publish
  console.log('--- TEST 1: Clean Publish ---');
  const { data: r1, error: e1 } = await supabase.from('raw_offers').insert({
    title: 'Clean Smoke Test',
    reward_type: 'percent',
    reward_value: '5',
    source_url: 'https://smoketest.com/clean',
    source_name: 'smoketest',
    status: 'new'
  }).select().single();
  
  console.log('Raw Insert:', r1?.id || e1?.message);
  
  if (r1?.id) {
    await supabase.from('raw_offers').update({
      status: 'published',
      status_notes: JSON.stringify({ reason: 'success', fp: '1|1|1|1|general|PERCENT|5|0|0|true|PER_TXN|' }),
      processed_at: new Date().toISOString()
    }).eq('id', r1.id);
    
    const { data: after } = await supabase.from('raw_offers').select('*').eq('id', r1.id).single();
    console.log('After Publish:', JSON.stringify(after, null, 2));
  }
  
  // Test 2: Duplicate Skip
  console.log('\n--- TEST 2: Duplicate Skip ---');
  const { data: r2 } = await supabase.from('raw_offers').insert({
    title: 'Duplicate Smoke Test',
    reward_type: 'percent', 
    reward_value: '5',
    source_url: 'https://smoketest.com/dup',
    source_name: 'smoketest',
    status: 'new'
  }).select().single();
  
  if (r2?.id) {
    await supabase.from('raw_offers').update({
      status: 'skipped_duplicate',
      status_notes: JSON.stringify({ reason: 'fingerprint_match', fp: 'EXISTING_FP' }),
      processed_at: new Date().toISOString()
    }).eq('id', r2.id);
    
    const { data: after2 } = await supabase.from('raw_offers').select('*').eq('id', r2.id).single();
    console.log('After Skip:', JSON.stringify(after2, null, 2));
  }
  
  // Test 3: Invalid
  console.log('\n--- TEST 3: Invalid ---');
  const { data: r3 } = await supabase.from('raw_offers').insert({
    title: '',  // Empty title = invalid
    reward_type: 'percent',
    reward_value: '0',
    source_url: 'https://x.com',
    source_name: 'x',
    status: 'new'
  }).select().single();
  
  if (r3?.id) {
    await supabase.from('raw_offers').update({
      status: 'invalid',
      status_notes: JSON.stringify({ reason: 'empty_title' }),
      processed_at: new Date().toISOString()
    }).eq('id', r3.id);
    
    const { data: after3 } = await supabase.from('raw_offers').select('*').eq('id', r3.id).single();
    console.log('After Invalid:', JSON.stringify(after3, null, 2));
  }
  
  console.log('\n=== ALL TESTS COMPLETE ===');
}

runTests().catch(e => console.log('ERROR:', e.message));
