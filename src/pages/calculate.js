import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getCardName, getCardBank } from '../services/cardNames'

const MERCHANTS = [
  { id: '', name: '其他' },
  { id: '1', name: '啟德廣場' },
  { id: '2', name: '壽司郎' },
  { id: '3', name: '時代廣場' },
  { id: '4', name: '超市' }
]

const CATEGORIES = [
  { id: '', name: '全部' },
  { id: '1', name: '餐飲' },
  { id: '2', name: '購物' },
  { id: '3', name: '旅遊' },
  { id: '4', name: '超市' }
]

export default function Calculate() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Auto-run if URL has params
  useEffect(() => {
    const { amount: a, category_id: c, merchant_id: m } = router.query
    if (a) setAmount(a)
    if (c) setCategoryId(c)
    if (m) setMerchantId(m)
    if (a || c || m) {
      handleCalculate()
    }
  }, [router.query])

  const handleCalculate = async () => {
    if (!amount || amount <= 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          merchant_id: merchantId ? parseInt(merchantId) : null,
          category_id: categoryId ? parseInt(categoryId) : null
        })
      })
      const data = await res.json()
      if (data.success) setResult(data)
      else setError(data.error || '計算失敗')
    } catch (e) {
      setError('計算失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const best = result?.results?.[0]
  const second = result?.results?.[1]
  const cardName = getCardName(result?.best_card_id)
  const cardBank = getCardBank(result?.best_card_id)
  const effectiveRate = best && amount > 0 ? ((best.total_value / amount) * 100).toFixed(1) : null
  const diff = best && second ? best.total_value - second.total_value : null

  return (
    <div style={styles.container}>
      <Head><title>最佳回贈計算 - CreditRebateCalculator</title></Head>
      
      <header style={styles.header}>
        <Link href="/" style={styles.homeLink}>← 首頁</Link>
        <h1 style={styles.title}>最佳回贈計算</h1>
      </header>
      
      {!result && !loading && !error && (
        <div style={styles.hint}>試試以下熱門情境，快速查看最抵信用卡</div>
      )}
      
      <div style={styles.inputSection}>
        <div style={styles.field}>
          <label style={styles.label}>消費金額</label>
          <input type="number" placeholder="$0" value={amount} onChange={(e) => setAmount(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>商戶</label>
          <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} style={styles.select}>
            {MERCHANTS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>類別</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.select}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={handleCalculate} disabled={loading} style={styles.button}>
          {loading ? '計算中...' : '計算最抵卡'}
        </button>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {result && best && (
        <div style={styles.result}>
          <div style={styles.bestCard}>
            <div style={styles.bestLabel}>🏆 最抵信用卡</div>
            <div style={styles.bestName}>{cardName}</div>
            {cardBank && <div style={styles.bestBank}>{cardBank}</div>}
            <div style={styles.bestValue}>💰 總回贈：${best.total_value}</div>
            {effectiveRate && <div style={styles.rate}>回贈率：約 {effectiveRate}%</div>}
            {diff && diff > 0 && <div style={styles.insight}>比第二名多賺 ${diff}</div>}
          </div>
          
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📊 回贈詳情</h3>
            {best.breakdown?.base_reward > 0 && <div style={styles.breakdown}><span>基本回贈</span><span>${best.breakdown.base_reward}</span></div>}
            {best.breakdown?.offer_reward > 0 && <div style={styles.breakdown}><span>優惠回贈</span><span>${best.breakdown.offer_reward}</span></div>}
          </div>
          
          {result.results?.length > 1 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>其他選擇</h3>
              {result.results.slice(1, 5).map((r, i) => (
                <div key={i} style={styles.otherCard}>{getCardName(r.card_id)} — ${r.total_value}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '480px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '16px' },
  homeLink: { display: 'inline-block', marginBottom: '8px', color: '#666', textDecoration: 'none' },
  title: { fontSize: '22px', fontWeight: 'bold', margin: 0 },
  hint: { textAlign: 'center', color: '#999', padding: '20px 0', fontSize: '15px', marginBottom: '8px' },
  inputSection: { backgroundColor: '#f8f8f8', padding: '16px', borderRadius: '10px', marginBottom: '16px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#333' },
  input: { width: '100%', padding: '12px', fontSize: '18px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', fontSize: '15px', borderRadius: '6px', border: '1px solid #ddd' },
  button: { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#d00', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center', padding: '12px', backgroundColor: '#fee', borderRadius: '6px', marginBottom: '16px' },
  result: { backgroundColor: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #eee' },
  bestCard: { textAlign: 'center', padding: '20px', backgroundColor: '#d00', color: '#fff', borderRadius: '10px', marginBottom: '16px' },
  bestLabel: { fontSize: '14px', marginBottom: '4px' },
  bestName: { fontSize: '26px', fontWeight: 'bold' },
  bestBank: { fontSize: '14px', marginTop: '4px' },
  bestValue: { fontSize: '20px', marginTop: '12px' },
  rate: { fontSize: '14px', marginTop: '6px' },
  insight: { fontSize: '14px', marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px' },
  section: { marginBottom: '14px' },
  sectionTitle: { fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px 0' },
  breakdown: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' },
  otherCard: { padding: '8px 0', fontSize: '14px', color: '#666' }
}
