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
        router.push('/login')
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="gradient-bg text-white p-4 mb-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">マイページ</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm opacity-90 hover:opacity-100"
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold">{profile?.nickname || 'ユーザー'}</p>
            <p className="text-lg mt-2">
              <span className="gold-shimmer font-bold">{profile?.total_points || 0}</span> pt
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🎮</span> キャラクターコレクション
            </h2>
            <Link href="/characters" className="text-sm text-primary-dark hover:underline">
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
                <div 
                  key={character.id} 
                  className={`text-center cursor-pointer transition-transform hover:scale-105 ${
                    isSelected ? 'ring-2 ring-primary rounded-lg p-2' : 'p-2'
                  }`}
                  onClick={() => handleCharacterSelect(character.id)}
                >
                  <Character
                    character={character}
                    level={userData.level}
                    exp={userData.exp}
                    isSelected={isSelected}
                    showDetails={false}
                  />
                  <p className="text-xs mt-1 font-medium">{character.name}</p>
                  <p className="text-xs text-gray-500">Lv.{userData.level}</p>
                  {isSelected && (
                    <p className="text-xs text-green-600 font-bold">使用中</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card mb-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award size={20} />
            称号・バッジ
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map(badge => {
              const earned = userBadges.includes(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`text-center p-2 rounded-lg ${
                    earned ? 'bg-accent/10' : 'bg-gray-100 opacity-50'
                  }`}
                  title={badge.description}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="text-xs">{badge.name}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            統計
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">総記録数</p>
              <p className="text-xl font-bold text-primary-dark">0</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">今月の記録</p>
              <p className="text-xl font-bold text-primary-dark">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}