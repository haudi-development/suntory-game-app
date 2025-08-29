'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CHARACTERS } from '@/lib/characters'
import Character from '@/components/game/Character'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function CharactersPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userCharacters, setUserCharacters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'owned'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
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
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function selectCharacter(characterId: string) {
    const userChar = userCharacters.find(uc => uc.character_type === characterId)
    
    if (!userChar) {
      toast.error('このキャラクターはまだ解放されていません')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_character: characterId })
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, selected_character: characterId })
      toast.success('キャラクターを変更しました！')
    } catch (error) {
      console.error('Error updating character:', error)
      toast.error('キャラクターの変更に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  const ownedCharacters = CHARACTERS.filter(char => 
    userCharacters.some(uc => uc.character_type === char.id)
  )

  const displayCharacters = selectedTab === 'all' ? CHARACTERS : ownedCharacters

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Toaster position="top-center" />
      
      <div className="gradient-bg text-white p-4 mb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2">キャラクター図鑑</h1>
          <p className="text-center text-sm opacity-90">
            {userCharacters.length}/{CHARACTERS.length} キャラクター解放済み
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* タブ切り替え */}
        <div className="flex mb-4 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setSelectedTab('all')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              selectedTab === 'all' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setSelectedTab('owned')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              selectedTab === 'owned' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            所持中
          </button>
        </div>

        {/* キャラクターグリッド */}
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {displayCharacters.map((character, index) => {
              const userChar = userCharacters.find(uc => uc.character_type === character.id)
              const isOwned = !!userChar
              const isSelected = profile?.selected_character === character.id

              return (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card relative ${!isOwned ? 'opacity-75' : ''}`}
                  onClick={() => isOwned && selectCharacter(character.id)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircle className="text-green-500" size={24} />
                    </div>
                  )}

                  {!isOwned && (
                    <div className="absolute top-2 left-2 z-10">
                      <Lock className="text-gray-400" size={20} />
                    </div>
                  )}

                  <div className="flex flex-col items-center">
                    <Character
                      character={character}
                      level={userChar?.level || 1}
                      exp={userChar?.exp || 0}
                      isSelected={false}
                      showDetails={false}
                    />
                    <h3 className="font-bold text-sm mt-2">{character.name}</h3>
                    
                    {isOwned ? (
                      <>
                        <p className="text-xs text-gray-600">Lv.{userChar.level}</p>
                        <div className="w-full mt-2">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(userChar.exp % 100)}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">未解放</p>
                    )}

                    {isOwned && (
                      <button
                        className={`mt-2 text-xs px-3 py-1 rounded-full transition-colors ${
                          isSelected 
                            ? 'bg-green-500 text-white' 
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {isSelected ? '使用中' : '選択'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* キャラクター詳細説明 */}
        <div className="mt-6 card">
          <h3 className="font-bold mb-3">キャラクター解放条件</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <span className="font-medium">天然水ちゃん</span>: 初期解放</p>
            <p>• <span className="font-medium">プレモル太郎</span>: 生ビールを1杯飲む</p>
            <p>• <span className="font-medium">角ハイくん</span>: ハイボールを1杯飲む</p>
            <p>• <span className="font-medium">翠ちゃん</span>: ジンソーダを1杯飲む</p>
            <p>• <span className="font-medium">レモンサワー子</span>: サワーを1杯飲む</p>
            <p>• <span className="font-medium">オールフリー先輩</span>: ノンアルを3杯飲む</p>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              💡 ヒント: 対応する飲み物を撮影すると自動的にキャラクターが解放されます！
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}