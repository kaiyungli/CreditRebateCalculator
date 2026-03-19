// Debug endpoint to check environment variables
export default async function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check which key is actually being used
  const activeKey = serviceKey || anonKey
  
  res.status(200).json({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'NOT_SET',
    HAS_SERVICE_ROLE_KEY: !!serviceKey,
    HAS_ANON_KEY: !!anonKey,
    ACTUAL_KEY_USED: activeKey ? activeKey.substring(0, 50) + '...' : 'NOT_SET',
    IS_USING_SERVICE_KEY: !!serviceKey,
    IS_USING_ANON_KEY: !serviceKey && !!anonKey,
    NODE_ENV: process.env.NODE_ENV,
  })
}
