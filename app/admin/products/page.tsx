'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, Edit, Trash2, Package } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    brand_name: '',
    product_category: 'draft_beer',
    product_line: '',
    description: '',
    is_active: true
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchProducts()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  async function fetchProducts() {
    try {
      let query = supabase
        .from('suntory_products')
        .select('*')
        .order('product_category', { ascending: true })
        .order('brand_name', { ascending: true })

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('製品情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function addProduct() {
    try {
      const { error } = await supabase
        .from('suntory_products')
        .insert(formData)

      if (error) throw error

      toast.success('製品を追加しました')
      setShowAddModal(false)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      if (error?.message?.includes('duplicate')) {
        toast.error('この製品名は既に登録されています')
      } else {
        toast.error('製品の追加に失敗しました')
      }
      console.error('Error adding product:', error)
    }
  }

  async function updateProduct() {
    try {
      const { error } = await supabase
        .from('suntory_products')
        .update({
          brand_name: formData.brand_name,
          product_category: formData.product_category,
          product_line: formData.product_line,
          description: formData.description,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      toast.success('製品を更新しました')
      setShowEditModal(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      toast.error('製品の更新に失敗しました')
      console.error('Error updating product:', error)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('本当にこの製品を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('suntory_products')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('製品を削除しました')
      fetchProducts()
    } catch (error) {
      toast.error('製品の削除に失敗しました')
      console.error('Error deleting product:', error)
    }
  }

  function resetForm() {
    setFormData({
      brand_name: '',
      product_category: 'draft_beer',
      product_line: '',
      description: '',
      is_active: true
    })
    setEditingProduct(null)
  }

  const categories = [
    { value: 'all', label: 'すべて' },
    { value: 'draft_beer', label: 'ビール' },
    { value: 'highball', label: 'ハイボール' },
    { value: 'sour', label: 'サワー' },
    { value: 'gin_soda', label: 'ジン' },
    { value: 'non_alcohol', label: 'ノンアル' },
    { value: 'water', label: '水・茶' },
    { value: 'softdrink', label: 'ソフトドリンク' },
    { value: 'wine', label: 'ワイン' },
    { value: 'whisky', label: 'ウイスキー' }
  ]

  const categoryColors: Record<string, string> = {
    draft_beer: 'bg-yellow-100 text-yellow-800',
    highball: 'bg-amber-100 text-amber-800',
    sour: 'bg-lime-100 text-lime-800',
    gin_soda: 'bg-cyan-100 text-cyan-800',
    non_alcohol: 'bg-blue-100 text-blue-800',
    water: 'bg-sky-100 text-sky-800',
    softdrink: 'bg-orange-100 text-orange-800',
    wine: 'bg-purple-100 text-purple-800',
    whisky: 'bg-red-100 text-red-800'
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.product_line?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.product_category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />
      
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft size={20} />
                <span>戻る</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">サントリー製品管理</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center gap-2"
            >
              <Plus size={20} />
              製品を追加
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="製品名または商品ラインで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
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
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総製品数</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="text-primary" size={32} />
            </div>
          </div>
          {['draft_beer', 'highball', 'sour'].map(cat => {
            const count = products.filter(p => p.product_category === cat).length
            const label = categories.find(c => c.value === cat)?.label
            return (
              <div key={cat} className="bg-white rounded-lg shadow p-4">
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 製品リスト */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  製品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品ライン
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {product.brand_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[product.product_category]}`}>
                      {categories.find(c => c.value === product.product_category)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.product_line || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                          setFormData({
                            brand_name: product.brand_name,
                            product_category: product.product_category,
                            product_line: product.product_line || '',
                            description: product.description || '',
                            is_active: product.is_active
                          })
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* 追加/編集モーダル */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {showEditModal ? '製品を編集' : '製品を追加'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  製品名 *
                </label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="例: ザ・プレミアム・モルツ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリー *
                </label>
                <select
                  value={formData.product_category}
                  onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品ライン
                </label>
                <input
                  type="text"
                  value={formData.product_line}
                  onChange={(e) => setFormData({ ...formData, product_line: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="例: プレミアムモルツ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  有効
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  if (showEditModal) {
                    updateProduct()
                  } else {
                    addProduct()
                  }
                }}
                disabled={!formData.brand_name}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {showEditModal ? '更新' : '追加'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}