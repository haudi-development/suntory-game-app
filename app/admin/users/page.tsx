'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Search, Edit, Trash2, Award, TrendingUp } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import UserQuickActions from '@/components/admin/UserQuickActions'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [availableCharacters] = useState([
    { id: 'beer', name: 'ビール君', icon: '🍺' },
    { id: 'highball', name: 'ハイボール仙人', icon: '🥃' },
    { id: 'water', name: '水の守護神', icon: '💧' },
    { id: 'gin', name: '翠の精霊', icon: '🌿' },
    { id: 'sour', name: 'サワー姫', icon: '🍋' },
    { id: 'non_alcohol', name: 'ノンアル騎士', icon: '🍾' }
  ])
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
      // まずauth.usersから認証情報を取得（管理者権限が必要）
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
        .catch(() => ({ data: { users: null }, error: 'Admin API not available' }))
      
      console.log('Auth users:', authUsers)
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          consumptions(count),
          user_badges(badge_id),
          user_characters(character_type, level, evolution_stage)
        `)
        .order('created_at', { ascending: false })

      // auth情報とprofile情報を結合
      const usersWithAuth = profiles?.map(profile => {
        const authUser = authUsers?.find(u => u.id === profile.user_id)
        return {
          ...profile,
          email: authUser?.email || 'N/A',
          email_confirmed: authUser?.email_confirmed_at ? true : false
        }
      })

      console.log('Users with auth info:', usersWithAuth)
      setUsers(usersWithAuth || [])
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

  async function updateUserCharacter(userId: string, characterId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_character: characterId })
        .eq('user_id', userId)

      if (error) throw error

      toast.success('キャラクターを変更しました')
      fetchUsers()
      setShowCharacterModal(false)
    } catch (error) {
      console.error('Error updating character:', error)
      toast.error('キャラクターの変更に失敗しました')
    }
  }

  async function unlockCharacter(userId: string, characterId: string) {
    try {
      const { error } = await supabase
        .from('user_characters')
        .insert({
          user_id: userId,
          character_type: characterId,
          level: 1,
          exp: 0,
          evolution_stage: 1
        })

      if (error) throw error

      toast.success('キャラクターを解放しました')
      fetchUsers()
    } catch (error) {
      console.error('Error unlocking character:', error)
      toast.error('キャラクターの解放に失敗しました')
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
    <div>
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ユーザー管理
            </h1>
            <p className="text-gray-600">KANPAI! ユーザーの一覧と編集</p>
          </div>
        </div>
      </div>

      <div>
        {/* 検索バー */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ユーザー名またはIDで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder-gray-400"
            />
          </div>
        </div>

        {/* ユーザーテーブル */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  👤 ユーザー
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  📧 メール
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  ⭐ ポイント
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  📊 記録数
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  🎮 キャラクター
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  🏆 バッジ数
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  📅 登録日
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  ⚙️ 操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
              {filteredUsers.map((user) => {
                const createdAt = new Date(user.created_at)
                const dateStr = `${createdAt.getFullYear()}/${createdAt.getMonth() + 1}/${createdAt.getDate()}`
                
                return (
                  <tr key={user.user_id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <span className="font-bold text-blue-700">
                            {(user.nickname || 'ユーザー').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {user.nickname || 'ユーザー'}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {user.user_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {user.email || 'N/A'}
                      </div>
                      {user.email_confirmed === false && (
                        <span className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                          未確認
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg">
                          {(user.total_points || 0).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">pt</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                        {user.consumptions?.[0]?.count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                        {user.user_characters?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                        {user.user_badges?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {dateStr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowEditModal(true)
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                          title="編集"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowBadgeModal(true)
                          }}
                          className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition-all duration-200"
                          title="バッジ付与"
                        >
                          <Award size={16} />
                        </button>
                        <UserQuickActions
                          userId={user.user_id}
                          currentPoints={user.total_points || 0}
                          onUpdate={fetchUsers}
                        />
                        <button
                          onClick={() => deleteUser(user.user_id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
                          title="削除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

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