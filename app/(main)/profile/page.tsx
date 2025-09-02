'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CHARACTERS } from '@/lib/characters'
import { LogOut, Award, Calendar, Check, Sparkles, X, MapPin, Clock, Camera } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const BADGES = [
  { id: 'first_drink', name: 'はじめての一杯', icon: '🍺', description: '初回記録' },
  { id: '3days_streak', name: '3日連続来店', icon: '🔥', description: '連続記録達成' },
  { id: 'explorer', name: '全国制覇への道', icon: '🗾', description: '5店舗訪問' },
  { id: 'champion', name: '週間チャンピオン', icon: '🏆', description: '週間ランキング1位' },
  { id: 'hydration', name: '水分補給マスター', icon: '💧', description: '水を含めて記録' },
  { id: 'night_owl', name: 'ナイトオウル', icon: '🌙', description: '22時以降10回' },
  { id: 'day_drinker', name: '昼飲みの達人', icon: '☀️', description: '15時前5回' },
  { id: 'perfect_week', name: 'パーフェクトウィーク', icon: '🎯', description: '7日連続' },
  { id: 'variety', name: 'バラエティ飲み', icon: '🌈', description: '10種類制覇' },
  { id: 'legend', name: 'レジェンド', icon: '👑', description: '総ポイント1000' },
]

const characterEmojis: Record<string, string> = {
  premol: '🍺',
  kakuhai: '🥃',
  midori: '🍸',
  lemon: '🍋',
  allfree: '🍻',
  tennensui: '💧',
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userCharacters, setUserCharacters] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<string[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  async function fetchUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirectedFrom=/profile')
        return
      }

      setUser(user)

      const [profileData, charactersData, badgesData, activityData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_characters').select('*').eq('user_id', user.id),
        supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
        supabase
          .from('consumptions')
          .select('*, venues(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      setProfile(profileData.data)
      setUserCharacters(charactersData.data || [])
      setUserBadges((badgesData.data || []).map(b => b.badge_id))
      setRecentActivity(activityData.data || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('ログアウトしました')
    router.push('/login')
  }

  const handleCharacterSelect = async (characterId: string) => {
    if (profile?.selected_character === characterId) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_character: characterId } as any)
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, selected_character: characterId })
      toast.success(`キャラクターを変更しました！`)
    } catch (error) {
      toast.error('変更に失敗しました')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" />
      
      {/* ヘッダー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600 pb-12">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400 rounded-full opacity-20 blur-xl animate-pulse" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 pt-6 pb-2 text-white"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">マイページ</h1>
            <p className="text-white/80 text-sm">あなたの飲活記録</p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-24">
        {/* プロフィールカード */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-6 -mt-8 relative z-20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profile?.display_name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile?.display_name || profile?.nickname || 'ユーザー'}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <p className="text-2xl font-bold text-blue-600">{profile?.total_points || 0}</p>
              <p className="text-xs text-gray-600">総ポイント</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <p className="text-2xl font-bold text-purple-600">
                Lv.{Math.floor((profile?.total_points || 0) / 100) + 1}
              </p>
              <p className="text-xs text-gray-600">レベル</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <p className="text-2xl font-bold text-green-600">{userBadges.length}</p>
              <p className="text-xs text-gray-600">バッジ</p>
            </div>
          </div>
        </motion.div>

        {/* キャラクターコレクション */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={20} />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                キャラクターコレクション
              </span>
            </h2>
            <Link href="/characters" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              図鑑を見る →
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.map((character, index) => {
              const userData = userCharacters.find(
                c => c.character_type === character.id
              ) || { level: 1, exp: 0 }
              const isSelected = profile?.selected_character === character.id
              
              return (
                <motion.div 
                  key={character.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative text-center cursor-pointer transition-all duration-300 rounded-2xl ${
                    isSelected 
                      ? 'ring-2 ring-offset-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 p-3 shadow-lg' 
                      : 'p-3 hover:bg-gray-50 bg-white border border-gray-200'
                  }`}
                  onClick={() => handleCharacterSelect(character.id)}
                >
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 z-10"
                    >
                      <Check size={14} />
                    </motion.div>
                  )}
                  
                  <div className="w-full aspect-square flex items-center justify-center mb-2">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isSelected 
                        ? 'bg-gradient-to-br from-blue-200 to-purple-200' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <span className="text-3xl">{characterEmojis[character.id] || '🎮'}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs font-bold truncate">{character.name}</p>
                  <p className="text-xs text-gray-500">Lv.{userData.level}</p>
                  
                  <div className="mt-1">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                        style={{ width: `${Math.min(100, userData.exp)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* バッジコレクション */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-6"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              称号・バッジ
            </span>
          </h2>
          
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map((badge, index) => {
              const earned = userBadges.includes(badge.id)
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`text-center p-3 rounded-2xl transition-all hover:scale-105 ${
                    earned 
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300' 
                      : 'bg-gray-100 opacity-50'
                  }`}
                  title={badge.description}
                >
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <p className="text-xs leading-tight font-medium">{badge.name}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* アクティビティ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="text-green-500" size={20} />
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              最近のアクティビティ
            </span>
          </h2>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const productEmoji = {
                  'draft_beer': '🍺',
                  'highball': '🥃',
                  'sour': '🍋',
                  'wine': '🍷',
                  'sake': '🍶',
                  'soft_drink': '🥤',
                  'can_beer': '🍻',
                  'can_highball': '🥃',
                  'bottled_water': '💧'
                }[activity.product_type] || '🍹'
                
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(activity.created_at).getTime()
                  const hours = Math.floor(diff / (1000 * 60 * 60))
                  const days = Math.floor(hours / 24)
                  if (days > 0) return `${days}日前`
                  if (hours > 0) return `${hours}時間前`
                  const minutes = Math.floor(diff / (1000 * 60))
                  return minutes > 0 ? `${minutes}分前` : 'たった今'
                })()
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedActivity(activity)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl">{productEmoji}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.product_name || 'ドリンク'}を記録
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.venues?.name || activity.venue_name || '未設定'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+{activity.points_earned}pt</p>
                      <p className="text-xs text-gray-500">{timeAgo}</p>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🍺</div>
                <p className="text-sm">まだ記録がありません</p>
                <p className="text-xs mt-1">飲み物を記録してポイントを獲得しよう！</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* アクティビティ詳細モーダル */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* モーダルヘッダー */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">記録の詳細</h3>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <X className="text-white" size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* 写真エリア */}
                {selectedActivity.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={selectedActivity.image_url}
                      alt="記録写真"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="text-gray-400 mx-auto mb-2" size={48} />
                      <p className="text-gray-500 text-sm">写真はありません</p>
                    </div>
                  </div>
                )}

                {/* 商品情報 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">
                      {{
                        'draft_beer': '🍺',
                        'highball': '🥃',
                        'sour': '🍋',
                        'wine': '🍷',
                        'sake': '🍶',
                        'soft_drink': '🥤',
                        'can_beer': '🍻',
                        'can_highball': '🥃',
                        'bottled_water': '💧'
                      }[selectedActivity.product_type] || '🍹'}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">
                        {selectedActivity.product_name || 'ドリンク'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedActivity.brand_name || 'サントリー'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-gray-500 text-xs">タイプ</p>
                      <p className="font-medium">{selectedActivity.product_type || '不明'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-gray-500 text-xs">容量</p>
                      <p className="font-medium">{selectedActivity.volume_ml || 0}ml</p>
                    </div>
                  </div>
                </div>

                {/* 店舗情報 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="text-green-600" size={20} />
                    <h4 className="font-bold">店舗情報</h4>
                  </div>
                  <p className="font-medium">
                    {selectedActivity.venues?.name || selectedActivity.venue_name || '未設定'}
                  </p>
                  {selectedActivity.venues?.address && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedActivity.venues.address}
                    </p>
                  )}
                </div>

                {/* ポイントと時間 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="text-yellow-600" size={16} />
                      <p className="text-sm text-gray-600">獲得ポイント</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      +{selectedActivity.points_earned}pt
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="text-purple-600" size={16} />
                      <p className="text-sm text-gray-600">記録日時</p>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(selectedActivity.created_at).toLocaleDateString('ja-JP')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(selectedActivity.created_at).toLocaleTimeString('ja-JP', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                {/* AI判定情報 */}
                {selectedActivity.ai_confidence && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-2">AI判定信頼度</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                        style={{ width: `${selectedActivity.ai_confidence * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.round(selectedActivity.ai_confidence * 100)}%
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}