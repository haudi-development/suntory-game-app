'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Shield, UserCheck, UserPlus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

type UserWithRole = {
  id: string
  email: string
  nickname: string
  role: 'user' | 'admin' | 'moderator'
  created_at: string
}

export default function RolesManagementPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // profilesとuser_rolesを結合して取得
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          nickname,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // auth.usersからメールアドレスを取得（管理者権限が必要）
      const usersWithEmail = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(
            profile.user_id
          ).catch(() => ({ data: { user: null } }))
          
          return {
            id: profile.user_id,
            email: user?.email || 'Unknown',
            nickname: profile.nickname || 'No nickname',
            role: profile.role || 'user',
            created_at: profile.created_at
          }
        })
      )

      setUsers(usersWithEmail)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('ユーザー情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      // user_rolesテーブルを更新
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .select()

      if (roleError) throw roleError

      // profilesテーブルも更新
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId)

      if (profileError) throw profileError

      toast.success('ロールを更新しました')
      await fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('ロールの更新に失敗しました')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">管理者</span>
      case 'moderator':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">モデレーター</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">一般ユーザー</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ロール管理</h1>
        <p className="text-gray-600">ユーザーの権限を管理します</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="メールアドレスまたはニックネームで検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">すべてのロール</option>
            <option value="admin">管理者</option>
            <option value="moderator">モデレーター</option>
            <option value="user">一般ユーザー</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">管理者</p>
                <p className="text-2xl font-bold text-red-700">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">モデレーター</p>
                <p className="text-2xl font-bold text-blue-700">
                  {users.filter(u => u.role === 'moderator').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">一般ユーザー</p>
                <p className="text-2xl font-bold text-gray-700">
                  {users.filter(u => u.role === 'user').length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-gray-700">ユーザー</th>
                <th className="text-left p-4 font-medium text-gray-700">現在のロール</th>
                <th className="text-left p-4 font-medium text-gray-700">登録日</th>
                <th className="text-left p-4 font-medium text-gray-700">アクション</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.nickname}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="p-4">
                    <select
                      className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                    >
                      <option value="user">一般ユーザー</option>
                      <option value="moderator">モデレーター</option>
                      <option value="admin">管理者</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold text-yellow-800 mb-2">権限について</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>管理者:</strong> すべての機能にアクセス可能</li>
          <li>• <strong>モデレーター:</strong> ユーザー管理、製品管理、統計閲覧が可能</li>
          <li>• <strong>一般ユーザー:</strong> 通常のアプリ機能のみ利用可能</li>
        </ul>
      </div>
    </div>
  )
}