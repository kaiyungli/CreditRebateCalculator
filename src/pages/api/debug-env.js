// Debug: show exact env values being used
export default async function handler(req, res) {
  res.status(200).json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    HAS_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    HAS_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_KEY_START: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20),
    ANON_KEY_START: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20),
  })
}
