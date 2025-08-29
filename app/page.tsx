'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Character from '@/components/game/Character'
import { CHARACTERS } from '@/lib/characters'
import Link from 'next/link'
import { Camera, Trophy, User, MapPin } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import MobileNav from '@/components/layout/MobileNav'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userCharacters, setUserCharacters] = useState<any[]>([])
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      const { data: charactersData } = await supabase
        .from('user_characters')
        .select('*')
        .eq('user_id', user.id)

      setUserCharacters(charactersData || [])

      // 最近の記録を取得（最新5件）
      const { data: recordsData } = await supabase
        .from('consumptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentRecords(recordsData || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCharacter = CHARACTERS.find(
    char => char.id === profile?.selected_character
  ) || CHARACTERS[0]

  const selectedCharacterData = userCharacters.find(
    char => char.character_type === selectedCharacter.id
  ) || { level: 1, exp: 0, evolution_stage: 1 }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--background)] pb-20">
        <Toaster position="top-center" />
        
        <div className="gradient-bg text-white p-4">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">サントリー飲活</h1>
              <div className="text-sm">
                <span className="gold-shimmer font-bold">{profile?.total_points || 0}</span> pt
              </div>
            </div>

            <div className="flex justify-center mb-4 relative">
              <Character
                character={selectedCharacter}
                level={selectedCharacterData.level}
                exp={selectedCharacterData.exp}
                isSelected={true}
                showDetails={true}
              />
              <Link 
                href="/characters" 
                className="absolute top-0 right-0 bg-white/20 backdrop-blur rounded-full p-2 hover:bg-white/30 transition-colors"
                title="キャラクター図鑑"
              >
                <span className="text-lg">📖</span>
              </Link>
            </div>

            <div className="card glass-effect">
              <h2 className="text-primary-dark font-bold mb-2">今日のチャレンジ</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <span className="text-sm text-gray-700">3杯飲もう！</span>
                  <span className="text-xs text-primary-dark">0/3</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                  <span className="text-sm text-gray-700">新商品を試そう</span>
                  <span className="text-xs text-warning">+50pt</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link href="/capture" className="btn-primary text-center flex flex-col items-center justify-center py-6">
              <Camera className="mb-2" size={32} />
              <span>撮影・記録</span>
            </Link>
            <Link href="/venue" className="btn-secondary text-center flex flex-col items-center justify-center py-6">
              <MapPin className="mb-2" size={32} />
              <span>店舗を探す</span>
            </Link>
          </div>

          <div className="card mb-4">
            <h3 className="font-bold text-lg mb-3">最近の記録</h3>
            {recentRecords.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                まだ記録がありません
              </div>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((record) => {
                  const recordDate = new Date(record.created_at)
                  const formattedDate = `${recordDate.getMonth() + 1}/${recordDate.getDate()} ${recordDate.getHours()}:${recordDate.getMinutes().toString().padStart(2, '0')}`
                  const productTypeLabels: Record<string, string> = {
                    draft_beer: '🍺 生ビール',
                    highball: '🥃 ハイボール',
                    sour: '🍋 サワー',
                    gin_soda: '🍸 ジンソーダ',
                    non_alcohol: '🚫 ノンアル',
                    water: '💧 水',
                    softdrink: '🥤 ソフトドリンク',
                    other: '🍹 その他'
                  }
                  
                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {productTypeLabels[record.product_type]?.split(' ')[0] || '🍹'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.brand_name}</p>
                          <p className="text-xs text-gray-500">
                            {record.volume_ml}ml × {record.quantity}本
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-dark">+{record.points_earned}pt</p>
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                      </div>
                    </div>
                  )
                })}
                
                {recentRecords.length >= 5 && (
                  <Link href="/history" className="block text-center text-sm text-primary-dark hover:underline mt-2">
                    もっと見る →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileNav />
    </>
  )
}