/**
 * Search 優惠 Page
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import OfferCard from '../components/offers/OfferCard'

const BANKS = [
  { id: '', name: 'All' },
  { id: '1', name: 'HSBC' },
  { id: '2', name: 'Hang Seng' },
  { id: '3', name: 'BOC' },
  { id: '4', name: 'Standard Chartered' }
]

const CATEGORIES = [
  { id: '', name: 'All' },
  { id: '1', name: 'Dining 餐飲' },
  { id: '2', name: 'Shopping 購物' },
  { id: '3', name: 'Travel 旅遊' },
  { id: '4', name: 'Supermarket 超市' }
]

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [bank_id, setBankId] = useState('')
  const [category_id, setCategoryId] = useState('')

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (bank_id) params.set('bank_id', bank_id)
        if (category_id) params.set('category_id', category_id)
        params.set('limit', '20')
        
        const res = await fetch(`/api/offers?${params}`)
        const data = await res.json()
        
        if (data.success) {
          setOffers(data.data || [])
        } else {
          setError(data.error || 'Unknown error')
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOffers()
  }, [q, bank_id, category_id])

  return (
    <div style={styles.container}>
      <Head>
        <title>Search 優惠 - CreditRebateCalculator</title>
      </Head>
      
      {/* Header */}
      <header style={styles.header}>
        <Link href="/" style={styles.homeLink}>← Home</Link>
        <h1 style={styles.title}>Search 優惠</h1>
        <p style={styles.subtitle}>比較最新信用卡優惠</p>
      </header>
      
      {/* Search Bar */}
      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="搜尋商戶或優惠（例如：壽司郎 / 超市 / cashback）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={styles.input}
        />
      </div>
      
      {/* Filters */}
      <div style={styles.filters}>
        <select value={bank_id} onChange={(e) => setBankId(e.target.value)} style={styles.select}>
          {BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        
        <select value={category_id} onChange={(e) => setCategoryId(e.target.value)} style={styles.select}>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        {q && <span style={styles.clear} onClick={() => setQ('')}>清除搜尋</span>}
      </div>
      
      {/* Results */}
      <div style={styles.results}>
        {loading && <p style={styles.state}>Loading offers...</p>}
        {error && <p style={styles.error}>錯誤: {error}</p>}
        {!loading && !error && offers.length === 0 && (
          <p style={styles.state}>暫時未有相關優惠</p>
        )}
        {!loading && !error && offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
      
      {/* Count */}
      {!loading && !error && (
        <p style={styles.count}>找到 {offers.length} 個優惠</p>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '24px' },
  homeLink: { display: 'inline-block', marginBottom: '8px', color: '#666', textDecoration: 'none' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#666', margin: 0 },
  searchBox: { marginBottom: '16px' },
  input: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd' },
  filters: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  select: { padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' },
  clear: { padding: '8px', color: '#d00', cursor: 'pointer', fontSize: '14px' },
  results: { minHeight: '200px' },
  state: { textAlign: 'center', color: '#666', padding: '40px 0' },
  error: { color: 'red', textAlign: 'center', padding: '40px 0' },
  count: { textAlign: 'center', color: '#999', fontSize: '14px', marginTop: '16px' }
}
