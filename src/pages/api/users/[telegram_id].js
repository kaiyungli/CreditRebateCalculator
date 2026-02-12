// API: User management (save cards, preferences)
import { getUserByTelegramId, upsertUser, saveCalculation, getUserCalculations } from '../../../lib/db';
import { getCards } from '../../../lib/db';

export default async function handler(request) {
  const { telegram_id } = request.query;
  const method = request.method;

  if (!telegram_id) {
    return new Response(JSON.stringify({ error: 'telegram_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // GET: Get user profile and calculations
    if (method === 'GET') {
      const user = await getUserByTelegramId(telegram_id);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'User not found',
          my_cards: [],
          calculations: []
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
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

      return new Response(JSON.stringify({
        user,
        my_cards: myCards,
        calculations,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PUT/POST: Update user
    if (method === 'PUT' || method === 'POST') {
      const body = await request.json();
      const { my_cards, preferences } = body;

      const user = await upsertUser(telegram_id, { my_cards, preferences });

      return new Response(JSON.stringify({ success: true, user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error with user API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
