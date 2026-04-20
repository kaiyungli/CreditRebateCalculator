const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcvileuzjzoltwttrjli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw'
);

async function verifyLinkage() {
  console.log('=== SMOKE TEST RESULTS VERIFICATION ===\n');
  
  // Get raw_offers state
  const { data: raw } = await supabase.from('raw_offers').select('*').order('id');
  console.log('RAW_OFFERS STATE:');
  raw?.forEach(r => {
    console.log(`  ID ${r.id}:`);
    console.log(`    title: ${r.title}`);
    console.log(`    status: ${r.status}`);
    console.log(`    status_notes: ${r.status_notes}`);
    console.log(`    processed_at: ${r.processed_at}`);
  });
  
  // Get merchant_offers with new columns
  const { data: mo } = await supabase.from('merchant_offers')
    .select('id,title,fingerprint,raw_offer_id,source_url,source_name,confidence,is_verified')
    .order('id');
    
  console.log('\nMERCHANT_OFFERS STATE:');
  mo?.forEach(m => {
    console.log(`  ID ${m.id}: ${m.title}`);
    console.log(`    fingerprint: ${m.fingerprint}`);
    console.log(`    raw_offer_id: ${m.raw_offer_id}`);
    console.log(`    confidence: ${m.confidence}`);
    console.log(`    is_verified: ${m.is_verified}`);
  });
  
  console.log('\n=== VERIFICATION COMPLETE ===');
}

verifyLinkage().catch(console.error);
