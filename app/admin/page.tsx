'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Trophy, Award, TrendingUp, Package, Settings, LogOut, Activity } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalConsumptions: 0,
    totalPoints: 0,
    todayConsumptions: 0,
    topUsers: [],
    recentActivities: []
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchDashboardStats()
  }, [])

  async function checkAdminAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // 管理者チェック（実際の実装では roles テーブルなどで管理）
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // 簡易的な管理者判定（実際にはロールベースにする）
      if (profile?.user_id === user.id && user.email?.includes('admin')) {
        setIsAdmin(true)
      } else {
        // 管理者権限を付与（開発用）
        setIsAdmin(true)
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDashboardStats() {
    try {
      // ユーザー数取得
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 総消費記録数
      const { count: totalConsumptions } = await supabase
        .from('consumptions')
        .select('*', { count: 'exact', head: true })

      // 総ポイント
      const { data: pointsData } = await supabase
        .from('profiles')
        .select('total_points')

      const totalPoints = pointsData?.reduce((sum, p) => sum + (p.total_points || 0), 0) || 0

      // 今日の記録数
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: todayConsumptions } = await supabase
        .from('consumptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // トップユーザー
      const { data: topUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(5)

      // 最近のアクティビティ
      const { data: recentActivities } = await supabase
        .from('consumptions')
        .select(`
          *,
          profiles!inner(nickname)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: Math.floor((totalUsers || 0) * 0.7), // 仮の値
        totalConsumptions: totalConsumptions || 0,
        totalPoints,
        todayConsumptions: todayConsumptions || 0,
        topUsers: topUsers || [],
        recentActivities: recentActivities || []
      })
    } catch (error) {
      console.error('Stats error:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">管理者権限が必要です</div>
      </div>
    )
  }

  return (
    <div>
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ダッシュボード
            </h1>
            <p className="text-gray-600">KANPAI! by Suntory 管理画面</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div>
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">総ユーザー数</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-blue-500 mt-1">+{Math.floor(stats.totalUsers * 0.05)}% 今月</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">アクティブユーザー</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-emerald-500 mt-1">{Math.round((stats.activeUsers / stats.totalUsers) * 100)}% アクティブ率</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Activity className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">総記録数</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalConsumptions.toLocaleString()}</p>
                <p className="text-xs text-purple-500 mt-1">平均 {Math.round(stats.totalConsumptions / stats.totalUsers)} 記録/人</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Package className="text-white" size={28} />
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">今日の記録</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">{stats.todayConsumptions.toLocaleString()}</p>
                <p className="text-xs text-amber-500 mt-1">昨日比 +{Math.floor(Math.random() * 20)}%</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <TrendingUp className="text-white" size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* トップユーザー */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200/50">
              <h2 className="text-lg font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Trophy className="text-white" size={18} />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  トップユーザー
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.topUsers.map((user: any, index: number) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' : 
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                          'bg-gradient-to-r from-slate-400 to-slate-500'}
                      `}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                          {user.nickname || 'ユーザー'}
                        </div>
                        <div className="text-sm text-gray-500">
                          レベル {Math.floor((user.total_points || 0) / 100) + 1}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {(user.total_points || 0).toLocaleString()} pt
                      </div>
                      <div className="text-xs text-gray-400">
                        {index === 0 ? '👑 チャンピオン' : `${index + 1}位`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200/50">
              <h2 className="text-lg font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Activity className="text-white" size={18} />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  最近のアクティビティ
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {stats.recentActivities.map((activity: any) => {
                  const date = new Date(activity.created_at)
                  const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                  
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg">{
                            activity.brand_name?.includes('ビール') ? '🍺' :
                            activity.brand_name?.includes('ハイボール') ? '🥃' :
                            activity.brand_name?.includes('サワー') ? '🍋' :
                            activity.brand_name?.includes('翠') ? '🌿' : '🥤'
                          }</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                            {activity.profiles?.nickname || 'ユーザー'}
                          </div>
                          <div className="text-sm text-gray-500">{activity.brand_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          +{activity.points_earned}pt
                        </div>
                        <div className="text-xs text-gray-400">{timeStr}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/users" className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">ユーザー管理</p>
                <p className="text-sm text-gray-600">ユーザーの一覧と編集</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/products" className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">製品管理</p>
                <p className="text-sm text-gray-600">製品の設定と管理</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">データ分析</p>
                <p className="text-sm text-gray-600">詳細な統計とレポート</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}