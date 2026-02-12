import { useState, useEffect } from 'react';
import { mockCards, formatCardName } from '../lib/userCards';

export default function CardSelector({ onComplete }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    // 檢查是否首次使用
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('hasSeenCardSelector');
      if (!hasSeen) {
        setShowSelector(true);
      } else {
        // 恢復已選的卡片
        const saved = localStorage.getItem('userCards');
        if (saved) {
          setSelectedCards(JSON.parse(saved));
        }
      }
    }
  }, []);

  const toggleCard = (cardId) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleSave = () => {
    localStorage.setItem('userCards', JSON.stringify(selectedCards));
    localStorage.setItem('hasSeenCardSelector', 'true');
    setShowSelector(false);
    if (onComplete) onComplete(selectedCards);
  };

  const handleSkip = () => {
    setShowSelector(false);
    if (onComplete) onComplete([]);
  };

  if (!showSelector) return null;

  return (
    <div className="card-selector-overlay">
      <div className="card-selector-modal">
        <div className="selector-header">
          <h2>💳 選擇你有的信用卡</h2>
          <p>幫你推薦最適合嘅回贈組合</p>
        </div>

        <div className="card-list">
          {mockCards.map(card => (
            <div
              key={card.id}
              className={`card-option ${selectedCards.includes(card.id) ? 'selected' : ''}`}
              onClick={() => toggleCard(card.id)}
            >
              <div className="card-info">
                <span className="card-icon">{card.icon}</span>
                <div>
                  <div className="card-name">{formatCardName(card)}</div>
                  <div className="card-type">
                    {card.rebate_type === 'CASHBACK' ? '💵 現金回贈' : 
                     card.rebate_type === 'MILEAGE' ? '✈️ 飛行里數' : '🎁 積分'}
                  </div>
                </div>
              </div>
              <div className="card-check">
                {selectedCards.includes(card.id) ? '✅' : '⬜'}
              </div>
            </div>
          ))}
        </div>

        <div className="selector-footer">
          <div className="selected-count">
            已選擇 {selectedCards.length} 張卡
          </div>
          <div className="selector-buttons">
            <button onClick={handleSkip} className="skip-btn">
              暫時唔揀
            </button>
            <button 
              onClick={handleSave} 
              className="save-btn"
              disabled={selectedCards.length === 0}
            >
              確認選擇 ({selectedCards.length})
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .card-selector-modal {
          background: var(--card-bg, #FFFFFF);
          border-radius: 20px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .selector-header {
          padding: 24px;
          background: linear-gradient(135deg, #0066FF 0%, #00D4AA 100%);
          color: white;
          text-align: center;
        }

        .selector-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        .selector-header p {
          margin: 0;
          opacity: 0.9;
        }

        .card-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .card-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          margin-bottom: 8px;
          background: var(--background, #F8FAFC);
          border-radius: 12px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .card-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-option.selected {
          border-color: #0066FF;
          background: rgba(0, 102, 255, 0.05);
        }

        .card-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-icon {
          font-size: 32px;
        }

        .card-name {
          font-weight: 600;
          font-size: 16px;
        }

        .card-type {
          font-size: 12px;
          color: var(--text-secondary, #64748B);
          margin-top: 4px;
        }

        .card-check {
          font-size: 24px;
        }

        .selector-footer {
          padding: 20px;
          border-top: 1px solid var(--border-color, #E2E8F0);
        }

        .selected-count {
          text-align: center;
          margin-bottom: 16px;
          color: var(--text-secondary, #64748B);
        }

        .selector-buttons {
          display: flex;
          gap: 12px;
        }

        .skip-btn {
          flex: 1;
          padding: 16px;
          border: 2px solid var(--border-color, #E2E8F0);
          background: transparent;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary, #64748B);
        }

        .save-btn {
          flex: 2;
          padding: 16px;
          border: none;
          background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
          color: white;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
