/**
 * Scraper API Endpoint
 * Can be called to trigger scraper manually or via cron
 * 
 * Usage:
 * - GET /api/scraper - Run scraper and return results
 * - GET /api/scraper?json=1 - Run scraper, only output JSON (no DB update)
 */

import { runScraper } from '../../../../scraper/scraper.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('[Scraper API] Starting scraper...');
    
    // Run scraper
    const result = await runScraper();
    
    // Return success
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (error) {
    console.error('[Scraper API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
