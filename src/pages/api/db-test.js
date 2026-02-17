import { Pool } from 'pg'

export default async function handler(req, res) {
  try {
    const url = process.env.DATABASE_URL
    
    if (!url) {
      return res.status(500).json({
        ok: false,
        error: 'DATABASE_URL is missing'
      })
    }

    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    })

    // 1) Test connection
    const now = await pool.query('select now() as now')

    // 2) List tables
    const tables = await pool.query(`
      select tablename from pg_tables 
      where schemaname = 'public' 
      order by tablename
    `)

    await pool.end()

    return res.status(200).json({
      ok: true,
      now: now.rows?.[0]?.now,
      tables: tables.rows.map((r) => r.tablename),
    })
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message ?? String(e)
    })
  }
}
