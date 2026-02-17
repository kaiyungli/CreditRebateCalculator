import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

export default async function handler(req, res) {
  try {
    // Get all tables
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `)

    // Get columns for each table
    const tableSchemas = {}
    
    for (const row of tables.rows) {
      const tableName = row.tablename
      const columns = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName])
      
      tableSchemas[tableName] = columns.rows
    }

    // Get foreign keys
    const foreignKeys = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `)

    // Get indexes
    const indexes = await pool.query(`
      SELECT
        tablename AS table_name,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    await pool.end()

    res.status(200).json({
      tables: tables.rows.map(r => r.tablename),
      schemas: tableSchemas,
      foreignKeys: foreignKeys.rows,
      indexes: indexes.rows
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
