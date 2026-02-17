import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export default async function handler(req, res) {
  try {
    const [cards, users, categories] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as n FROM cards'),
      pool.query('SELECT COUNT(*)::int as n FROM users'),
      pool.query('SELECT COUNT(*)::int as n FROM categories'),
    ])

    return res.status(200).json({
      cards: cards.rows[0].n,
      users: users.rows[0].n,
      categories: categories.rows[0].n,
    })
  } catch (e) {
    return res.status(500).json({
      error: e?.message ?? String(e)
    })
  }
}
