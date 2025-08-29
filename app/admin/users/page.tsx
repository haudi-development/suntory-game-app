'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Search, Edit, Trash2, Award, TrendingUp } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  async function fetchUsers() {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          consumptions(count),
          user_badges(badge_id),
          user_characters(character_type)
        `)
        .order('created_at', { ascending: false })

      setUsers(profiles || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('ユーザー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function updateUserPoints(userId: string, points: number) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ total_points: points })
        .eq('user_id', userId)

      if (error) throw error

      toast.success('ポイントを更新しました')
      fetchUsers()
    } catch (error) {
      console.error('Error updating points:', error)
      toast.error('ポイントの更新に失敗しました')
    }
  }

  async function grantBadge(userId: string, badgeId: string) {
    try {
      // まず既存のバッジを確認
      const { data: existing } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single()

      if (existing) {
        toast.info('このバッジは既に付与されています')
        return
      }

      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('バッジを付与しました')
      fetchUsers()
      setShowBadgeModal(false)
    } catch (error) {
      console.error('Error granting badge:', error)
      toast.error('バッジの付与に失敗しました')
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('本当にこのユーザーを削除しますか？')) return

    try {
      // 関連データも削除
      await supabase.from('consumptions').delete().eq('user_id', userId)
      await supabase.from('user_badges').delete().eq('user_id', userId)
      await supabase.from('user_characters').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('user_id', userId)

      toast.success('ユーザーを削除しました')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('ユーザーの削除に失敗しました')
    }
  }

  const filteredUsers = users.filter(user => 
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.includes(searchTerm)
  )

  const badges = [
    { id: 'first_drink', name: 'はじめての一杯', icon: '🍺' },
    { id: '3days_streak', name: '3日連続', icon: '🔥' },
    { id: 'explorer', name: '探検家', icon: '🗾' },
    { id: 'champion', name: 'チャンピオン', icon: '🏆' },
    { id: 'perfect_week', name: 'パーフェクトウィーク', icon: '🎯' },
    { id: 'variety', name: 'バラエティ', icon: '🌈' },
    { id: 'legend', name: 'レジェンド', icon: '👑' },
  ]

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
          <div className="flex items-center h-16">
            <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4">
              <ArrowLeft size={20} />
              <span>戻る</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">ユーザー管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索バー */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ユーザー名またはIDで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* ユーザーテーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ポイント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  記録数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  キャラクター数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  バッジ数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const createdAt = new Date(user.created_at)
                const dateStr = `${createdAt.getFullYear()}/${createdAt.getMonth() + 1}/${createdAt.getDate()}`
                
                return (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.nickname || 'ユーザー'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.user_id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-primary">{user.total_points || 0} pt</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.consumptions?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.user_characters?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.user_badges?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dateStr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowBadgeModal(true)
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Award size={18} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.user_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ポイント編集モーダル */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">ポイント編集</h3>
            <p className="mb-2">ユーザー: {selectedUser.nickname || 'ユーザー'}</p>
            <input
              type="number"
              defaultValue={selectedUser.total_points || 0}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              id="points-input"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const points = parseInt((document.getElementById('points-input') as HTMLInputElement).value)
                  updateUserPoints(selectedUser.user_id, points)
                  setShowEditModal(false)
                }}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark"
              >
                更新
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* バッジ付与モーダル */}
      {showBadgeModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">バッジ付与</h3>
            <p className="mb-4">ユーザー: {selectedUser.nickname || 'ユーザー'}</p>
            <div className="space-y-2 mb-4">
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => grantBadge(selectedUser.user_id, badge.id)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span>{badge.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBadgeModal(false)}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}