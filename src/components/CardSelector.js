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
  // Selected cards sorted alphabetically
  const selectedCardDetails = cards
    .filter(c => selectedCards.includes(c.id))
    .sort((a, b) => (a.name || a.card_name || '').toLowerCase().localeCompare((b.name || b.card_name || '').toLowerCase()))

  // Use external show prop if provided, otherwise use internal state
  const isVisible = externalShow !== undefined ? externalShow : showSelector

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedIds = getUserCards()
    setSelectedCards(savedIds)

    // show selector for first-time users, otherwise keep hidden
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

  // 移除單張卡
  const removeCard = (cardId, e) => {
    e?.stopPropagation()
    setSelectedCards(prev => prev.filter(id => id !== cardId))
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
    // Close the modal - for external control, call onComplete to notify parent
    if (externalShow !== undefined) {
      // External control - notify parent to close
      if (onComplete) onComplete(selectedCards);
    } else {
      setShowSelector(false);
      if (onComplete) onComplete(selectedCards);
    }
  }

  const handleDone = () => {
    saveUserCards(selectedCards);
    markAsSeenCardSelector();
    if (externalShow !== undefined) {
      if (onComplete) onComplete(selectedCards);
    } else {
      setShowSelector(false);
      if (onComplete) onComplete(selectedCards);
    }
  }

  if (!isVisible) return null

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Backdrop - click does NOT close modal anymore */}
      <div 
        style={{ position: 'absolute', inset: 0, cursor: 'default' }}
      />
      
      {/* Wrapper for centering - handles the transform centering */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* Modal Container - Booking.com style - handles animation */}
        <div 
          style={{ 
            width: '100%',
            maxHeight: '85vh',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out',
            overflow: 'hidden'
          }}
        >
        {/* Decorative top bar - Booking.com style accent */}
        <div style={{ 
          height: '4px', 
          background: 'linear-gradient(90deg, #003580 0%, #0052CC 50%, #003580 100%)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }} />
        
        {/* Close button - top right */}
        <button
          onClick={handleClose}
          type="button"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontSize: '18px',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.target.style.background = '#E2E8F0'; e.target.style.color = '#1E293B'; }}
          onMouseOut={(e) => { e.target.style.background = '#F1F5F9'; e.target.style.color = '#64748B'; }}
        >
          ✕
        </button>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
              {showSelectedOnly && selectedCards.length > 0 ? '🎴 我的信用卡' : '🎴 選擇你的信用卡'}
            </h2>
            {selectedCards.length > 0 && (
              <span style={{
                background: '#0066FF',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 102, 255, 0.3)'
              }}>
                已選 {selectedCards.length} 張
              </span>
            )}
          </div>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            {showSelectedOnly && selectedCards.length > 0 
              ? '已選擇的信用卡可以直接移除' 
              : '幫你推薦最適合的回贈組合'}
          </p>
        </div>

        {/* 已選擇的卡片列表 (可移除) */}
        {showSelectedOnly && selectedCardDetails.length > 0 && (
          <div style={{ 
            background: '#F8FAFC', 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '16px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <div style={{ color: '#64748B', fontSize: '12px', marginBottom: '12px', fontWeight: '600' }}>
              已選擇 {selectedCardDetails.length} 張信用卡 ✕ 可以移除
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCardDetails.map(card => (
                <div key={card.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'white',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>
                    {formatCardName(card)}
                  </span>
                  <button
                    onClick={(e) => removeCard(card.id, e)}
                    style={{
                      background: '#FEE2E2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✕ 移除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading/Error */}
        <div style={{ marginBottom: '12px' }}>
          {loading && <div style={{ textAlign: 'center', color: '#64748B', fontSize: '14px' }}>載入信用卡中...</div>}
          {error && <div style={{ textAlign: 'center', color: '#DC2626', fontSize: '14px' }}>載入失敗: {error}</div>}
        </div>

        {/* Card List - sorted: selected first, then alphabetically by name */}
        <div style={{ flex: 1, overflow: 'auto', marginBottom: '20px' }}>
          {[...cards].sort((a, b) => {
            const aSelected = selectedCards.includes(a.id)
            const bSelected = selectedCards.includes(b.id)
            // Selected cards first
            if (aSelected && !bSelected) return -1
            if (!aSelected && bSelected) return 1
            // Then sort alphabetically by name
            const aName = (a.name || a.card_name || '').toLowerCase()
            const bName = (b.name || b.card_name || '').toLowerCase()
            return aName.localeCompare(bName)
          }).map(card => (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '8px', borderTop: '1px solid #E2E8F0' }}>
          <button 
            onClick={() => {
              if (externalShow !== undefined) {
                // External control - just close without saving
                if (onComplete) onComplete(selectedCards);
              } else {
                handleSkip();
              }
            }} 
            type="button"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#64748B', 
              fontSize: '14px', 
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#F1F5F9'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            {selectedCards.length > 0 ? '取消' : '暫時不揀'}
          </button>
          <button
            onClick={handleDone}
            type="button"
            style={{
              background: '#003580',
              color: 'white',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 53, 128, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.background = '#00224f'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.target.style.background = '#003580'; e.target.style.transform = 'translateY(0)'; }}
          >
            完成 ({selectedCards.length})
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
