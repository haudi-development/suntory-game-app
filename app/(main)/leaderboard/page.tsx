'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Crown, Star } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<any[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchRankings()
    }
  }, [timeRange, currentUser])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)
  }

  async function fetchRankings() {
    try {
      setLoading(true)
      
      // デバッグ: profilesテーブルのデータを確認
      const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
      
      console.log('=== LEADERBOARD DEBUG ===')
      console.log('Current user:', currentUser)
      console.log('Time range:', timeRange)
      console.log('All profiles:', allProfiles)
      console.log('Profile error:', profileError)
      
      let query = supabase
        .from('profiles')
        .select('*')

      // 時間範囲に応じたフィルタリング
      if (timeRange === 'daily') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // 今日の記録からポイントを集計
        const { data: todayData } = await supabase
          .from('consumptions')
          .select('user_id, points_earned')
          .gte('created_at', today.toISOString())

        // ユーザーごとに集計
        const todayPoints: Record<string, number> = {}
        todayData?.forEach(record => {
          todayPoints[record.user_id] = (todayPoints[record.user_id] || 0) + record.points_earned
        })

        // プロフィールと結合
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        const dailyRankings = profiles?.map(profile => ({
          ...profile,
          daily_points: todayPoints[profile.user_id] || 0
        })).sort((a, b) => b.daily_points - a.daily_points).slice(0, 50)

        setRankings(dailyRankings || [])
        
        // 自分の順位を探す
        const myIndex = dailyRankings?.findIndex(u => u.user_id === currentUser?.id)
        setMyRank(myIndex !== -1 ? myIndex! + 1 : null)
        
      } else if (timeRange === 'weekly') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const { data: weekData } = await supabase
          .from('consumptions')
          .select('user_id, points_earned')
          .gte('created_at', weekAgo.toISOString())

        const weekPoints: Record<string, number> = {}
        weekData?.forEach(record => {
          weekPoints[record.user_id] = (weekPoints[record.user_id] || 0) + record.points_earned
        })

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        const weeklyRankings = profiles?.map(profile => ({
          ...profile,
          weekly_points: weekPoints[profile.user_id] || 0
        })).sort((a, b) => b.weekly_points - a.weekly_points).slice(0, 50)

        setRankings(weeklyRankings || [])
        
        const myIndex = weeklyRankings?.findIndex(u => u.user_id === currentUser?.id)
        setMyRank(myIndex !== -1 ? myIndex! + 1 : null)
        
      } else if (timeRange === 'monthly') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        
        const { data: monthData } = await supabase
          .from('consumptions')
          .select('user_id, points_earned')
          .gte('created_at', monthAgo.toISOString())

        const monthPoints: Record<string, number> = {}
        monthData?.forEach(record => {
          monthPoints[record.user_id] = (monthPoints[record.user_id] || 0) + record.points_earned
        })

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        const monthlyRankings = profiles?.map(profile => ({
          ...profile,
          monthly_points: monthPoints[profile.user_id] || 0
        })).sort((a, b) => b.monthly_points - a.monthly_points).slice(0, 50)

        setRankings(monthlyRankings || [])
        
        const myIndex = monthlyRankings?.findIndex(u => u.user_id === currentUser?.id)
        setMyRank(myIndex !== -1 ? myIndex! + 1 : null)
        
      } else {
        // 総合ランキング
        const { data, error } = await query
          .order('total_points', { ascending: false })
          .limit(50)

        console.log('Final ranking data:', data)
        console.log('Final ranking error:', error)
        console.log('Data length:', data?.length)
        console.log('Data with points:', data?.filter(p => p.total_points > 0))
        
        // total_pointsが0より大きいユーザーのみ表示
        const validRankings = data?.filter(profile => profile.total_points > 0) || []
        console.log('Valid rankings:', validRankings)
        console.log('Valid rankings length:', validRankings.length)
        setRankings(validRankings)
        
        // 自分の順位を探す
        const myIndex = data?.findIndex(u => u.user_id === currentUser?.id)
        setMyRank(myIndex !== -1 ? myIndex! + 1 : null)
      }

    } catch (error) {
      console.error('Error fetching rankings:', error)
      toast.error('ランキングの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getPoints = (user: any) => {
    if (timeRange === 'daily') return user.daily_points || 0
    if (timeRange === 'weekly') return user.weekly_points || 0
    if (timeRange === 'monthly') return user.monthly_points || 0
    return user.total_points || 0
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="text-yellow-400" size={20} />
    if (index === 1) return <Medal className="text-gray-400" size={20} />
    if (index === 2) return <Medal className="text-orange-600" size={20} />
    return index + 1
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Toaster position="top-center" />
      
      <div className="gradient-bg text-white p-4 mb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center">ランキング</h1>
          <p className="text-center text-sm mt-2 opacity-90">
            全国のサントリー飲活仲間と競おう！
          </p>
          {myRank && (
            <div className="mt-3 text-center">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                あなたの順位: {myRank}位
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* 期間選択タブ */}
        <div className="flex mb-4 bg-white rounded-lg p-1 shadow-sm">
          {(['daily', 'weekly', 'monthly', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                timeRange === range 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {range === 'daily' ? 'デイリー' : 
               range === 'weekly' ? '週間' : 
               range === 'monthly' ? '月間' : '総合'}
            </button>
          ))}
        </div>

        {/* ランキングリスト */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              まだランキングデータがありません
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((user, index) => {
                const isMe = user.user_id === currentUser?.id
                const points = getPoints(user)
                
                return (
                  <div 
                    key={user.user_id} 
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors
                      ${isMe ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg' : 
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg' : 
                          'bg-gray-200 text-gray-700'}
                      `}>
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          {user.nickname || 'ユーザー'}
                          {isMe && <span className="text-xs bg-primary text-white px-1 rounded">YOU</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          Lv.{Math.floor((user.total_points || 0) / 100) + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-dark">{points}pt</p>
                      {timeRange !== 'all' && (
                        <p className="text-xs text-gray-500">総合: {user.total_points}pt</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 報酬説明 */}
        <div className="mt-6 card">
          <h3 className="font-bold mb-2">🏆 ランキング報酬</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• 1位: レジェンドバッジ + 特別キャラクター</p>
            <p>• 2-3位: チャンピオンバッジ</p>
            <p>• 4-10位: エリートバッジ</p>
            <p>• 週間TOP10: ボーナスポイント付与</p>
          </div>
        </div>
      </div>
    </div>
  )
}