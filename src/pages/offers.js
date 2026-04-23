import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import OfferCard from '../components/offers/OfferCard'

const BANKS = [
  { id: '', name: '全部' },
  { id: '1', name: 'HSBC' },
  { id: '2', name: 'Hang Seng' },
  { id: '3', name: 'BOC' },
  { id: '4', name: 'SC' }
]

const CATEGORIES = [
  { id: '', name: '全部' },
  { id: '1', name: '餐飲' },
  { id: '2', name: '購物' },
  { id: '3', name: '旅遊' },
  { id: '4', name: '超市' }
]

const SORTS = [
  { id: 'default', name: '預設' },
  { id: 'value', name: '回贈最高' },
  { id: 'newest', name: '最新' }
]

function formatOffer(offer) {
  if (!offer) return ''
  if (offer.value_type === 'PERCENT') {
    return `${offer.value}% 回贈`
  }
  if (offer.value_type === 'FIXED') {
    if (offer.min_spend) {
      return `滿 $${offer.min_spend} 送 $${offer.value} 優惠券`
    }
    return `$${offer.value} 優惠`
  }
  return offer.offer_type || '優惠'
}

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [bankId, setBankId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sort, setSort] = useState('default')

  useEffect(() => {
    fetchOffers()
  }, [q, bankId, categoryId, sort])

  async function fetchOffers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (bankId) params.set('bank_id', bankId)
    if (categoryId) params.set('category_id', categoryId)
    params.set('limit', '30')
    
    try {
      const res = await fetch(`/api/offers?${params}`)
      const data = await res.json()
      let items = data.data || []
      
      // Sort
      if (sort === 'value') {
        items = items.sort((a, b) => (b.value || 0) - (a.value || 0))
      }
      
      setOffers(items)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const bankChipStyle = (id) => ({
    ...styles.chip,
    ...(bankId === id ? styles.chipActive : {})
  })

  const catChipStyle = (id) => ({
    ...styles.chip,
    ...(categoryId === id ? styles.chipActive : {})
  })

  return (
    <div style={styles.container}>
      <Head><title>優惠搜尋 - CreditRebateCalculator</title></Head>
      
      <header style={styles.header}>
        <Link href="/" style={styles.homeLink}>← 首頁</Link>
        <h1 style={styles.title}>優惠搜尋</h1>
      </header>
      
      {/* Search */}
      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="搜尋商戶或優惠..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={styles.input}
        />
      </div>
      
      {/* Bank Chips */}
      <div style={styles.chipRow}>
        {BANKS.map(b => (
          <button key={b.id} onClick={() => setBankId(b.id)} style={bankChipStyle(b.id)}>
            {b.name}
          </button>
        ))}
      </div>
      
      {/* Category Chips */}
      <div style={styles.chipRow}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategoryId(c.id)} style={catChipStyle(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      
      {/* Sort + Count */}
      <div style={styles.meta}>
        <span style={styles.count}>找到 {offers.length} 個優惠</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={styles.sort}>
          {SORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      
      {/* Results */}
      <div style={styles.results}>
        {loading && <p style={styles.state}>載入中...</p>}
        {error && <p style={styles.error}>{error}</p>}
        {!loading && !error && offers.length === 0 && (
          <p style={styles.state}>暫時未有相關優惠</p>
        )}
        {!loading && offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} formatOffer={formatOffer} />
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '16px' },
  homeLink: { display: 'inline-block', marginBottom: '8px', color: '#666', textDecoration: 'none' },
  title: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
  searchBox: { marginBottom: '12px' },
  input: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd' },
  chipRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
  chip: { padding: '6px 14px', fontSize: '14px', borderRadius: '16px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' },
  chipActive: { backgroundColor: '#d00', color: '#fff', borderColor: '#d00' },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  count: { fontSize: '14px', color: '#666' },
  sort: { padding: '6px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' },
  results: { minHeight: '150px' },
  state: { textAlign: 'center', color: '#999', padding: '30px 0' },
  error: { color: 'red', textAlign: 'center', padding: '30px 0' }
}
