// API: Get all categories
import { getCategories } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const categories = await getCategories();
    return res.status(200).json({ categories, count: categories.length });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: error.message });
  }
}
