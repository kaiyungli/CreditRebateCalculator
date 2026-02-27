import { useEffect, useState } from 'react'
import { getUserCards, saveUserCards, isFirstTimeUser, markAsSeenCardSelector } from '../lib/userCards'

function formatCardName(card) {
  const bank = card.bank_name || card.bankName || ''
  return `${bank ? bank + ' ' : ''}${card.name || card.card_name || ''}`.trim()
}

export default function CardSelector({ onComplete, show: externalShow }) {
  const [selectedCards, setSelectedCards] = useState([])
  const [showSelector, setShowSelector] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  
  // 取得已選擇的卡片詳細資料
  const selectedCardDetails = cards.filter(c => selectedCards.includes(c.id))

  // Use external show prop if provided, otherwise use internal state
  const isVisible = externalShow !== undefined ? externalShow : showSelector

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedIds = getUserCards()
    setSelectedCards(savedIds)

    // show selector for first-time users, otherwise keep hidden
    // Only auto-show if no external show prop is provided
    if (externalShow === undefined && isFirstTimeUser()) setShowSelector(true)

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

  // 當 modal 打開時，如果已有選卡，預設顯示已選列表
  useEffect(() => {
    if (isVisible && selectedCards.length > 0) {
      setShowSelectedOnly(true)
    }
  }, [isVisible])

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
    markAsSeenCardSelector()
    setShowSelector(false)
    if (onComplete) onComplete([])
  }

  const handleClose = () => {
    if (externalShow !== undefined) {
      // 如果是外部控制，直接調用 onComplete
      if (onComplete) onComplete(selectedCards)
    } else {
      setShowSelector(false)
      if (onComplete) onComplete(selectedCards)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>
            {showSelectedOnly && selectedCards.length > 0 ? '🎴 我的信用卡' : '🎴 選擇你的信用卡'}
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            {showSelectedOnly && selectedCards.length > 0 
              ? '已選擇的信用卡可以直接移除' 
              : '幫你推薦最適合的回贈組合'}
          </p>
        </div>

        {/* 已選擇的卡片展示 (僅在有選卡且處於查看模式時顯示) */}
        {showSelectedOnly && selectedCardDetails.length > 0 && (
          <div style={{ 
            background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)', 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
              已選擇 {selectedCardDetails.length} 張信用卡
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedCardDetails.slice(0, 4).map(card => (
                <span key={card.id} style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {formatCardName(card)}
                </span>
              ))}
              {selectedCardDetails.length > 4 && (
                <span style={{ 
                  background: 'rgba(255,255,255,0.3)', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  +{selectedCardDetails.length - 4} 張
                </span>
              )}
            </div>
          </div>
        )}

        {/* Loading/Error */}
        <div style={{ marginBottom: '12px' }}>
          {loading && <div style={{ textAlign: 'center', color: '#64748B', fontSize: '14px' }}>載入信用卡中...</div>}
          {error && <div style={{ textAlign: 'center', color: '#DC2626', fontSize: '14px' }}>載入失敗: {error}</div>}
        </div>

        {/* Card List */}
        <div style={{ flex: 1, overflow: 'auto', marginBottom: '20px' }}>
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => toggleCard(card.id)}
              type="button"
              style={{
                width: '100%',
                padding: '14px 16px',
                marginBottom: '8px',
                borderRadius: '12px',
                border: selectedCards.includes(card.id) ? '2px solid #0066FF' : '2px solid #E2E8F0',
                background: selectedCards.includes(card.id) ? '#EFF6FF' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: selectedCards.includes(card.id) ? '#0066FF' : '#1E293B'
              }}>
                {formatCardName(card)}
              </span>
              <span style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: selectedCards.includes(card.id) ? '2px solid #0066FF' : '2px solid #CBD5E1',
                background: selectedCards.includes(card.id) ? '#0066FF' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                {selectedCards.includes(card.id) ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <button 
            onClick={handleClose} 
            type="button"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#64748B', 
              fontSize: '14px', 
              cursor: 'pointer',
              padding: '8px 16px'
            }}
          >
            {selectedCards.length > 0 ? '關閉' : '暫時不揀'}
          </button>
          <button
            onClick={handleSave}
            type="button"
            style={{
              background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)'
            }}
          >
            確認 ({selectedCards.length})
          </button>
        </div>
      </div>
    </div>
  )
}
