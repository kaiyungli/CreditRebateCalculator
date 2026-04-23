/**
 * Card Name Mapping
 */

const CARDS = {
  1: { name: 'HSBC Red', bank: 'HSBC' },
  2: { name: 'HSBC EveryMile', bank: 'HSBC' },
  3: { name: 'BOC Chill', bank: 'BOC' },
  4: { name: 'SC Priority', bank: 'Standard Chartered' },
  5: { name: 'Citi Premier', bank: 'Citibank' }
}

const BANKS = {
  1: 'HSBC',
  2: 'Hang Seng',
  3: 'BOC',
  4: 'Standard Chartered',
  5: 'Citibank'
}

export function getCardName(cardId) {
  return CARDS[cardId]?.name || `Card #${cardId}`
}

export function getCardBank(cardId) {
  return CARDS[cardId]?.bank || BANKS[cardId] || null
}

export function getBankName(bankId) {
  return BANKS[bankId] || null
}

export default { getCardName, getCardBank, getBankName }
