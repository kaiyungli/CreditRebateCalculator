// API: Get all cards
import { getCards } from '../../../lib/db';

export default async function handler(request) {
  const { bank_id, card_type, limit } = request.query;

  try {
    const cards = await getCards({
      bank_id: bank_id ? parseInt(bank_id) : undefined,
      card_type,
      limit: limit ? parseInt(limit) : 50,
    });

    return new Response(JSON.stringify({ cards, count: cards.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
