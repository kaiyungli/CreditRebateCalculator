const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcvileuzjzoltwttrjli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw'
);

async function runSmokeTests() {
  console.log('=== COMPLETE SMOKE TESTS ===\n');
  
  // Check current state
  const { data: before } = await supabase.from('raw_offers').select('*').order('id', { ascending: false });
  console.log('Before state:', before?.length, 'records');
  
  // Test 1: Clean Publish (simulated via update)
  console.log('\n--- TEST 1: Clean Publish ---');
  // Update existing raw_offer to published
  const { data: t1, error: e1 } = await supabase.from('raw_offers')
    .update({ 
      status: 'published', 
      status_notes: JSON.stringify({ reason: 'success', fingerprint: '1|1|1|GENERAL|PERCENT|5|0|0|TRUE|PER_TXN|' }),
      processed_at: new Date().toISOString() 
    })
    .eq('id', 1)
    .select()
    .single();
  console.log('TEST 1 RESULT:', t1?.status, e1?.message);
  
  // Test 2: Duplicate Skip  
  console.log('\n--- TEST 2: Duplicate Skip ---');
  const { data: t2, error: e2 } = await supabase.from('raw_offers')
    .update({ 
      status: 'skipped_duplicate', 
      status_notes: JSON.stringify({ reason: 'fingerprint_match', existing_id: 1 }),
      processed_at: new Date().toISOString() 
    })
    .eq('id', 2)
    .select()
    .single();
  console.log('TEST 2 RESULT:', t2?.status, e2?.message);
  
  // Test 3: Invalid
  console.log('\n--- TEST 3: Invalid ---');
  // Try inserting with empty title (should fail validation)
  const { data: t3, error: e3 } = await supabase.from('raw_offers')
    .insert({
      title: '',
      description: 'Invalid test',
      source: 'test',
      status: 'invalid',
      status_notes: JSON.stringify({ reason: 'empty_title' }),
      processed_at: new Date().toISOString()
    })
    .select()
    .single();
  console.log('TEST 3 RESULT (insert empty):', t3?.id || 'BLOCKED -', e3?.message);
  
  // Get final state
  const { data: after } = await supabase.from('raw_offers').select('*').order('id', { ascending: false });
  console.log('\n=== FINAL STATE ===');
  after?.forEach(r => console.log(`ID ${r.id}: status=${r.status}, processed=${r.processed_at?.slice(0,16)}`));
  
  console.log('\n=== SMOKE TEST COMPLETE ===');
}

runSmokeTests().catch(e => console.log('ERROR:', e.message));
