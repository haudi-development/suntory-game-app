'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trophy, Medal, Crown, Star, TrendingUp, TrendingDown, Minus, Sparkles, Fire } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GamingButton } from '@/components/ui/GamingButton'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* ロゴ */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
          <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KANPAI! by Suntory
          </span>
        </div>
      </div>
      <Toaster position="top-center" />
      
      {/* ヘッダー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400 rounded-full opacity-20 blur-xl animate-pulse" />
        </div>
        
        <div className="relative z-10 px-4 pt-16 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Trophy className="text-yellow-400" size={28} />
              ランキング
            </h1>
            <p className="text-white/80 text-sm mb-4">
              全国のサントリー飲活仲間と競おう！
            </p>
            {myRank && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-block"
              >
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                  <span className="text-sm font-bold">あなたの順位: </span>
                  <span className="text-xl font-bold text-yellow-400">{myRank}</span>
                  <span className="text-sm">位</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-20">
        {/* 期間選択タブ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex mb-6 bg-white rounded-2xl p-1 shadow-xl"
        >
          {(['daily', 'weekly', 'monthly', 'all'] as const).map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-3 rounded-xl transition-all text-sm font-medium ${
                timeRange === range 
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
              }`}
            >
              {range === 'daily' ? 'デイリー' : 
               range === 'weekly' ? '週間' : 
               range === 'monthly' ? '月間' : '総合'}
            </motion.button>
          ))}
        </motion.div>

        {/* ランキングリスト */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-6"
        >
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              まだランキングデータがありません
              {console.log('No rankings to display. Rankings array:', rankings)}
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((user, index) => {
                const isMe = user.user_id === currentUser?.id
                const points = getPoints(user)
                
                return (
                  <motion.div 
                    key={user.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-105
                      ${isMe ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-md' : 'bg-gray-50 hover:bg-gray-100'}
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
                          {user.display_name || user.nickname || 'ユーザー'}
                          {isMe && <span className="text-xs bg-primary text-white px-1 rounded">YOU</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          Lv.{Math.floor((user.total_points || 0) / 100) + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-dark text-lg">{points}pt</p>
                      {timeRange !== 'all' && (
                        <p className="text-xs text-gray-500">総合: {user.total_points}pt</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* 報酬説明 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h3 className="font-bold mb-4 text-primary-dark text-lg">🏆 ランキング報酬</h3>
          <div className="space-y-3">
            {[
              { rank: '1位', reward: 'レジェンドバッジ + 特別キャラクター', color: 'from-yellow-100 to-yellow-200 border-yellow-300' },
              { rank: '2-3位', reward: 'チャンピオンバッジ', color: 'from-gray-100 to-gray-200 border-gray-300' },
              { rank: '4-10位', reward: 'エリートバッジ', color: 'from-orange-100 to-orange-200 border-orange-300' },
              { rank: '週間TOP10', reward: 'ボーナスポイント付与', color: 'from-purple-100 to-purple-200 border-purple-300' }
            ].map((item, index) => (
              <div key={index} className={`bg-gradient-to-r ${item.color} p-3 rounded-xl border`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{item.rank}</span>
                  <span className="text-sm text-gray-700">{item.reward}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* ボトムスペーシング */}
        <div className="pb-24"></div>
      </div>
    </div>
  )
}