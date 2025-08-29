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
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />
      
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                サントリー飲活 管理画面
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut size={20} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-12 items-center">
            <Link href="/admin" className="hover:text-accent">
              ダッシュボード
            </Link>
            <Link href="/admin/users" className="hover:text-accent">
              ユーザー管理
            </Link>
            <Link href="/admin/products" className="hover:text-accent">
              製品管理
            </Link>
            <Link href="/admin/content" className="hover:text-accent">
              コンテンツ管理
            </Link>
            <Link href="/admin/analytics" className="hover:text-accent">
              分析
            </Link>
            <Link href="/admin/settings" className="hover:text-accent">
              設定
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総ユーザー数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="text-primary" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">アクティブユーザー</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
              <Activity className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総記録数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalConsumptions}</p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日の記録</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayConsumptions}</p>
              </div>
              <TrendingUp className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* トップユーザー */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                トップユーザー
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.topUsers.map((user: any, index: number) => (
                  <div key={user.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{user.nickname || 'ユーザー'}</span>
                    </div>
                    <span className="font-bold text-primary">{user.total_points || 0} pt</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">最近のアクティビティ</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentActivities.map((activity: any) => {
                  const date = new Date(activity.created_at)
                  const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                  
                  return (
                    <div key={activity.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{activity.profiles?.nickname || 'ユーザー'}</span>
                        <span className="text-gray-500 ml-2">{activity.brand_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-primary font-medium">+{activity.points_earned}pt</span>
                        <span className="text-gray-400 ml-2">{timeStr}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <Users className="text-primary" size={24} />
              <div>
                <p className="font-medium">ユーザー管理</p>
                <p className="text-sm text-gray-600">ユーザーの一覧と編集</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/content" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <Award className="text-primary" size={24} />
              <div>
                <p className="font-medium">バッジ管理</p>
                <p className="text-sm text-gray-600">バッジの設定と付与</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-primary" size={24} />
              <div>
                <p className="font-medium">データ分析</p>
                <p className="text-sm text-gray-600">詳細な統計とレポート</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}