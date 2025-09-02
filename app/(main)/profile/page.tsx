'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Character from '@/components/game/Character'
import { CHARACTERS } from '@/lib/characters'
import { LogOut, Award, Calendar } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userCharacters, setUserCharacters] = useState<any[]>([])
  const [userBadges, setUserBadges] = useState<string[]>([])
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

      const [profileData, charactersData, badgesData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('user_characters').select('*').eq('user_id', user.id),
        supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
      ])

      setProfile(profileData.data)
      setUserCharacters(charactersData.data || [])
      setUserBadges((badgesData.data || []).map(b => b.badge_id))
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
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_character: characterId } as any)
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, selected_character: characterId })
      toast.success('キャラクターを変更しました')
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
      {/* ヘッダー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse" />
        </div>
        
        <div className="relative z-10 px-4 pt-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs font-semibold text-white/80">KANPAI! by Suntory</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                <LogOut size={14} />
                ログアウト
              </motion.button>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">マイページ</h1>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4">
              <p className="text-2xl font-bold">{profile?.nickname || 'ユーザー'}さん</p>
              <p className="text-lg mt-2">
                <span className="text-yellow-300 font-bold">{profile?.total_points || 0}</span> pt
              </p>
              <div className="text-sm text-white/80 mt-2">
                Lv.{Math.floor((profile?.total_points || 0) / 100) + 1}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 relative z-20 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary-dark">
              <span>🎮</span> キャラクターコレクション
            </h2>
            <Link href="/characters" className="text-sm text-primary hover:text-primary-dark font-medium hover:underline">
              図鑑を見る →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {CHARACTERS.map(character => {
              const userData = userCharacters.find(
                c => c.character_type === character.id
              ) || { level: 1, exp: 0 }
              const isSelected = profile?.selected_character === character.id
              
              return (
                <motion.div 
                  key={character.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-center cursor-pointer transition-all duration-300 rounded-2xl ${
                    isSelected ? 'ring-2 ring-primary bg-primary/10 p-2 shadow-md' : 'p-2 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCharacterSelect(character.id)}
                >
                  <div className="w-full aspect-square flex items-center justify-center">
                    <Character
                      character={character}
                      level={userData.level}
                      exp={userData.exp}
                      isSelected={isSelected}
                      showDetails={false}
                    />
                  </div>
                  <p className="text-xs mt-1 font-medium truncate">{character.name}</p>
                  <p className="text-xs text-gray-500">Lv.{userData.level}</p>
                  {isSelected && (
                    <div className="mt-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      使用中
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-6"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary-dark">
            <Award size={20} />
            称号・バッジ
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

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary-dark">
            <Calendar size={20} />
            統計
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">総記録数</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">0</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">今月の記録</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">0</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}