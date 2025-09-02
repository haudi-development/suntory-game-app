'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Trophy, Gift, Sparkles, TrendingUp, Users, Target, Zap } from 'lucide-react'
import { GamingButton } from '@/components/ui/GamingButton'
import Image from 'next/image'
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
      
      {/* ヘッダー */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-30 blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-30 blur-xl animate-pulse" />
        </div>
        
        <div className="relative z-10 px-4 pt-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-2xl font-bold mb-2">
              おかえりなさい、{profile?.display_name || 'ゲスト'}さん！
            </h1>
            <p className="text-white/80">今日も素敵な一日を🍻</p>
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
        <div className="glass rounded-3xl p-6 shadow-xl">
          {/* レベルとポイント */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">現在のレベル</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gradient">
                  Lv.{Math.floor((profile?.total_points || 0) / 100) + 1}
                </span>
                <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">総ポイント</p>
              <span className="text-3xl font-bold text-gradient-gold">
                {profile?.total_points || 0}
              </span>
              <span className="text-sm text-gray-600 ml-1">pt</span>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>次のレベルまで</span>
              <span>{100 - ((profile?.total_points || 0) % 100)} pt</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((profile?.total_points || 0) % 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-gold)' }}
              />
            </div>
          </div>

          {/* 選択中のキャラクター */}
          {profile?.selected_character && (
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                <Image
                  src={`/characters/${profile.selected_character}/level1.png`}
                  alt="Character"
                  width={120}
                  height={120}
                  className="drop-shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/characters/premol/level1.png'
                  }}
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md">
                  <span className="text-xs font-bold text-gray-700">
                    {profile.selected_character}
                  </span>
                </div>
              </motion.div>
            </div>
          )}

          {/* クイックスタッツ */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">今日の獲得</p>
                  <p className="text-lg font-bold text-blue-600">
                    {stats.todayPoints} pt
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2">
                <Trophy className="text-purple-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">週間ランク</p>
                  <p className="text-lg font-bold text-purple-600">
                    {stats.weeklyRank}位
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2">
                <Zap className="text-green-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">連続記録</p>
                  <p className="text-lg font-bold text-green-600">
                    {stats.currentStreak}日
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2">
                <Gift className="text-yellow-600" size={20} />
                <div>
                  <p className="text-xs text-gray-600">獲得バッジ</p>
                  <p className="text-lg font-bold text-yellow-600">
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