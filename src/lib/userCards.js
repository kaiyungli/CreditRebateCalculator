// userCards storage helpers (no mock)

export function getUserCards() {
  if (typeof window === 'undefined') return []
  const saved = localStorage.getItem('userCards')
  try {
    const parsed = saved ? JSON.parse(saved) : []
    // normalize to number ids
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => Number.isFinite(n)) : []
  } catch {
    return []
  }
}

export function saveUserCards(cardIds) {
  if (typeof window === 'undefined') return
  const ids = (cardIds || []).map(Number).filter(n => Number.isFinite(n))
  localStorage.setItem('userCards', JSON.stringify(ids))
}

export function isFirstTimeUser() {
  if (typeof window === 'undefined') return true
  return !localStorage.getItem('hasSeenCardSelector')
}

export function markAsSeenCardSelector() {
  if (typeof window === 'undefined') return
  localStorage.setItem('hasSeenCardSelector', 'true')
}
