/**
 * 最佳回贈計算 - Calculator UI v1
 */

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const MERCHANTS = [
  { id: '', name: '其他 / Other' },
  { id: '1', name: 'Kai Tai Mall 啟德廣場' },
  { id: '2', name: '壽司郎 Sushiro' },
  { id: '3', name: '時代廣場 Times Square' },
  { id: '4', name: '超市 Supermarket' }
]

const CATEGORIES = [
  { id: '', name: '全部 / All' },
  { id: '1', name: '餐飲 Dining' },
  { id: '2', name: '購物 Shopping' },
  { id: '3', name: '旅遊 Travel' },
  { id: '4', name: '超市 Supermarket' }
]

export default function Calculate() {
  const [amount, setAmount] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleCalculate = async () => {
    if (!amount || amount <= 0) {
      setError('請輸入金額')
      return
    }
    
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
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || '計算失敗')
      }
    } catch (e) {
      setError('計算失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <Head>
        <title>最佳回贈計算 - CreditRebateCalculator</title>
      </Head>
      
      {/* Header */}
      <header style={styles.header}>
        <Link href="/" style={styles.homeLink}>← Home</Link>
        <h1 style={styles.title}>最佳回贈計算</h1>
        <p style={styles.subtitle}>輸入消費，找出最抵信用卡</p>
      </header>
      
      {/* Input Section */}
      <div style={styles.inputSection}>
        <div style={styles.field}>
          <label style={styles.label}>消費金額</label>
          <input
            type="number"
            placeholder="輸入金額（例如：500）"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
          />
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
      
      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}
      
      {/* Result */}
      {result && (
        <div style={styles.result}>
          {/* Best Card */}
          {result.best_card_id && (
            <div style={styles.bestCard}>
              <div style={styles.bestLabel}>🏆 最抵</div>
              <div style={styles.bestAmount}>卡 #{result.best_card_id}</div>
              <div style={styles.bestValue}>
                總回贈：${result.results?.[0]?.total_value || 0}
              </div>
            </div>
          )}
          
          {/* Breakdown */}
          {result.results?.[0] && (
            <div style={styles.breakdown}>
              <h3 style={styles.sectionTitle}>📊 Breakdown</h3>
              <div style={styles.breakdownRow}>
                <span>基本回贈：</span>
                <span>${result.results[0].breakdown?.base_reward || 0}</span>
              </div>
              <div style={styles.breakdownRow}>
                <span>優惠回贈：</span>
                <span>${result.results[0].breakdown?.offer_reward || 0}</span>
              </div>
            </div>
          )}
          
          {/* Details */}
          {result.results?.[0]?.details?.length > 0 && (
            <div style={styles.details}>
              <h3 style={styles.sectionTitle}>📋 Details</h3>
              {result.results[0].details.map((d, i) => (
                <div key={i} style={styles.detailItem}>
                  • {d.type === 'reward_rule' ? '基本回贈' : '優惠'}：${d.value}
                </div>
              ))}
            </div>
          )}
          
          {/* Other Cards */}
          {result.results?.length > 1 && (
            <div style={styles.otherCards}>
              <h3 style={styles.sectionTitle}>其他卡片</h3>
              {result.results.slice(1, 5).map((r, i) => (
                <div key={i} style={styles.otherCard}>
                  卡 #{r.card_id} → ${r.total_value}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '24px' },
  homeLink: { display: 'inline-block', marginBottom: '8px', color: '#666', textDecoration: 'none' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0 },
  inputSection: { backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '16px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' },
  input: { width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' },
  select: { width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' },
  button: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#d00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center', padding: '12px', backgroundColor: '#fee', borderRadius: '4px', marginBottom: '16px' },
  result: { backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #ddd' },
  bestCard: { textAlign: 'center', padding: '16px', backgroundColor: '#d00', color: '#fff', borderRadius: '8px', marginBottom: '16px' },
  bestLabel: { fontSize: '14px' },
  bestAmount: { fontSize: '20px', fontWeight: 'bold' },
  bestValue: { fontSize: '18px', marginTop: '8px' },
  breakdown: { marginBottom: '16px' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
  details: { marginBottom: '16px' },
  detailItem: { padding: '4px 0', fontSize: '14px' },
  otherCards: { borderTop: '1px solid #eee', paddingTop: '16px' },
  otherCard: { padding: '8px 0', fontSize: '14px', color: '#666' }
}
