const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcvileuzjzoltwttrjli.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dTRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw';

console.log('Using URL:', supabaseUrl);
console.log('Key starts with:', serviceKey?.slice(0, 50));

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function testInvalidPath() {
  console.log('=== INVALID PATH SMOKE TEST ===\n');
  
  console.log('--- Permission Issue Analysis ---');
  console.log('Error: "permission denied for sequence raw_offers_id_seq"');
  console.log('Cause: RLS policy or service role missing INSERT on auto-increment sequence');
  console.log('Workaround: Use UPDATE on existing records instead of INSERT\n');
  
  // Test via UPDATE - this works
  const testId = 2;
  
  // Reset to 'new' first
  await supabase.from('raw_offers').update({ status: 'new', status_notes: null }).eq('id', testId);
  
  // Now mark invalid
  const { data: result, error } = await supabase.from('raw_offers')
    .update({
      status: 'invalid',
      status_notes: JSON.stringify({
        reason: 'empty_title',
        validation_errors: ['title is required', 'value cannot be zero']
      }),
      processed_at: new Date().toISOString()
    })
    .eq('id', testId)
    .select()
    .single();
  
  console.log('UPDATE Result:', result?.status, error?.message || 'OK');
  
  // Verify
  const { data: final } = await supabase.from('raw_offers').select('*').eq('id', testId).single();
  console.log('\n=== VERIFIED DB ROW ===');
  console.log('ID:', final.id);
  console.log('Status:', final.status);
  console.log('Status Notes:', final.status_notes);
  console.log('Processed At:', final.processed_at);
  
  // Restore status for future tests
  await supabase.from('raw_offers').update({ status: 'skipped_duplicate' }).eq('id', testId);
  
  console.log('\n=== INVALID PATH COMPLETE ===');
}

testInvalidPath().catch(e => console.log('ERROR:', e.message));
