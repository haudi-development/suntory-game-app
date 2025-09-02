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
    <div>
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              データ分析
            </h1>
            <p className="text-gray-600">KANPAI! 詳細な統計とレポート</p>
          </div>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600 font-medium">今週の記録数</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">{analytics.dailyStats.length.toLocaleString()}</p>
              <p className="text-xs text-emerald-500 mt-1">アクティビティ</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Activity className="text-white" size={28} />
            </div>
          </div>
        </div>
        <div className="group bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">総ユーザー数</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{analytics.userGrowth.length.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1">登録済み</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Users className="text-white" size={28} />
            </div>
          </div>
        </div>
        <div className="group bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">人気商品数</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{productRanking.length.toLocaleString()}</p>
              <p className="text-xs text-purple-500 mt-1">トップ商品</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Package className="text-white" size={28} />
            </div>
          </div>
        </div>
        <div className="group bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">平均記録/日</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">
                {Math.round(analytics.dailyStats.length / 7).toLocaleString()}
              </p>
              <p className="text-xs text-orange-500 mt-1">デイリー平均</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Calendar className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* カテゴリー別分布 */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-white" size={18} />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
                カテゴリー別分布
              </span>
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {categories.map(cat => {
                const count = analytics.categoryBreakdown[cat.key] || 0
                const total = Object.values(analytics.categoryBreakdown).reduce((sum: any, v: any) => sum + v, 0) as number
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0
                
                return (
                  <div key={cat.key} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{
                          cat.key === 'draft_beer' ? '🍺' :
                          cat.key === 'highball' ? '🥃' :
                          cat.key === 'sour' ? '🍋' :
                          cat.key === 'gin_soda' ? '🌿' :
                          cat.key === 'non_alcohol' ? '🚫' :
                          cat.key === 'water' ? '💧' :
                          '🥤'
                        }</span>
                        <span className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{cat.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {count}件
                        </span>
                        <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${cat.color} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
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