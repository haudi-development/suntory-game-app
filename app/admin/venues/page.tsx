'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { MapPin, Users, TrendingUp, Clock, Edit, Trash2, Plus, Search, Filter } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    category: 'restaurant',
    is_active: true,
    special_multiplier: 1.0,
    happy_hour_start: '17:00',
    happy_hour_end: '19:00',
    happy_hour_multiplier: 2.0
  })
  const supabase = createClient()

  useEffect(() => {
    fetchVenues()
  }, [])

  async function fetchVenues() {
    try {
      const { data } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false })
      
      setVenues(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('店舗データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingVenue) {
        const { error } = await supabase
          .from('venues')
          .update(formData)
          .eq('id', editingVenue.id)
        
        if (error) throw error
        toast.success('店舗情報を更新しました')
      } else {
        const { error } = await supabase
          .from('venues')
          .insert([formData])
        
        if (error) throw error
        toast.success('新しい店舗を追加しました')
      }
      
      setShowAddModal(false)
      setEditingVenue(null)
      setFormData({
        name: '',
        address: '',
        category: 'restaurant',
        is_active: true,
        special_multiplier: 1.0,
        happy_hour_start: '17:00',
        happy_hour_end: '19:00',
        happy_hour_multiplier: 2.0
      })
      fetchVenues()
    } catch (error) {
      console.error('Error:', error)
      toast.error('操作に失敗しました')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この店舗を削除しますか？')) return
    
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('店舗を削除しました')
      fetchVenues()
    } catch (error) {
      console.error('Error:', error)
      toast.error('削除に失敗しました')
    }
  }

  function handleEdit(venue: any) {
    setEditingVenue(venue)
    setFormData({
      name: venue.name,
      address: venue.address,
      category: venue.category || 'restaurant',
      is_active: venue.is_active,
      special_multiplier: venue.special_multiplier || 1.0,
      happy_hour_start: venue.happy_hour_start || '17:00',
      happy_hour_end: venue.happy_hour_end || '19:00',
      happy_hour_multiplier: venue.happy_hour_multiplier || 2.0
    })
    setShowAddModal(true)
  }

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categoryEmojis: Record<string, string> = {
    restaurant: '🍽️',
    bar: '🍷',
    izakaya: '🏮',
    cafe: '☕',
    other: '🏪'
  }

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      
      <div className="p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
              <MapPin size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                店舗管理
              </h1>
              <p className="text-gray-600">提携店舗の管理とキャンペーン設定</p>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <MapPin size={24} />
              <span className="text-2xl font-bold">{venues.length}</span>
            </div>
            <p className="text-sm opacity-90">総店舗数</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <Users size={24} />
              <span className="text-2xl font-bold">{venues.filter(v => v.is_active).length}</span>
            </div>
            <p className="text-sm opacity-90">アクティブ店舗</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} />
              <span className="text-2xl font-bold">
                {venues.filter(v => v.happy_hour_multiplier > 1).length}
              </span>
            </div>
            <p className="text-sm opacity-90">キャンペーン中</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock size={24} />
              <span className="text-2xl font-bold">24h</span>
            </div>
            <p className="text-sm opacity-90">平均営業時間</p>
          </motion.div>
        </div>

        {/* アクションバー */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="店舗名または住所で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingVenue(null)
                setFormData({
                  name: '',
                  address: '',
                  category: 'restaurant',
                  is_active: true,
                  special_multiplier: 1.0,
                  happy_hour_start: '17:00',
                  happy_hour_end: '19:00',
                  happy_hour_multiplier: 2.0
                })
                setShowAddModal(true)
              }}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Plus size={20} />
              新規店舗追加
            </button>
          </div>
        </div>

        {/* 店舗リスト */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              店舗が見つかりません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">店舗名</th>
                    <th className="text-left p-4 font-medium text-gray-700">住所</th>
                    <th className="text-left p-4 font-medium text-gray-700">カテゴリー</th>
                    <th className="text-left p-4 font-medium text-gray-700">ステータス</th>
                    <th className="text-left p-4 font-medium text-gray-700">ハッピーアワー</th>
                    <th className="text-left p-4 font-medium text-gray-700">倍率</th>
                    <th className="text-left p-4 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((venue, index) => (
                    <motion.tr
                      key={venue.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {categoryEmojis[venue.category] || '🏪'}
                          </span>
                          <div>
                            <p className="font-medium">{venue.name}</p>
                            <p className="text-xs text-gray-500">ID: {venue.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{venue.address}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {venue.category || 'restaurant'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          venue.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {venue.is_active ? '営業中' : '休業中'}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {venue.happy_hour_start && venue.happy_hour_end ? (
                          <span className="text-purple-600 font-medium">
                            {venue.happy_hour_start} - {venue.happy_hour_end}
                          </span>
                        ) : (
                          <span className="text-gray-400">なし</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            通常: {venue.special_multiplier || 1.0}x
                          </span>
                          {venue.happy_hour_multiplier > 1 && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              HH: {venue.happy_hour_multiplier}x
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(venue)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(venue.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 追加/編集モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">
              {editingVenue ? '店舗情報を編集' : '新規店舗を追加'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  店舗名
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリー
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="restaurant">レストラン</option>
                  <option value="bar">バー</option>
                  <option value="izakaya">居酒屋</option>
                  <option value="cafe">カフェ</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    通常倍率
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.special_multiplier}
                    onChange={(e) => setFormData({ ...formData, special_multiplier: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HH倍率
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.happy_hour_multiplier}
                    onChange={(e) => setFormData({ ...formData, happy_hour_multiplier: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HH開始時間
                  </label>
                  <input
                    type="time"
                    value={formData.happy_hour_start}
                    onChange={(e) => setFormData({ ...formData, happy_hour_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HH終了時間
                  </label>
                  <input
                    type="time"
                    value={formData.happy_hour_end}
                    onChange={(e) => setFormData({ ...formData, happy_hour_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  アクティブ状態
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  {editingVenue ? '更新' : '追加'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingVenue(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  )
}