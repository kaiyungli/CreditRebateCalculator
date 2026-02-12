// API: Get all categories
import { getCategories } from '../../../lib/db';

export default async function handler(request) {
  try {
    const categories = await getCategories();

    return new Response(JSON.stringify({ categories, count: categories.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
