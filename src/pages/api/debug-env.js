// Debug endpoint - show which key is actually being used
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Test which key works
  let serviceResult = { error: 'not tested' }
  let anonResult = { error: 'not tested' }
  
  // Test with service key
  if (serviceKey) {
    const serviceClient = createClient(supabaseUrl, serviceKey)
    const test = await serviceClient.from('banks').select('count', { count: 'exact', head: true })
    serviceResult = test.error ? { error: test.error.message } : { success: true }
  }
  
  // Test with anon key
  if (anonKey) {
    const anonClient = createClient(supabaseUrl, anonKey)
    const test = await anonClient.from('banks').select('count', { count: 'exact', head: true })
    anonResult = test.error ? { error: test.error.message } : { success: true }
  }
  
  res.status(200).json({
    supabaseUrl,
    hasServiceKey: !!serviceKey,
    hasAnonKey: !!anonKey,
    serviceKeyWorks: serviceResult,
    anonKeyWorks: anonResult,
  })
}
