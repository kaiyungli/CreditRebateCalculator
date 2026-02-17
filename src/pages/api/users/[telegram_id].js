// API: User management (save cards, preferences)
import { getUserByTelegramId, upsertUser, saveCalculation, getUserCalculations } from '../../../lib/db';
import { getCards } from '../../../lib/db';

export default async function handler(req, res) {
  const { telegram_id } = req.query;
  const method = req.method;

  if (!telegram_id) {
    return res.status(400).json({ error: 'telegram_id is required' });
  }

  try {
    // GET: Get user profile and calculations
    if (method === 'GET') {
      const user = await getUserByTelegramId(telegram_id);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          my_cards: [],
          calculations: []
        });
      }

      // Get card details for user's cards
      let myCards = [];
      if (user.my_cards && user.my_cards.length > 0) {
        myCards = await getCards({ 
          status: 'ACTIVE',
          limit: 100 
        });
        myCards = myCards.filter(c => user.my_cards.includes(c.id));
      }

      const calculations = await getUserCalculations(user.id);

      return res.status(200).json({
        user,
        my_cards: myCards,
        calculations,
      });
    }

    // PUT/POST: Update user
    if (method === 'PUT' || method === 'POST') {
      const body = req.body;
      const { my_cards, preferences } = body;

      const user = await upsertUser(telegram_id, { my_cards, preferences });

      return res.status(200).json({ success: true, user });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error with user API:', error);
    return res.status(500).json({ error: error.message });
  }
}
