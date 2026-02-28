import { useEffect, useState } from 'react'
import { getUserCards, saveUserCards, isFirstTimeUser, markAsSeenCardSelector } from '../lib/userCards'

function formatCardName(card) {
  const bank = card.bank_name || card.bankName || ''
  return `${bank ? bank + ' ' : ''}${card.name || card.card_name || ''}`.trim()
}

export default function CardSelector({ onComplete, onClose, show: externalShow }) {
  const [selectedCards, setSelectedCards] = useState([])
  const [confirmedCards, setConfirmedCards] = useState([])
  const [showSelector, setShowSelector] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  
  const selectedCardDetails = cards
    .filter(c => confirmedCards.includes(c.id))
    .sort((a, b) => (a.name || a.card_name || '').toLowerCase().localeCompare((b.name || b.card_name || '').toLowerCase()))

  const isVisible = externalShow !== undefined ? externalShow : showSelector

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedIds = getUserCards()
    setSelectedCards(savedIds)
    setConfirmedCards(savedIds)

    if (externalShow === undefined && isFirstTimeUser()) setShowSelector(true)

    async function loadCards() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/cards?limit=200')
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'API error')
        setCards(data.cards || [])
      } catch (e) {
        setError(e?.message || 'Failed to load cards')
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [])

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

  const removeCard = (cardId, e) => {
    e?.stopPropagation()
    setConfirmedCards(prev => prev.filter(id => id !== cardId))
    setSelectedCards(prev => prev.filter(id => id !== cardId))
  }

  const handleSave = () => {
    saveUserCards(confirmedCards)
    markAsSeenCardSelector()
    setShowSelector(false)
    if (onComplete) onComplete(confirmedCards)
  }

  const handleSkip = () => {
    setConfirmedCards([])
    setSelectedCards([])
    markAsSeenCardSelector()
    if (externalShow !== undefined) {
      if (onClose) {
        onClose()
      } else if (onComplete) {
        onComplete(undefined)
      }
    } else {
      setShowSelector(false)
      if (onComplete) onComplete([])
    }
  }

  const handleClearAll = () => {
    setSelectedCards([])
    setConfirmedCards([])
  }

  const handleClose = () => {
    if (externalShow !== undefined) {
      if (onClose) {
        onClose()
      } else if (onComplete) {
        onComplete(undefined)
      }
    } else {
      setShowSelector(false)
    }
  }

  const handleDone = () => {
    setConfirmedCards(selectedCards)
    saveUserCards(selectedCards)
    markAsSeenCardSelector()
    if (externalShow !== undefined) {
      if (onComplete) onComplete(selectedCards)
    } else {
      setShowSelector(false)
      if (onComplete) onComplete(selectedCards)
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
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ position: 'absolute', inset: 0, cursor: 'default' }} />
      
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        width: '100%',
        maxWidth: '480px'
      }}>
        <div style={{ 
          width: '100%',
          maxHeight: '85vh',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ height: '4px', background: '#003580', position: 'absolute', top: 0, left: 0, right: 0 }} />
          
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
              zIndex: 10
            }}
          >
            X
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                {showSelectedOnly && confirmedCards.length > 0 ? 'My Cards' : 'Select Cards'}
              </h2>
              {confirmedCards.length > 0 && (
                <span style={{
                  background: '#0066FF',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  padding: '4px 12px',
                  borderRadius: '16px'
                }}>
                  {confirmedCards.length} selected
                </span>
              )}
            </div>
            {(selectedCards.length > 0 || confirmedCards.length > 0) && (
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button
                  onClick={handleClearAll}
                  type="button"
                  style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
            {confirmedCards.length > 0 ? 'Please confirm your selection' : 'Select cards for recommendations'}
          </p>

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
                Selected {selectedCardDetails.length} cards
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
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            {loading && <div style={{ textAlign: 'center', color: '#64748B', fontSize: '14px' }}>Loading cards...</div>}
            {error && <div style={{ textAlign: 'center', color: '#DC2626', fontSize: '14px' }}>Error: {error}</div>}
          </div>

          <div style={{ flex: 1, overflow: 'auto', marginBottom: '20px' }}>
            {[...cards].sort((a, b) => {
              const hasConfirmed = confirmedCards.length > 0
              if (hasConfirmed) {
                const aConfirmed = confirmedCards.includes(a.id)
                const bConfirmed = confirmedCards.includes(b.id)
                if (aConfirmed && !bConfirmed) return -1
                if (!aConfirmed && bConfirmed) return 1
              }
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
                  justifyContent: 'space-between'
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
                  {selectedCards.includes(card.id) ? 'Y' : ''}
                </span>
              </button>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px',
            borderTop: '1px solid #E2E8F0'
          }}>
            <button 
              onClick={() => {
                if (externalShow !== undefined) {
                  if (onClose) {
                    onClose()
                  } else if (onComplete) {
                    onComplete(undefined)
                  }
                } else {
                  handleSkip()
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
                fontWeight: '600'
              }}
            >
              {selectedCards.length > 0 ? 'Cancel' : 'Skip'}
            </button>
          
            <button
              onClick={handleDone}
              type="button"
              disabled={selectedCards.length === 0}
              style={{
                background: selectedCards.length > 0 ? '#0066FF' : '#CBD5E1',
                color: 'white',
                padding: '14px 36px',
                borderRadius: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px'
              }}
            >
              {selectedCards.length > 0 ? 'Confirm (' + selectedCards.length + ')' : 'Select cards'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
