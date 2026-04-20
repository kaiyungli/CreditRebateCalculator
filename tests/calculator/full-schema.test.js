const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcvileuzjzoltwttrjli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw'
);

async function fullCheck() {
  console.log('=== FULL SCHEMA CHECK ===\n');
  
  // Get all columns from merchant_offers by selecting one row with all fields
  const { data: mo } = await supabase.from('merchant_offers').select('*').limit(1).single();
  console.log('merchant_offers columns:', Object.keys(mo || {}));
  
  // Get all columns from raw_offers
  const { data: ro } = await supabase.from('raw_offers').select('*').limit(1).single();
  console.log('raw_offers columns:', Object.keys(ro || {}));
  
  // Count records
  const { count: moCount } = await supabase.from('merchant_offers').select('*', { count: 'exact', head: true });
  const { count: roCount } = await supabase.from('raw_offers').select('*', { count: 'exact', head: true });
  console.log('\nRecord counts:');
  console.log('- merchant_offers:', moCount);
  console.log('- raw_offers:', roCount);
}

fullCheck().catch(console.error);
