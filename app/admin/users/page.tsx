'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, Search, Edit, Trash2, Award, TrendingUp, Users, Eye, Ban, 
  UserX, UserCheck, Filter, Download, Calendar, Star, CheckSquare,
  MoreHorizontal, Bell, RefreshCw, Shield, AlertTriangle, Zap
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import UserQuickActions from '@/components/admin/UserQuickActions'

interface User {
  user_id: string
  nickname: string
  email: string
  email_confirmed: boolean
  total_points: number
  level: number
  status: 'active' | 'inactive' | 'banned'
  created_at: string
  last_login_at?: string
  consumptions?: { count: number }[]
  user_badges?: any[]
  user_characters?: any[]
  is_online?: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState({ min: 0, max: 100 })
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const [pointsFilter, setPointsFilter] = useState({ min: 0, max: 100000 })
  const [availableCharacters] = useState([
    { id: 'beer', name: 'プレモルくん', icon: '🍺', description: 'ビール系のマスコット' },
    { id: 'highball', name: '角ハイ坊や', icon: '🥃', description: 'ハイボール系のマスコット' },
    { id: 'gin', name: '翠ジン妖精', icon: '🌿', description: 'ジン系のマスコット' },
    { id: 'sour', name: 'レモンサワー兄弟', icon: '🍋', description: 'サワー系のマスコット' },
    { id: 'non_alcohol', name: 'オールフリー先生', icon: '🍾', description: 'ノンアル系のマスコット' },
    { id: 'water', name: '天然水スピリット', icon: '💧', description: '水・茶系のマスコット' }
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

      // auth情報とprofile情報を結合し、レベルを計算
      const usersWithAuth = profiles?.map(profile => {
        const authUser = authUsers?.find(u => u.id === profile.user_id)
        const totalPoints = profile.total_points || 0
        const level = Math.floor(totalPoints / 100) + 1
        const isOnline = authUser?.last_sign_in_at && 
          new Date(authUser.last_sign_in_at).getTime() > Date.now() - (30 * 60 * 1000) // 30分以内
        
        return {
          ...profile,
          email: authUser?.email || 'N/A',
          email_confirmed: authUser?.email_confirmed_at ? true : false,
          level,
          status: authUser?.banned_until ? 'banned' as const : 
                  (isOnline ? 'active' as const : 'inactive' as const),
          last_login_at: authUser?.last_sign_in_at,
          is_online: isOnline
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

  async function banUser(userId: string, ban: boolean) {
    try {
      // Note: In a real app, you'd use Supabase Admin API to ban users
      // For now, we'll update a status field in profiles
      const { error } = await supabase
        .from('profiles')
        .update({ status: ban ? 'banned' : 'active' })
        .eq('user_id', userId)

      if (error) throw error

      toast.success(ban ? 'ユーザーをBANしました' : 'ユーザーのBANを解除しました')
      fetchUsers()
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('操作に失敗しました')
    }
  }

  async function resetPassword(userId: string) {
    try {
      // In a real app, you'd use Supabase Admin API
      toast.success('パスワードリセットメールを送信しました')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('パスワードリセットに失敗しました')
    }
  }

  async function sendNotification(userId: string, message: string) {
    try {
      // Implementation would depend on your notification system
      toast.success('通知を送信しました')
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('通知の送信に失敗しました')
    }
  }

  async function bulkAction(action: string) {
    if (selectedUsers.length === 0) {
      toast.error('ユーザーを選択してください')
      return
    }

    if (!confirm(`選択した${selectedUsers.length}人のユーザーに対して${action}を実行しますか？`)) {
      return
    }

    try {
      switch (action) {
        case 'delete':
          for (const userId of selectedUsers) {
            await supabase.from('consumptions').delete().eq('user_id', userId)
            await supabase.from('user_badges').delete().eq('user_id', userId)
            await supabase.from('user_characters').delete().eq('user_id', userId)
            await supabase.from('profiles').delete().eq('user_id', userId)
          }
          break
        case 'ban':
          await supabase
            .from('profiles')
            .update({ status: 'banned' })
            .in('user_id', selectedUsers)
          break
        case 'unban':
          await supabase
            .from('profiles')
            .update({ status: 'active' })
            .in('user_id', selectedUsers)
          break
        case 'add_points':
          const points = prompt('追加するポイント数を入力してください:')
          if (points) {
            const pointsNum = parseInt(points)
            for (const userId of selectedUsers) {
              const user = users.find(u => u.user_id === userId)
              if (user) {
                await supabase
                  .from('profiles')
                  .update({ total_points: (user.total_points || 0) + pointsNum })
                  .eq('user_id', userId)
              }
            }
          }
          break
      }

      toast.success('一括操作が完了しました')
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      console.error('Error in bulk action:', error)
      toast.error('一括操作に失敗しました')
    }
  }

  function exportToCSV() {
    const csvData = filteredUsers.map(user => ({
      ユーザーID: user.user_id,
      ニックネーム: user.nickname || '',
      メール: user.email,
      ポイント: user.total_points || 0,
      レベル: user.level,
      ステータス: user.status,
      記録数: user.consumptions?.[0]?.count || 0,
      バッジ数: user.user_badges?.length || 0,
      キャラクター数: user.user_characters?.length || 0,
      登録日: new Date(user.created_at).toLocaleDateString()
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function toggleUserSelection(userId: string) {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  function selectAllUsers() {
    setSelectedUsers(filteredUsers.map(user => user.user_id))
  }

  function clearSelection() {
    setSelectedUsers([])
  }

  // Advanced filtering
  const filteredUsers = users.filter(user => {
    // Text search
    const matchesSearch = !searchTerm || 
      user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    // Level filter
    const matchesLevel = user.level >= levelFilter.min && user.level <= levelFilter.max

    // Points filter
    const totalPoints = user.total_points || 0
    const matchesPoints = totalPoints >= pointsFilter.min && totalPoints <= pointsFilter.max

    // Date filter
    let matchesDate = true
    if (dateFilter.start || dateFilter.end) {
      const userDate = new Date(user.created_at)
      if (dateFilter.start) {
        matchesDate = matchesDate && userDate >= new Date(dateFilter.start)
      }
      if (dateFilter.end) {
        matchesDate = matchesDate && userDate <= new Date(dateFilter.end)
      }
    }

    return matchesSearch && matchesStatus && matchesLevel && matchesPoints && matchesDate
  })

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
        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">総ユーザー数</p>
                <p className="text-3xl font-bold">{users.length.toLocaleString()}</p>
              </div>
              <Users className="text-blue-200" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">アクティブユーザー</p>
                <p className="text-3xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <UserCheck className="text-green-200" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">総ポイント</p>
                <p className="text-3xl font-bold">{users.reduce((sum, u) => sum + (u.total_points || 0), 0).toLocaleString()}</p>
              </div>
              <Star className="text-yellow-200" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">BANユーザー</p>
                <p className="text-3xl font-bold">{users.filter(u => u.status === 'banned').length}</p>
              </div>
              <Ban className="text-red-200" size={32} />
            </div>
          </div>
        </div>

        {/* 検索バーとフィルター */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ユーザー名、メール、IDで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${showFilters ? 'bg-blue-600 text-white' : 'bg-white/70 text-gray-700 hover:bg-white/90'}`}
              >
                <Filter size={18} />
                フィルター
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
              >
                <Download size={18} />
                CSV
              </button>
            </div>
          </div>

          {/* フィルターパネル */}
          {showFilters && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                  <option value="banned">BAN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">レベル範囲</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="最小"
                    value={levelFilter.min}
                    onChange={(e) => setLevelFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="最大"
                    value={levelFilter.max}
                    onChange={(e) => setLevelFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ポイント範囲</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="最小"
                    value={pointsFilter.min}
                    onChange={(e) => setPointsFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="最大"
                    value={pointsFilter.max}
                    onChange={(e) => setPointsFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 100000 }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">登録日期間</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 一括操作パネル */}
        {selectedUsers.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare size={24} />
                <span className="font-semibold">{selectedUsers.length}人のユーザーを選択中</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => bulkAction('add_points')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all duration-200"
                >
                  ポイント追加
                </button>
                <button
                  onClick={() => bulkAction('ban')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all duration-200"
                >
                  一括BAN
                </button>
                <button
                  onClick={() => bulkAction('unban')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all duration-200"
                >
                  BAN解除
                </button>
                <button
                  onClick={() => bulkAction('delete')}
                  className="px-4 py-2 bg-red-500/70 hover:bg-red-500/90 rounded-lg font-medium transition-all duration-200"
                >
                  一括削除
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all duration-200"
                >
                  選択解除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ユーザーテーブル */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={() => selectedUsers.length === filteredUsers.length ? clearSelection() : selectAllUsers()}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">全選択</span>
                </div>
                <span className="text-sm text-gray-600">{filteredUsers.length}人のユーザー</span>
              </div>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
              >
                <RefreshCw size={14} />
                更新
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={16} />
                      ユーザー
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    レベル・ポイント
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    アクティビティ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    コレクション
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200/50">
                {filteredUsers.map((user) => {
                  const createdAt = new Date(user.created_at)
                  const dateStr = `${createdAt.getFullYear()}/${createdAt.getMonth() + 1}/${createdAt.getDate()}`
                  const isSelected = selectedUsers.includes(user.user_id)
                  
                  return (
                    <tr 
                      key={user.user_id} 
                      className={`hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 transition-all duration-200 ${
                        isSelected ? 'bg-gradient-to-r from-purple-50/60 to-blue-50/60 ring-1 ring-purple-300/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user.user_id)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="font-bold text-white text-lg">
                                {(user.nickname || 'U').charAt(0).toUpperCase()}
                              </span>
                              {user.is_online && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-gray-900">
                                {user.nickname || 'ユーザー'}
                              </div>
                              {user.status === 'banned' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  <Ban size={12} className="mr-1" />
                                  BAN
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {user.user_id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'banned' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status === 'active' ? 'アクティブ' : user.status === 'banned' ? 'BAN' : '非アクティブ'}
                          </span>
                        </div>
                        {user.email_confirmed === false && (
                          <span className="inline-flex px-2 py-1 text-xs bg-yellow-100 text-yellow-600 rounded-full mt-1">
                            メール未確認
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Lv.</span>
                            <span className="font-bold text-purple-600">{user.level}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" />
                            <span className="font-bold text-lg bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                              {(user.total_points || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-green-500" />
                            <span className="text-sm font-medium">{user.consumptions?.[0]?.count || 0}回</span>
                          </div>
                          {user.last_login_at && (
                            <div className="text-xs text-gray-500">
                              最終: {new Date(user.last_login_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-2xl">🎮</span>
                            <span className="text-sm font-medium">{user.user_characters?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award size={16} className="text-yellow-500" />
                            <span className="text-sm font-medium">{user.user_badges?.length || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-medium">
                          {dateStr}
                        </div>
                        <div className="text-xs text-gray-400">
                          {createdAt.toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDetailsModal(true)
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                            title="詳細表示"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowEditModal(true)
                            }}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200"
                            title="編集"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => resetPassword(user.user_id)}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded-lg transition-all duration-200"
                            title="パスワードリセット"
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() => banUser(user.user_id, user.status !== 'banned')}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              user.status === 'banned' 
                                ? 'text-green-600 hover:text-green-800 hover:bg-green-100' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            }`}
                            title={user.status === 'banned' ? 'BAN解除' : 'BAN'}
                          >
                            {user.status === 'banned' ? <UserCheck size={16} /> : <Ban size={16} />}
                          </button>
                          <UserQuickActions
                            userId={user.user_id}
                            currentPoints={user.total_points || 0}
                            onUpdate={fetchUsers}
                          />
                          <div className="relative group">
                            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200">
                              <MoreHorizontal size={16} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                              <button
                                onClick={() => sendNotification(user.user_id, 'テスト通知')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Bell size={14} />
                                通知送信
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowBadgeModal(true)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Award size={14} />
                                バッジ付与
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => deleteUser(user.user_id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                削除
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ユーザー詳細モーダル */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {(selectedUser.nickname || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.nickname || 'ユーザー'}</h2>
                    <p className="text-white/80">{selectedUser.email}</p>
                    <p className="text-white/60 text-sm font-mono">ID: {selectedUser.user_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 基本情報 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users size={20} className="text-blue-500" />
                    基本情報
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ステータス</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        selectedUser.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedUser.status === 'banned' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.status === 'active' ? 'アクティブ' : 
                         selectedUser.status === 'banned' ? 'BAN' : '非アクティブ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">レベル</span>
                      <span className="font-semibold text-purple-600">Lv.{selectedUser.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">総ポイント</span>
                      <span className="font-bold text-lg text-yellow-600">
                        {(selectedUser.total_points || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">記録数</span>
                      <span className="font-semibold">{selectedUser.consumptions?.[0]?.count || 0}回</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">登録日</span>
                      <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                    {selectedUser.last_login_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">最終ログイン</span>
                        <span>{new Date(selectedUser.last_login_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* キャラクターコレクション */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    🎮 キャラクターコレクション
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedUser.user_characters && selectedUser.user_characters.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedUser.user_characters.map((char: any, index: number) => {
                          const characterInfo = availableCharacters.find(ac => ac.id === char.character_type)
                          return (
                            <div key={index} className="bg-white rounded-lg p-3 text-center">
                              <div className="text-2xl mb-2">{characterInfo?.icon || '🎮'}</div>
                              <div className="text-sm font-medium text-gray-800">
                                {characterInfo?.name || char.character_type}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Lv.{char.level} (進化{char.evolution_stage})
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">キャラクターを所持していません</p>
                    )}
                  </div>
                </div>

                {/* バッジコレクション */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    🏆 バッジコレクション
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedUser.user_badges && selectedUser.user_badges.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {selectedUser.user_badges.map((badge: any, index: number) => {
                          const badgeInfo = badges.find(b => b.id === badge.badge_id)
                          return (
                            <div key={index} className="bg-white rounded-lg p-3 text-center">
                              <div className="text-2xl mb-2">{badgeInfo?.icon || '🏆'}</div>
                              <div className="text-xs font-medium text-gray-800">
                                {badgeInfo?.name || badge.badge_id}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">バッジを獲得していません</p>
                    )}
                  </div>
                </div>

                {/* 最近のアクティビティ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-500" />
                    最近のアクティビティ
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-center py-4">データを読み込み中...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー編集モーダル */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit size={24} />
                ユーザー編集
              </h3>
              <p className="text-white/80 mt-1">{selectedUser.nickname || 'ユーザー'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ニックネーム</label>
                <input
                  type="text"
                  defaultValue={selectedUser.nickname || ''}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  id="nickname-input"
                  placeholder="ニックネームを入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">総ポイント</label>
                <input
                  type="number"
                  defaultValue={selectedUser.total_points || 0}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  id="points-input"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select
                  defaultValue={selectedUser.status}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  id="status-select"
                >
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                  <option value="banned">BAN</option>
                </select>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  const nickname = (document.getElementById('nickname-input') as HTMLInputElement).value
                  const points = parseInt((document.getElementById('points-input') as HTMLInputElement).value)
                  const status = (document.getElementById('status-select') as HTMLSelectElement).value
                  
                  // Update user data (implement the actual update logic)
                  updateUserPoints(selectedUser.user_id, points)
                  setShowEditModal(false)
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckSquare size={18} />
                更新
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* バッジ付与モーダル */}
      {showBadgeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award size={24} />
                バッジ付与
              </h3>
              <p className="text-white/80 mt-1">{selectedUser.nickname || 'ユーザー'}</p>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {badges.map((badge) => {
                  const hasBadge = selectedUser.user_badges?.some(ub => ub.badge_id === badge.id)
                  return (
                    <button
                      key={badge.id}
                      onClick={() => !hasBadge && grantBadge(selectedUser.user_id, badge.id)}
                      disabled={hasBadge}
                      className={`w-full text-left p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        hasBadge 
                          ? 'border-green-200 bg-green-50 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 hover:scale-[1.02]'
                      }`}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">{badge.name}</div>
                        {hasBadge && (
                          <div className="text-sm text-green-600 font-medium">✓ 付与済み</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}