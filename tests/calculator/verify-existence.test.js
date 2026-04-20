const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcvileuzjzoltwttrjli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw'
);

async function verify() {
  console.log('=== Database Verification ===\n');
  
  // Check raw_offers table structure
  const { data: raw } = await supabase.from('raw_offers').select('*').limit(2);
  console.log('raw_offers sample:', JSON.stringify(raw, null, 2));
  
  // Check merchant_offers new columns
  const { data: mo } = await supabase.from('merchant_offers').select('id,fingerprint,raw_offer_id,status').limit(2);
  console.log('\nmerchant_offers sample:', JSON.stringify(mo, null, 2));
  
  console.log('\n=== Schema Verified ===');
}

verify().catch(console.error);
