import { useState, useEffect } from 'react';
import Head from 'next/head';
import CardSelector from '../components/CardSelector';
import Header from './components/Header';
import Hero from './components/Hero';
import ExpenseInput from './components/ExpenseInput';
import ExpenseList from './components/ExpenseList';
import ResultCard from './components/ResultCard';
import Footer from './components/Footer';
import { mockCards, getUserCards } from '../lib/userCards';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // 初始化時載入用戶已選卡片
  useEffect(() => {
    setUserCards(getUserCards());
  }, []);

  // 商戶類別選項
  const categories = [
    { id: 1, name: '餐飲美食', icon: '🍜' },
    { id: 2, name: '網上購物', icon: '🛒' },
    { id: 3, name: '超市便利店', icon: '🏪' },
    { id: 4, name: '交通出行', icon: '🚗' },
    { id: 5, name: '娛樂休閒', icon: '🎬' },
    { id: 6, name: '旅遊外遊', icon: '✈️' },
    { id: 7, name: '服飾美容', icon: '👗' },
    { id: 8, name: '公用事業', icon: '💡' },
  ];

  // 新增多筆消費
  function addExpense() {
    if (!amount || !selectedCategory) return;
    
    const expense = {
      id: Date.now(),
      categoryId: selectedCategory,
      categoryName: categories.find(c => c.id.toString() === selectedCategory.toString())?.name || '其他',
      categoryIcon: categories.find(c => c.id.toString() === selectedCategory.toString())?.icon || '💳',
      merchantName: selectedMerchant?.name || null,
      amount: parseFloat(amount),
    };
    
    setExpenses([...expenses, expense]);
    setAmount('');
    setSelectedCategory('');
    setSelectedMerchant(null);
  }

  // 移除消費
  function removeExpense(id) {
    setExpenses(expenses.filter(e => e.id !== id));
  }

  // 計算最佳組合
  function calculateBestCombination() {
    if (expenses.length === 0) return;
    
    setLoading(true);
    
    // 模擬計算
    setTimeout(() => {
      const results = expenses.map(expense => {
        // 根據用戶已選卡片計算
        let availableCards = mockCards;
        if (userCards.length > 0) {
          availableCards = mockCards.filter(card => userCards.includes(card.id));
        }
        
        if (availableCards.length === 0) {
          availableCards = mockCards;
        }
        
        const bestCard = availableCards.reduce((best, card) => {
          const currentRebate = expense.amount * card.base_rate;
          const bestRebate = expense.amount * best.base_rate;
          return currentRebate > bestRebate ? card : best;
        });
        
        return {
          ...expense,
          bestCard,
          rebate: expense.amount * bestCard.base_rate,
        };
      });
      
      setLoading(false);
      setResults(results);
    }, 1000);
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRebate = results.reduce((sum, r) => sum + r.rebate, 0);

  return (
    <>
      <Head>
        <title>💳 香港信用卡回贈計算器</title>
        <meta name="description" content="找出最適合你的信用卡回贈" />
        <meta name="theme-color" content={darkMode ? '#1a1a2e' : '#0066FF'} />
      </Head>

      <CardSelector onComplete={(cards) => setUserCards(cards)} />

      <div className={darkMode ? 'dark' : ''}>
        <Header 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          userCards={userCards}
          onOpenCardSelector={() => setShowCardSelector(true)}
        />

        <Hero userCards={userCards} />

        <div className="container">
          <ExpenseInput 
            amount={amount}
            setAmount={setAmount}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            onAdd={addExpense}
            disabled={!amount || !selectedCategory}
            selectedMerchant={selectedMerchant}
            setSelectedMerchant={setSelectedMerchant}
          />

          <ExpenseList 
            expenses={expenses}
            onRemove={removeExpense}
            totalAmount={totalAmount}
          />

          {/* 計算按鈕 */}
          {expenses.length > 0 && (
            <button
              onClick={calculateBestCombination}
              disabled={loading}
              className="btn-primary calculate-btn"
              style={{ marginTop: '16px', marginBottom: '40px' }}
            >
              {loading ? '計算緊...' : '🔥 計算最佳組合'}
            </button>
          )}

          <ResultCard 
            results={results}
            totalAmount={totalAmount}
            totalRebate={totalRebate}
            onReset={() => { setResults([]); setExpenses([]); }}
          />

          <Footer />
        </div>
      </div>

      {/* Card Selector Modal */}
      {showCardSelector && (
        <CardSelector 
          onComplete={(cards) => {
            setUserCards(cards);
            setShowCardSelector(false);
          }} 
        />
      )}

      <style jsx global>{`
        :root {
          --primary: #0066FF;
          --secondary: #00D4AA;
          --accent: #FF6B6B;
          --background: #F8FAFC;
          --card-bg: #FFFFFF;
          --text-primary: #1E293B;
          --text-secondary: #64748B;
          --border-color: #E2E8F0;
        }

        .dark {
          --background: #1a1a2e;
          --card-bg: #16213e;
          --text-primary: #F8FAFC;
          --text-secondary: #94A3B8;
          --border-color: #334155;
        }

        body {
          background: var(--background);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          transition: background-color 0.3s, color 0.3s;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .result-card {
          background: var(--card-bg);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary) 0%, #0052CC 100%);
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .calculate-btn {
          width: 100%;
        }

        .btn-secondary {
          background: var(--card-bg);
          color: var(--primary);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          border: 2px solid var(--primary);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-secondary:hover {
          background: var(--primary);
          color: white;
        }

        .input-field {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 16px;
          transition: border-color 0.2s;
          background: var(--card-bg);
          color: var(--text-primary);
          box-sizing: border-box;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--primary);
        }

        .input-field option {
          background: var(--card-bg);
        }

        .hero {
          text-align: center;
          padding: 48px 24px;
          background: linear-gradient(135deg, #0066FF 0%, #00D4AA 100%);
          color: white;
          border-radius: 24px;
          margin-bottom: 40px;
        }

        .hero h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .hero p {
          font-size: 18px;
          opacity: 0.9;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          margin-bottom: 32px;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }
          
          .card {
            padding: 20px;
          }
          
          .hero {
            padding: 32px 16px;
          }
          
          .hero h1 {
            font-size: 28px;
          }
        }

        .calculator-card {
          max-width: 100%;
        }
      `}</style>
    </>
  );
}
