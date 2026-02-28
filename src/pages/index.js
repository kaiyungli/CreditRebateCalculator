import { useState, useEffect } from 'react';
import Head from 'next/head';
import CardSelector from '../components/CardSelector';
import Header from './components/Header';
import Hero from './components/Hero';
import ExpenseInput from './components/ExpenseInput';
import ExpenseList from './components/ExpenseList';
import ResultCard from './components/ResultCard';
import Footer from './components/Footer';
import MerchantRatesDisplay from './components/MerchantRatesDisplay';
import { getUserCards, saveUserCards } from '../lib/userCards';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [showAllCards, setShowAllCards] = useState(false);
  const [previewRebate, setPreviewRebate] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [breakdown, setBreakdown] = useState({ cashback: 0, miles: 0, points: 0 });

  // Categories state
  const [dbCategories, setDbCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化時載入用戶已選卡片和 categories
  useEffect(() => {
    // 恢復已選的卡片（確保只存 ID 格式）
    const saved = getUserCards();
    const ids = (saved || [])
      .map(c => (typeof c === 'object' && c !== null ? c.id : c))
      .map(Number)
      .filter(Number.isFinite);
    setUserCards(ids);
    
    // 從 API 載入 categories
    async function loadCategories() {
      setCategoriesLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
          setDbCategories(data.categories);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error('載入 categories 失敗:', err);
        setError('無法載入分類，請刷新頁面重試');
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Fallback categories in case API fails
  const FALLBACK_CATEGORIES = [
    { id: 1, name: '餐飲美食', icon: '🍜' },
    { id: 2, name: '網上購物', icon: '🛒' },
    { id: 3, name: '超市便利店', icon: '🏪' },
    { id: 4, name: '交通出行', icon: '🚗' },
    { id: 5, name: '娛樂休閒', icon: '🎬' },
    { id: 6, name: '服飾美容', icon: '👗' },
    { id: 7, name: '旅遊外遊', icon: '✈️' },
    { id: 8, name: '水電煤氣', icon: '💡' },
    { id: 9, name: '其他消費', icon: '💳' },
  ];

  const categories = dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES;

  // 即時回贈預覽計算
  useEffect(() => {
    async function calculatePreview() {
      if (!amount || !selectedCategory || parseFloat(amount) <= 0) {
        setPreviewRebate(0);
        return;
      }

      const amountNum = parseFloat(amount);
      const categoryId = parseInt(selectedCategory);
      const userCardIds = userCards.map(card => typeof card === 'object' ? card.id : card);

      if (userCardIds.length === 0) {
        setPreviewRebate(0);
        return;
      }

      try {
        const response = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ amount: amountNum, category_id: categoryId, merchant_key: selectedMerchant?.merchant_key || null }],
            userCardIds,
            valuation: { MILES: 0.05, POINTS: 0.01 }
          })
        });
        
        const data = await response.json();
        if (data.ok && data.plan && data.plan.length > 0) {
          setPreviewRebate(data.plan[0].rewardHKD || 0);
        } else {
          setPreviewRebate(0);
        }
      } catch (err) {
        console.error('預覽計算失敗:', err);
        setPreviewRebate(0);
      }
    }

    calculatePreview();
  }, [amount, selectedCategory, userCards, selectedMerchant]);

  // 新增多筆消費
  function addExpense() {
    // 驗證輸入
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('請輸入有效的消費金額');
      return;
    }
    
    if (!selectedCategory) {
      alert('請選擇消費類別');
      return;
    }
    
    const expense = {
      id: Date.now(),
      categoryId: selectedCategory,
      categoryName: categories.find(c => c.id.toString() === selectedCategory.toString())?.name || '其他',
      categoryIcon: categories.find(c => c.id.toString() === selectedCategory.toString())?.icon || '💳',
      merchantKey: selectedMerchant?.merchant_key || null,
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

  // 更新消費
  function updateExpense(updatedExpense) {
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  }

  // 重新排序消費
  function reorderExpenses(newExpenses) {
    setExpenses(newExpenses);
  }

  // 選擇商戶時自動設定分類
  function handleSelectMerchant(merchant) {
    if (merchant && merchant.default_category_id) {
      setSelectedCategory(merchant.default_category_id.toString());
    }
  }

  // 計算最佳組合
  async function calculateBestCombination() {
    if (expenses.length === 0) return;
    
    setLoading(true);
    
    try {
      // Transform expenses to items format
      const items = expenses.map(exp => ({
        amount: exp.amount,
        merchant_key: exp.merchantKey || null,
        category_id: exp.categoryId ? parseInt(exp.categoryId) : null,
      }));

      // Transform userCards to userCardIds (array of IDs)
      const userCardIds = userCards.map(card => 
        typeof card === 'object' ? card.id : card
      );

      // 從 API 獲取最佳卡片
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items,
          userCardIds: userCardIds.length > 0 ? userCardIds : undefined,
          valuation: {
            MILES: 0.05,  // 每里 HKD 價值，可由用戶調整
            POINTS: 0.01  // 每分 HKD 價值
          }
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Transform API response to display format
        const displayResults = data.plan.map((p, idx) => ({
          id: expenses[p.item.idx]?.id || idx,
          categoryId: p.item.category_id,
          categoryName: categories.find(c => c.id === p.item.category_id)?.name || '其他',
          categoryIcon: categories.find(c => c.id === p.item.category_id)?.icon || '💳',
          merchantName: p.item.merchant_key || null,
          amount: p.item.amount,
          bestCard: p.card ? {
            id: p.card.id,
            name: p.card.name,
            bankName: p.card.bank_name || '',
            rewardProgram: p.card.reward_program,
            icon: p.card.icon || '💳'
          } : null,
          ruleDetails: p.rule ? {
            rewardKind: p.rule.reward_kind,
            rateUnit: p.rule.rate_unit,
            rateValue: p.rule.rate_value,
            capValue: p.rule.cap_value,
            capPeriod: p.rule.cap_period,
            priority: p.rule.priority
          } : null,
          capInfo: p.capInfo || null,
          capNote: p.note || null,
          rebate: p.rewardHKD
        }));
        setResults(displayResults);
        // Set breakdown from API response
        if (data.breakdown) {
          setBreakdown(data.breakdown);
        }
      } else {
        console.error('API error:', data.error);
        setResults([]);
        setBreakdown({ cashback: 0, miles: 0, points: 0 });
      }
    } catch (error) {
      console.error('計算失敗:', error);
      setResults([]);
      setBreakdown({ cashback: 0, miles: 0, points: 0 });
    } finally {
      setLoading(false);
    }
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

      {/* 選擇信用卡按鈕 - 已移除，使用 Header 的按鈕 */}

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
            categoriesLoading={categoriesLoading}
            onAdd={addExpense}
            disabled={!amount || !selectedCategory || categoriesLoading}
            selectedMerchant={selectedMerchant}
            setSelectedMerchant={setSelectedMerchant}
            userCards={userCards}
          />

          {/* 即時回贈預覽 */}
          {amount && selectedCategory && parseFloat(amount) > 0 && userCards.length > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              background: 'linear-gradient(135deg, #00D4AA 0%, #00B894 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>預計回贈</div>
              <div style={{ fontSize: '24px', fontWeight: '800' }}>
                HK${previewRebate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {/* 商戶回贈比較 - 選擇信用卡同類別後顯示 */}
          {selectedCategory && (
            <div style={{ marginTop: '24px' }}>
              {/* Toggle: 只睇我既卡 / 睇全部卡 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '16px',
                gap: '12px'
              }}>
                <span style={{ 
                  fontSize: '14px',
                  color: !showAllCards ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                  只睇我既卡
                </span>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                  <input 
                    type="checkbox" 
                    checked={showAllCards}
                    onChange={(e) => setShowAllCards(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: showAllCards ? 'var(--primary)' : '#ccc',
                    borderRadius: '26px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: showAllCards ? '24px' : '3px',
                      bottom: '3px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }}></span>
                  </span>
                </label>
                <span style={{ 
                  fontSize: '14px',
                  color: showAllCards ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                  睇全部卡
                </span>
              </div>
              
              <MerchantRatesDisplay 
                userCards={showAllCards ? [] : userCards}
                selectedCategory={parseInt(selectedCategory)}
                categories={categories}
                onSelectMerchant={handleSelectMerchant}
                showAllCards={showAllCards}
                onToggleShowAllCards={() => setShowAllCards(!showAllCards)}
              />
            </div>
          )}

          <ExpenseList 
            expenses={expenses}
            onRemove={removeExpense}
            onUpdate={(expense, isReorder) => isReorder ? reorderExpenses(expense) : updateExpense(expense)}
            totalAmount={totalAmount}
            categories={categories}
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
            breakdown={breakdown}
            onReset={() => { setResults([]); setExpenses([]); setBreakdown({ cashback: 0, miles: 0, points: 0 }); }}
          />

          <Footer />
        </div>
      </div>

      {/* Card Selector Modal */}
      {showCardSelector && (
        <CardSelector 
          show={true}
          onClose={() => setShowCardSelector(false)}
          onComplete={(cards) => {
            // 只有當用户 confirm 先會 update cards
            // cards 係 undefined 表示用户 click 左 X 或 Cancel，呢啲情況唔 update
            if (cards !== undefined) {
              setUserCards(cards);
            }
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
