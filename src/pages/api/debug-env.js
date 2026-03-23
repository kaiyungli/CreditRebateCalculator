export default function handler(req, res) {
  res.status(200).json({
    MINIMAX_KEY_EXISTS: !!process.env.MINIMAX_API_KEY,
    MINIMAX_KEY_VALUE: process.env.MINIMAX_API_KEY ? 'SET' : 'NOT_SET',
    MINIMAX_KEY_START: process.env.MINIMAX_API_KEY?.substring(0, 10) || 'N/A',
  })
}
