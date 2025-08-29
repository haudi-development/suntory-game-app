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
  const [tableExists, setTableExists] = useState(true)
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
      setLoading(true)
      
      const { data, error } = await supabase
        .from('suntory_products')
        .select('*')
        .order('product_category', { ascending: true })
        .order('brand_name', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        
        // テーブルが存在しない場合
        if (error.message?.includes('relation') || 
            error.message?.includes('does not exist') ||
            error.code === '42P01') {
          setTableExists(false)
          toast.error('製品テーブルが存在しません。初期セットアップを実行してください。')
          return
        }
        
        // その他のエラー
        toast.error(`製品情報の取得に失敗しました: ${error.message}`)
        return
      }
      
      setProducts(data || [])
      setTableExists(true)
      
    } catch (error: any) {
      console.error('Unexpected error in fetchProducts:', error)
      toast.error(`予期しないエラー: ${error?.message || 'Unknown error'}`)
      setTableExists(false)
    } finally {
      setLoading(false)
    }
  }

  async function initializeProductTable() {
    try {
      setLoading(true)
      
      toast.info('製品テーブルを初期化中...')
      
      // まず既存のテーブルをチェック
      const { error: checkError } = await supabase
        .from('suntory_products')
        .select('count')
        .limit(1)
      
      if (!checkError) {
        // テーブルが既に存在する場合
        toast.info('テーブルは既に存在します。データを追加します。')
      } else {
        console.log('Table does not exist, will create via dashboard')
        toast.warning('テーブルが存在しません。Supabaseダッシュボードで手動で作成してください。')
        
        // テーブル作成のSQLを表示
        const createSQL = `
-- Supabase SQL Editorで以下のSQLを実行してください：

CREATE TABLE IF NOT EXISTS suntory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(255) NOT NULL UNIQUE,
  product_category VARCHAR(50) NOT NULL,
  product_line VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suntory_products_brand_name ON suntory_products(brand_name);
CREATE INDEX IF NOT EXISTS idx_suntory_products_category ON suntory_products(product_category);
CREATE INDEX IF NOT EXISTS idx_suntory_products_active ON suntory_products(is_active);
        `
        console.log(createSQL)
        
        // テーブル作成の指示を表示して、手動作成を促す
        return
      }

      // 初期データを投入
      const initialProducts = [
        // ビール
        { brand_name: 'ザ・プレミアム・モルツ', product_category: 'draft_beer', product_line: 'プレミアムモルツ' },
        { brand_name: 'ザ・プレミアム・モルツ マスターズドリーム', product_category: 'draft_beer', product_line: 'プレミアムモルツ' },
        { brand_name: '金麦', product_category: 'draft_beer', product_line: '金麦' },
        { brand_name: '金麦 糖質75%オフ', product_category: 'draft_beer', product_line: '金麦' },
        { brand_name: 'モルツ', product_category: 'draft_beer', product_line: 'モルツ' },
        // ハイボール
        { brand_name: '角ハイボール', product_category: 'highball', product_line: '角' },
        { brand_name: '角ハイボール 濃いめ', product_category: 'highball', product_line: '角' },
        { brand_name: 'トリスハイボール', product_category: 'highball', product_line: 'トリス' },
        { brand_name: 'ジムビームハイボール', product_category: 'highball', product_line: 'ジムビーム' },
        // サワー
        { brand_name: 'こだわり酒場のレモンサワー', product_category: 'sour', product_line: 'こだわり酒場' },
        { brand_name: '-196℃ ストロングゼロ ダブルレモン', product_category: 'sour', product_line: '-196℃' },
        { brand_name: '-196℃ レモン', product_category: 'sour', product_line: '-196℃' },
        { brand_name: 'ほろよい 白いサワー', product_category: 'sour', product_line: 'ほろよい' },
        { brand_name: 'ほろよい もも', product_category: 'sour', product_line: 'ほろよい' },
        // ジン
        { brand_name: '翠', product_category: 'gin_soda', product_line: '翠' },
        { brand_name: '翠ジンソーダ', product_category: 'gin_soda', product_line: '翠' },
        // ノンアル
        { brand_name: 'オールフリー', product_category: 'non_alcohol', product_line: 'オールフリー' },
        { brand_name: 'のんある気分', product_category: 'non_alcohol', product_line: 'のんある気分' },
        // 水・茶
        { brand_name: 'サントリー天然水', product_category: 'water', product_line: '天然水' },
        { brand_name: '伊右衛門', product_category: 'water', product_line: '伊右衛門' },
        { brand_name: '伊右衛門 特茶', product_category: 'water', product_line: '伊右衛門' },
        { brand_name: 'サントリー烏龍茶', product_category: 'water', product_line: '烏龍茶' },
        // ソフトドリンク
        { brand_name: 'BOSS', product_category: 'softdrink', product_line: 'BOSS' },
        { brand_name: 'BOSS 無糖ブラック', product_category: 'softdrink', product_line: 'BOSS' },
        { brand_name: 'クラフトボス', product_category: 'softdrink', product_line: 'BOSS' },
        { brand_name: 'C.C.レモン', product_category: 'softdrink', product_line: 'C.C.レモン' },
        { brand_name: 'ペプシコーラ', product_category: 'softdrink', product_line: 'ペプシ' },
        { brand_name: 'デカビタC', product_category: 'softdrink', product_line: 'デカビタ' },
        { brand_name: 'なっちゃん', product_category: 'softdrink', product_line: 'なっちゃん' }
      ]

      // データ投入
      const { error: insertError } = await supabase
        .from('suntory_products')
        .upsert(initialProducts, { onConflict: 'brand_name' })

      if (insertError) {
        console.error('Insert error:', insertError)
        toast.error('初期データの投入に失敗しました')
      } else {
        toast.success('製品テーブルを初期化しました')
        setTableExists(true)
        fetchProducts()
      }
    } catch (error) {
      console.error('Initialization error:', error)
      toast.error('テーブルの初期化に失敗しました')
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

  // テーブルが存在しない場合のセットアップ画面
  if (!tableExists) {
    return (
      <div className="p-6">
        <Toaster position="top-center" />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-6">
              <Package className="mx-auto text-gray-400 mb-4" size={64} />
              <h2 className="text-2xl font-bold mb-4">製品テーブルの初期セットアップ</h2>
              <p className="text-gray-600">
                製品テーブルがまだ作成されていません。
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">方法1: 自動セットアップ（推奨）</h3>
              <button
                onClick={initializeProductTable}
                className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark"
              >
                テーブルを初期化
              </button>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">方法2: 手動セットアップ（Supabase SQL Editor）</h3>
              <p className="text-sm text-gray-600 mb-3">
                下記のSQLをSupabaseのSQL Editorで実行してください：
              </p>
              <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono">
{`CREATE TABLE IF NOT EXISTS suntory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(255) NOT NULL UNIQUE,
  product_category VARCHAR(50) NOT NULL,
  product_line VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suntory_products_brand_name ON suntory_products(brand_name);
CREATE INDEX idx_suntory_products_category ON suntory_products(product_category);
CREATE INDEX idx_suntory_products_active ON suntory_products(is_active);`}
                </pre>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS suntory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(255) NOT NULL UNIQUE,
  product_category VARCHAR(50) NOT NULL,
  product_line VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suntory_products_brand_name ON suntory_products(brand_name);
CREATE INDEX idx_suntory_products_category ON suntory_products(product_category);
CREATE INDEX idx_suntory_products_active ON suntory_products(is_active);`)
                  toast.success('SQLをクリップボードにコピーしました')
                }}
                className="mt-3 text-sm text-primary hover:underline"
              >
                SQLをコピー
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">製品管理</h1>
          <p className="text-gray-600 mt-2">サントリー製品の管理</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center gap-2"
        >
          <Plus size={20} />
          製品を追加
        </button>
      </div>

      <div>
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
      </div>

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