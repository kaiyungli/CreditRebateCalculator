import { useState, useEffect } from 'react'

export default function MerchantRatesDisplay({ userCards = [], selectedCategory, categories = [], onSelectMerchant }) {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchRates() {
      if (!selectedCategory) {
        setRates([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append('category_id', selectedCategory)
        
        // If user has selected cards, filter by those cards
        if (userCards.length > 0) {
          params.append('card_ids', userCards.join(','))
        }

        const res = await fetch(`/api/merchant-rates?${params.toString()}`)
        const data = await res.json()

        if (data.error) {
          setError(data.error)
        } else {
          setRates(data.merchantRates || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [selectedCategory, userCards.join(',')])

  if (!selectedCategory) {
    return null
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        載入中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        載入失敗: {error}
      </div>
    )
  }

  if (rates.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        暫時未有該類別的商戶回贈資料
      </div>
    )
  }

  // Group by merchant
  const groupedRates = {}
  for (const rate of rates) {
    if (!groupedRates[rate.merchant_name]) {
      groupedRates[rate.merchant_name] = []
    }
    groupedRates[rate.merchant_name].push(rate)
  }

  const categoryName = categories.find(c => c.id === selectedCategory)?.name || ''

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        {categoryName} 信用卡回贈
      </h3>
      
      {Object.entries(groupedRates).map(([merchant, merchantRates]) => (
        <div key={merchant} className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">{merchant}</h4>
          <div className="space-y-2">
            {merchantRates.map((rate, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {rate.card_name || `Card #${rate.card_id}`}
                </span>
                <span className="font-semibold text-green-600">
                  {rate.rebate_rate ? (rate.rebate_rate * 100).toFixed(1) + "%" : "-"}%
                  {rate.conditions && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({rate.conditions})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
