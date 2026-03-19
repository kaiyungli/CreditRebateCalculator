// Debug endpoint
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const results = {}
  
  // Test service key
  if (serviceKey) {
    try {
      const client = createClient(supabaseUrl, serviceKey)
      const test = await client.from('cards').select('*', { count: 'exact', head: true })
      results.service = {
        hasError: !!test.error,
        errorObj: test.error || null,
        errorMsg: test.error?.message || 'no error',
        count: test.count
      }
    } catch (e) {
      results.service = { exception: e.message }
    }
  }
  
  // Test anon key  
  if (anonKey) {
    try {
      const client = createClient(supabaseUrl, anonKey)
      const test = await client.from('cards').select('*', { count: 'exact', head: true })
      results.anon = {
        hasError: !!test.error,
        errorObj: test.error || null,
        errorMsg: test.error?.message || 'no error',
        count: test.count
      }
    } catch (e) {
      results.anon = { exception: e.message }
    }
  }
  
  res.status(200).json(results)
}
