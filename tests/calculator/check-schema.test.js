const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qcvileuzjzoltwttrjli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ._P48GO5DssMkyOY6rJIK2kUqWntm3uzdNfNRooaeNCw'
);

// Try inserting raw_offers with minimal fields
async function checkSchema() {
  console.log('=== Checking raw_offers table ===');
  
  // First, check if table exists by selecting - if cols missing, we know it might not exist or has wrong schema
  const { data, error } = await supabase.from('raw_offers').select('*').limit(1);
  
  console.log('Select result:', data, error?.message);
  
  // If error, try creating table
  if (error) {
    console.log('\nTable may not exist or has wrong schema. Let me try creating...');
  }
}

checkSchema().catch(console.error);
