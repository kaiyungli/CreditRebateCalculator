/**
* Ingestion Domain - Offer Publisher
* Publishes validated offers to database
*/

import { normalizeAndInsert } from '../normalizers/offerNormalizer'

/**
* Publish a parsed offer to the database
* @param {Object} parsed - Parsed offer object
* @param {number} [rawOfferId] - Original offer ID if exists
* @returns {Promise<Object>} Result with id and duplicate flag
*/
export async function publishOffer(parsed, rawOfferId = null) {
  return normalizeAndInsert(parsed, rawOfferId)
}

export default { publishOffer }
