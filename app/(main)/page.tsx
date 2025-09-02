'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Trophy, Gift, Sparkles, TrendingUp, Users, Target, Zap } from 'lucide-react'
import { GamingButton } from '@/components/ui/GamingButton'
import toast, { Toaster } from 'react-hot-toast'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    todayPoints: 0,
    weeklyRank: 0,
    totalBadges: 0,
    currentStreak: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchProfile(user.id)
      await fetchStats(user.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    console.log('Profile data:', data)
    console.log('Selected character:', data?.selected_character)
    
    // selected_characterがない場合はデフォルトを設定
    if (data && !data.selected_character) {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_character: 'premol' })
        .eq('user_id', userId)
      
      if (!error) {
        data.selected_character = 'premol'
      }
    }
    
    setProfile(data)
  }

  async function fetchStats(userId: string) {
    // 今日のポイント
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayData } = await supabase
      .from('consumptions')
      .select('points_earned')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
    
    const todayPoints = todayData?.reduce((sum, d) => sum + d.points_earned, 0) || 0
    
    // その他のスタッツ（仮データ）
    setStats({
      todayPoints,
      weeklyRank: Math.floor(Math.random() * 10) + 1,
      totalBadges: Math.floor(Math.random() * 5) + 1,
      currentStreak: Math.floor(Math.random() * 7) + 1
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-t-transparent rounded-full"
          style={{ borderColor: 'var(--color-primary)' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" />
      
      
      {/* ロゴ */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
          <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KANPAI! by Suntory
          </span>
        </div>
      </div>

      {/* ヘッダー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse" />
        </div>
        
        <div className="relative z-10 px-4 pt-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-2xl font-bold mb-2">
              おかえりなさい！
            </h1>
            <p className="text-lg font-medium">
              {profile?.display_name || profile?.nickname || 'ユーザー'}さん
            </p>
            <p className="text-white/80 text-sm mt-2">今日も素敵な一日を🍻</p>
          </motion.div>
        </div>
      </div>

      {/* メインステータスカード */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 -mt-12 mb-6 relative z-20"
      >
        <div className="bg-white rounded-3xl p-5 shadow-xl">
          {/* レベルとポイント */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">現在のレベル</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Lv.{Math.floor((profile?.total_points || 0) / 100) + 1}
                </span>
                <Sparkles className="text-yellow-500 animate-pulse" size={18} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">総ポイント</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {profile?.total_points || 0}
                </span>
                <span className="text-sm text-gray-500 ml-1">pt</span>
              </div>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>次のレベルまで</span>
              <span className="font-semibold">{100 - ((profile?.total_points || 0) % 100)} pt</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((profile?.total_points || 0) % 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              />
            </div>
          </div>

          {/* 選択中のキャラクター */}
          <div className="flex flex-col items-center justify-center py-3 gap-2">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-5xl" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
                {profile?.selected_character === 'kakuhai' ? '🥃' :
                 profile?.selected_character === 'midori' ? '🍸' :
                 profile?.selected_character === 'lemon' ? '🍋' :
                 profile?.selected_character === 'allfree' ? '🍻' :
                 profile?.selected_character === 'tennensui' ? '💧' : '🍺'}
              </span>
            </motion.div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full shadow-sm">
              <span className="text-xs font-semibold">
                {(() => {
                  const char = profile?.selected_character || 'premol'
                  switch(char) {
                    case 'premol': return 'プレモルくん'
                    case 'kakuhai': return '角ハイ坊や'
                    case 'midori': return '翠ジン妖精'
                    case 'lemon': return 'レモンサワー兄弟'
                    case 'allfree': return 'オールフリー先生'
                    case 'tennensui': return '天然水スピリット'
                    default: return 'プレモルくん'
                  }
                })()}
              </span>
            </div>
          </div>

          {/* クイックスタッツ */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={18} />
                <div>
                  <p className="text-xs text-gray-600">今日の獲得</p>
                  <p className="text-base font-bold text-blue-600">
                    {stats.todayPoints} pt
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200"
            >
              <div className="flex items-center gap-2">
                <Trophy className="text-purple-600" size={18} />
                <div>
                  <p className="text-xs text-gray-600">週間ランク</p>
                  <p className="text-base font-bold text-purple-600">
                    {stats.weeklyRank}位
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200"
            >
              <div className="flex items-center gap-2">
                <Zap className="text-green-600" size={18} />
                <div>
                  <p className="text-xs text-gray-600">連続記録</p>
                  <p className="text-base font-bold text-green-600">
                    {stats.currentStreak}日
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200"
            >
              <div className="flex items-center gap-2">
                <Gift className="text-yellow-600" size={18} />
                <div>
                  <p className="text-xs text-gray-600">獲得バッジ</p>
                  <p className="text-base font-bold text-yellow-600">
                    {stats.totalBadges}個
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* アクションボタン */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mb-6"
      >
        <div className="space-y-3">
          <GamingButton
            variant="primary"
            size="lg"
            fullWidth
            pulse
            onClick={() => router.push('/capture')}
          >
            <Camera size={24} />
            <span>飲み物を記録する</span>
            <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
              +ポイント
            </span>
          </GamingButton>

          <GamingButton
            variant="purple"
            size="lg"
            fullWidth
            onClick={() => router.push('/checkin')}
          >
            <Target size={24} />
            <span>店舗にチェックイン</span>
            <span className="ml-auto bg-white/20 px-2 py-1 rounded-full text-xs">
              2倍ポイント
            </span>
          </GamingButton>
        </div>
      </motion.div>

      {/* デイリーミッション */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mb-6"
      >
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="text-gradient">デイリーミッション</span>
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
            NEW
          </span>
        </h2>
        
        <div className="space-y-2">
          {[
            { title: '3種類の飲み物を記録', progress: 1, total: 3, reward: 50 },
            { title: '店舗にチェックイン', progress: 0, total: 1, reward: 100 },
            { title: '合計500pt獲得', progress: stats.todayPoints, total: 500, reward: 200 }
          ].map((mission, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{mission.title}</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  +{mission.reward}pt
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(mission.progress / mission.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {mission.progress}/{mission.total}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* クイックリンク */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 pb-24"
      >
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/leaderboard')}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <Trophy className="text-purple-600 mx-auto mb-2" size={24} />
            <span className="text-xs font-medium">ランキング</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/characters')}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <Users className="text-blue-600 mx-auto mb-2" size={24} />
            <span className="text-xs font-medium">キャラクター</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/profile')}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <Gift className="text-green-600 mx-auto mb-2" size={24} />
            <span className="text-xs font-medium">バッジ</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}