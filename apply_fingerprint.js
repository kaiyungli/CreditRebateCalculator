const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdmlsZXV6anpvbHR3dHRyamxpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk0MjI1OSwiZXhwIjoyMDg2NTE4MjU5fQ.Lsy0hszyCsB6ZrtREanBQcOioBV6e5JtZG9R4y8m6R4@db.qcvileuzjzoltwttrjli.supabase.co:6543/postgres',
});

async function applyMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Running fingerprint migration...\n')
    
    // Step 1: Add fingerprint column
    console.log('📝 Step 1: Adding fingerprint column...')
    await client.query(`
      ALTER TABLE merchant_offers ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(100);
    `)
    console.log('✅ Done')
    
    // Step 2: Generate fingerprints
    console.log('\n📝 Step 2: Generating fingerprints...')
    await client.query(`
      UPDATE merchant_offers 
      SET fingerprint = COALESCE(merchant_id::text, 'X') || '_' || 
                      bank_id::text || '_' || 
                      COALESCE(category_id::text, 'X') || '_' || 
                      value_type || '_' || 
                      ROUND(value::numeric, 2)::text || '_' || 
                      COALESCE(min_spend::text, '0')
      WHERE fingerprint IS NULL;
    `)
    console.log('✅ Done')
    
    // Step 3: Remove duplicates
    console.log('\n📝 Step 3: Removing duplicates...')
    
    // Find duplicates
    const dupResult = await client.query(`
      SELECT fingerprint, COUNT(*) as cnt, ARRAY_AGG(id) as ids
      FROM merchant_offers
      GROUP BY fingerprint
      HAVING COUNT(*) > 1
    `)
    
    if (dupResult.rows.length > 0) {
      console.log(`   Found ${dupResult.rows.length} duplicate groups`)
      
      for (const row of dupResult.rows) {
        const ids = row.ids.sort((a, b) => a - b)
        const keepId = ids[0]
        const removeIds = ids.slice(1)
        
        console.log(`   Fingerprint: ${row.fingerprint}`)
        console.log(`   Keeping: ${keepId}, Removing: ${removeIds.join(', ')}`)
        
        // Delete duplicates (keep lowest ID)
        await client.query(`
          DELETE FROM merchant_offers 
          WHERE fingerprint = $1 AND id != $2
        `, [row.fingerprint, keepId])
      }
    } else {
      console.log('   No duplicates found')
    }
    console.log('✅ Done')
    
    // Step 4: Add unique index
    console.log('\n📝 Step 4: Adding unique index...')
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_offers_fingerprint 
      ON merchant_offers(fingerprint) 
      WHERE fingerprint IS NOT NULL;
    `)
    console.log('✅ Done')
    
    // Verify
    const verifyResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM merchant_offers) as total_offers,
        (SELECT COUNT(DISTINCT fingerprint) FROM merchant_offers) as unique_fingerprints
    `)
    
    console.log('\n📊 Results:')
    console.log(`   Total offers: ${verifyResult.rows[0].total_offers}`)
    console.log(`   Unique fingerprints: ${verifyResult.rows[0].unique_fingerprints}`)
    
    console.log('\n✨ Migration complete!')
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

applyMigration()
