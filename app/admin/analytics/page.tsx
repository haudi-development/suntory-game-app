'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, TrendingUp, Users, Package, Calendar, Activity } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({
    dailyStats: [],
    productStats: [],
    userGrowth: [],
    categoryBreakdown: {}
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    try {
      // 日別統計
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const { data: consumptions } = await supabase
        .from('consumptions')
        .select('*')
        .gte('created_at', lastWeek.toISOString())
        .order('created_at', { ascending: true })

      // 製品別統計
      const { data: productStats } = await supabase
        .from('consumptions')
        .select('brand_name, points_earned')
        .order('created_at', { ascending: false })
        .limit(1000)

      // カテゴリー別集計
      const categoryCount: Record<string, number> = {}
      consumptions?.forEach(c => {
        const category = c.product_type || 'other'
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })

      // ユーザー成長
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true })

      setAnalytics({
        dailyStats: consumptions || [],
        productStats: productStats || [],
        userGrowth: users || [],
        categoryBreakdown: categoryCount
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('分析データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { key: 'draft_beer', label: 'ビール', color: 'bg-yellow-500' },
    { key: 'highball', label: 'ハイボール', color: 'bg-amber-500' },
    { key: 'sour', label: 'サワー', color: 'bg-lime-500' },
    { key: 'gin_soda', label: 'ジン', color: 'bg-cyan-500' },
    { key: 'non_alcohol', label: 'ノンアル', color: 'bg-blue-500' },
    { key: 'water', label: '水・茶', color: 'bg-sky-500' },
    { key: 'softdrink', label: 'ソフトドリンク', color: 'bg-orange-500' }
  ]

  // 製品ランキング集計
  const productRanking = analytics.productStats.reduce((acc: any[], item: any) => {
    const existing = acc.find(p => p.brand_name === item.brand_name)
    if (existing) {
      existing.count++
      existing.totalPoints += item.points_earned
    } else {
      acc.push({
        brand_name: item.brand_name,
        count: 1,
        totalPoints: item.points_earned
      })
    }
    return acc
  }, []).sort((a, b) => b.count - a.count).slice(0, 10)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">データ分析</h1>
        <p className="text-gray-600 mt-2">詳細な統計とレポート</p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">今週の記録数</p>
              <p className="text-2xl font-bold">{analytics.dailyStats.length}</p>
            </div>
            <Activity className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総ユーザー数</p>
              <p className="text-2xl font-bold">{analytics.userGrowth.length}</p>
            </div>
            <Users className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">人気商品数</p>
              <p className="text-2xl font-bold">{productRanking.length}</p>
            </div>
            <Package className="text-purple-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均記録/日</p>
              <p className="text-2xl font-bold">
                {Math.round(analytics.dailyStats.length / 7)}
              </p>
            </div>
            <Calendar className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* カテゴリー別分布 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="text-primary" size={20} />
              カテゴリー別分布
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {categories.map(cat => {
                const count = analytics.categoryBreakdown[cat.key] || 0
                const total = Object.values(analytics.categoryBreakdown).reduce((sum: any, v: any) => sum + v, 0) as number
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0
                
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{cat.label}</span>
                      <span className="text-sm text-gray-600">{count}件 ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${cat.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 人気商品ランキング */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              人気商品TOP10
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {productRanking.map((product, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}
                    `}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.brand_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">{product.count}回</span>
                    <span className="text-xs text-gray-500 ml-2">({product.totalPoints}pt)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ユーザー成長グラフ（簡易版） */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">ユーザー成長</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>登録ユーザー数: {analytics.userGrowth.length}人</p>
            <p className="text-sm mt-2">
              最新登録: {analytics.userGrowth.length > 0 ? 
                new Date(analytics.userGrowth[analytics.userGrowth.length - 1].created_at).toLocaleDateString('ja-JP') 
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}