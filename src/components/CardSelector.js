import { useEffect, useState } from 'react'
import { getUserCards, saveUserCards, isFirstTimeUser, markAsSeenCardSelector } from '../lib/userCards'

function formatCardName(card) {
  const bank = card.bank_name || card.bankName || ''
  return `${bank ? bank + ' ' : ''}${card.name || card.card_name || ''}`.trim()
}

export default function CardSelector({ onComplete, onClose, show: externalShow }) {
  const [selectedCards, setSelectedCards] = useState([])
  const [confirmedCards, setConfirmedCards] = useState([])  // 確認既卡先會影響上面既 list
  const [showSelector, setShowSelector] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  
  // 取得已選擇既卡片詳細資料 (based on confirmed cards for display)
  // Selected cards sorted alphabetically
  const selectedCardDetails = cards
    .filter(c => confirmedCards.includes(c.id))
    .sort((a, b) => (a.name || a.card_name || '').toLowerCase().localeCompare((b.name || b.card_name || '').toLowerCase()))

  // Use external show prop if provided, otherwise use internal state
  const isVisible = externalShow !== undefined ? externalShow : showSelector

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedIds = getUserCards()
    // selectedCards: user 既即時選擇（未confirm）
    setSelectedCards(savedIds)
    // confirmedCards: 呢度唔set，等用户confirm先至set
    // setConfirmedCards(savedIds) // 移除呢句，等用户confirm先至會update上面既list

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

  // 當 modal 打開時，如果已有確認既卡，預設顯示已選列表
  useEffect(() => {
    if (isVisible && confirmedCards.length > 0) {
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

  // 移除單張卡 - 直接從 confirmed 度移除（呢個係 user 响 list 度明確既動作）
  const removeCard = (cardId, e) => {
    e?.stopPropagation()
    setConfirmedCards(prev => prev.filter(id => id !== cardId))
    // 同步更新 selectedCards
    setSelectedCards(prev => prev.filter(id => id !== cardId))
  }

  const handleSave = () => {
    // 用 confirmedCards 去 save
    saveUserCards(confirmedCards)
    markAsSeenCardSelector()
    setShowSelector(false)
    if (onComplete) onComplete(confirmedCards)
  }

  const handleSkip = () => {
    // Skip 既話清除所有選擇
    setConfirmedCards([])
    setSelectedCards([])
    markAsSeenCardSelector()
    if (externalShow !== undefined) {
      // External control - 用 onClose 如果有提供，否則用 onComplete 但傳 undefined 表示只close
      if (onClose) {
        onClose();
      } else if (onComplete) {
        onComplete(undefined);  // undefined = 只 close，唔 update
      }
    } else {
      setShowSelector(false)
      if (onComplete) onComplete([])
    }
  }

  const handleClose = () => {
    // Close the modal - 用 onClose (如果提供咗) 或者 onComplete
    // 確保唔會因為 toggle 卡而即刻彈上去
    if (externalShow !== undefined) {
      // External control - 用 onClose 如果有提供，否則用 onComplete 但傳 undefined 表示只close
      if (onClose) {
        onClose();
      } else if (onComplete) {
        onComplete(undefined);  // undefined = 只 close，唔 update cards
      }
    } else {
      setShowSelector(false);
    }
  }

  const handleDone = () => {
    // 先將 selectedCards sync 去 confirmedCards (user toggle 既卡)
    setConfirmedCards(selectedCards);
    // 用 selectedCards (而家已經包含晒 user toggle 既卡) 去 save
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
              {showSelectedOnly && confirmedCards.length > 0 ? '🎴 我的信用卡' : '🎴 選擇你的信用卡'}
            </h2>
            {confirmedCards.length > 0 && (
              <span style={{
                background: '#0066FF',
                color: 'white',
                fontSize: '14px',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 102, 255, 0.3)'
              }}>
                已選 {confirmedCards.length} 張
              </span>
            )}
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {confirmedCards.length > 0 ? (
              <>
                <span style={{ color: '#F59E0B', fontSize: '16px' }}>⚠️</span>
                <span style={{ color: '#D97706', fontWeight: '600' }}>請點擊下方「確認選擇」按鈕保存</span>
              </>
            ) : (
              showSelectedOnly && selectedCards.length > 0 
                ? '已選擇的信用卡可以直接移除' 
                : '幫你推薦最適合的回贈組合'
            )}
          </p>
        </div>

        {/* 已選擇的卡片列表 (可移除) - 只顯示已確認既卡 */}
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
              已選擇 {selectedCardDetails.length} 張信用卡 (確認後生效)
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

        {/* Card List - sorted: confirmed cards first (after user confirmed), then alphabetically */}
        <div style={{ flex: 1, overflow: 'auto', marginBottom: '20px' }}>
          {[...cards].sort((a, b) => {
            // If user has confirmed cards, show them at top
            const hasConfirmed = confirmedCards.length > 0
            if (hasConfirmed) {
              const aConfirmed = confirmedCards.includes(a.id)
              const bConfirmed = confirmedCards.includes(b.id)
              // Confirmed cards first
              if (aConfirmed && !bConfirmed) return -1
              if (!aConfirmed && bConfirmed) return 1
            }
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

        {/* Actions - 重要：選擇卡片後必須點擊確認才能保存 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: '16px', 
          paddingBottom: '8px', 
          borderTop: '1px solid #E2E8F0',
          background: selectedCards.length > 0 ? 'linear-gradient(180deg, #FFF9E6 0%, #FFF 100%)' : 'white',
          padding: '16px',
          margin: '0 -24px -24px -24px',
          borderRadius: '0 0 16px 16px'
        }}>
          <button 
            onClick={() => {
              if (externalShow !== undefined) {
                // External control - just close without saving
                if (onClose) {
                  onClose();
                } else if (onComplete) {
                  onComplete(undefined);  // undefined = 只 close，唔 update cards
                }
              } else {
                handleSkip();
              }
            }} 
            type="button"
            style={{ 
              background: 'transparent', 
              border: '2px solid #E2E8F0', 
              color: '#64748B', 
              fontSize: '14px', 
              cursor: 'pointer',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.background = '#F8FAFC'; }}
            onMouseOut={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = 'transparent'; }}
          >
            {selectedCards.length > 0 ? '取消' : '暫時不揀'}
          </button>
          
          {/* 確認/完成按鈕 - 更明顯的設計 */}
          <button
            onClick={handleDone}
            type="button"
            disabled={selectedCards.length === 0}
            style={{
              background: selectedCards.length > 0 
                ? 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)' 
                : '#CBD5E1',
              color: 'white',
              padding: '14px 36px',
              borderRadius: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              boxShadow: selectedCards.length > 0 
                ? '0 4px 16px rgba(0, 102, 255, 0.4)' 
                : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => { 
              if (selectedCards.length > 0) {
                e.target.style.background = 'linear-gradient(135deg, #0052CC 0%, #003580 100%)'; 
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 102, 255, 0.5)';
              }
            }}
            onMouseOut={(e) => { 
              e.target.style.background = 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)'; 
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 102, 255, 0.4)';
            }}
          >
            {/* 圖標 */}
            <span style={{ fontSize: '18px' }}>
              {selectedCards.length > 0 ? '✓' : '✕'}
            </span>
            {selectedCards.length > 0 
              ? `確認選擇 (${selectedCards.length} 張)` 
              : '請選擇信用卡'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
