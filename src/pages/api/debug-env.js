// Debug endpoint - show which key is actually being used
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Test which key works
  let serviceResult = { error: 'not tested', count: 0 }
  let anonResult = { error: 'not tested', count: 0 }
  
  // Test with service key
  if (serviceKey) {
    try {
      const serviceClient = createClient(supabaseUrl, serviceKey)
      const test = await serviceClient.from('banks').select('*', { count: 'exact', head: true })
      serviceResult = test.error ? { error: test.error.message } : { success: true, count: test.count }
    } catch (e) {
      serviceResult = { error: e.message }
    }
  }
  
  // Test with anon key
  if (anonKey) {
    try {
      const anonClient = createClient(supabaseUrl, anonKey)
      const test = await anonClient.from('banks').select('*', { count: 'exact', head: true })
      anonResult = test.error ? { error: test.error.message } : { success: true, count: test.count }
    } catch (e) {
      anonResult = { error: e.message }
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
