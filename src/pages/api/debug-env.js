// Debug endpoint to check environment variables
export default async function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  res.status(200).json({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'NOT_SET',
    HAS_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    KEY_PREFIX: supabaseKey ? supabaseKey.substring(0, 30) + '...' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV,
  })
}
