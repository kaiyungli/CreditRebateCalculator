// Debug endpoint - show which key is actually being used
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Test which key works
  let serviceResult = { success: false, error: null, count: null }
  let anonResult = { success: false, error: null, count: null }
  
  // Test with service key
  if (serviceKey) {
    try {
      const serviceClient = createClient(supabaseUrl, serviceKey)
      const test = await serviceClient.from('cards').select('*', { count: 'exact', head: true })
      serviceResult = {
        success: !test.error,
        error: test.error ? test.error.message : null,
        count: test.count
      }
    } catch (e) {
      serviceResult = { success: false, error: e.message, count: null }
    }
  }
  
  // Test with anon key
  if (anonKey) {
    try {
      const anonClient = createClient(supabaseUrl, anonKey)
      const test = await anonClient.from('cards').select('*', { count: 'exact', head: true })
      anonResult = {
        success: !test.error,
        error: test.error ? test.error.message : null,
        count: test.count
      }
    } catch (e) {
      anonResult = { success: false, error: e.message, count: null }
    }
  }
  
  res.status(200).json({
    supabaseUrl,
    hasServiceKey: !!serviceKey,
    hasAnonKey: !!anonKey,
    serviceKeyResult: serviceResult,
    anonKeyResult: anonResult,
  })
}
