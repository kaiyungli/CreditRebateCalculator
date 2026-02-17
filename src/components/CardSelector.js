import { useEffect, useState } from 'react'
import { getUserCards, saveUserCards, isFirstTimeUser, markAsSeenCardSelector } from '../lib/userCards'

function formatCardName(card) {
  // cards API currently returns { id, bank_id, name, bank_name? ... }
  // your deployed /api/cards already returns bank_name + name
  const bank = card.bank_name || card.bankName || ''
  return `${bank ? bank + ' ' : ''}${card.name || card.card_name || ''}`.trim()
}

export default function CardSelector({ onComplete }) {
  const [selectedCards, setSelectedCards] = useState([])
  const [showSelector, setShowSelector] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedIds = getUserCards()
    setSelectedCards(savedIds)

    // show selector for first-time users, otherwise keep hidden
    if (isFirstTimeUser()) setShowSelector(true)

    async function loadCards() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/cards?limit=200')
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
        setCards(data.cards || [])
      } catch (e) {
        setError(e?.message || 'Failed to load cards')
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [])

  const toggleCard = (cardId) => {
    setSelectedCards(prev => (
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    ))
  }

  const handleSave = () => {
    saveUserCards(selectedCards)
    markAsSeenCardSelector()
    setShowSelector(false)
    if (onComplete) onComplete(selectedCards)
  }

  const handleSkip = () => {
    // allow no selection but still mark seen (optional)
    markAsSeenCardSelector()
    setShowSelector(false)
    if (onComplete) onComplete([])
  }

  if (!showSelector) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4">
        <h2 className="text-lg font-semibold">選擇你有的信用卡</h2>
        <p className="text-sm text-gray-600">幫你推薦最適合的回贈組合</p>

        <div className="mt-3">
          {loading && <div className="text-sm text-gray-600">載入信用卡中...</div>}
          {error && <div className="text-sm text-red-600">載入失敗: {error}</div>}
        </div>

        <div className="mt-3 max-h-[50vh] overflow-auto space-y-2">
          {cards.map(card => (
            <button
              key={card.id}
              className="w-full rounded-lg border px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
              onClick={() => toggleCard(card.id)}
              type="button"
            >
              <span className="text-sm">{formatCardName(card)}</span>
              <span className="text-sm">{selectedCards.includes(card.id) ? '已選' : '未選'}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button className="text-sm text-gray-600" onClick={handleSkip} type="button">
            暫時不揀
          </button>
          <button
            className="rounded-lg bg-black px-3 py-2 text-sm text-white"
            onClick={handleSave}
            type="button"
          >
            確認選擇 ({selectedCards.length})
          </button>
        </div>
      </div>
    </div>
  )
}
