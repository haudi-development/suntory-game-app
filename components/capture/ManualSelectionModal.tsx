'use client'

import { useState, useEffect } from 'react'
import { X, Search, CheckCircle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'

interface ManualSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (product: any) => void
}

export default function ManualSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect 
}: ManualSelectionModalProps) {
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory, products])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('suntory_products')
        .select('*')
        .eq('is_active', true)
        .order('brand_name')

      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.english_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.product_type === selectedCategory)
    }

    setFilteredProducts(filtered)
  }

  const categories = [
    { value: 'all', label: 'すべて' },
    { value: 'draft_beer', label: 'ビール' },
    { value: 'highball', label: 'ハイボール' },
    { value: 'sour', label: 'サワー' },
    { value: 'gin_soda', label: 'ジン' },
    { value: 'non_alcohol', label: 'ノンアル' },
    { value: 'water', label: '水・茶' },
  ]

  const handleSelect = (product: any) => {
    const analysis = {
      brand_name: product.brand_name,
      product_type: product.product_type,
      volume_ml: 350, // デフォルト値
      quantity: 1,
      confidence: 1.0,
      is_suntory: true,
      manual_selection: true
    }
    onSelect(analysis)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold">商品を選択</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="商品名で検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[400px] p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-500">読み込み中...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">該当する商品が見つかりません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="p-4 border rounded-lg hover:bg-primary/5 hover:border-primary transition-all text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary">
                          {product.brand_name}
                        </h3>
                        {product.english_name && (
                          <p className="text-sm text-gray-500">
                            {product.english_name}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {categories.find(c => c.value === product.product_type)?.label}
                          </span>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {product.points_per_unit}pt
                          </span>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}