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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" />
      
      {/* ヘッダー */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-20 blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse" />
        </div>
        
        <div className="relative z-10 px-4 pt-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="text-xs font-semibold text-white/80 mb-2">KANPAI! by Suntory</div>
            <h1 className="text-2xl font-bold mb-2">キャラクター図鑑</h1>
            <p className="text-white/80 text-sm">
              {userCharacters.length}/{CHARACTERS.length} キャラクター解放済み
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20">
        {/* タブ切り替え */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex mb-6 bg-white rounded-2xl p-1 shadow-xl"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTab('all')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all font-medium ${
              selectedTab === 'all' 
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' 
                : 'text-gray-600 hover:text-primary hover:bg-primary/5'
            }`}
          >
            すべて
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTab('owned')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all font-medium ${
              selectedTab === 'owned' 
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg' 
                : 'text-gray-600 hover:text-primary hover:bg-primary/5'
            }`}
          >
            所持中
          </motion.button>
        </motion.div>

        {/* キャラクターグリッド */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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
                  className={`bg-white rounded-3xl p-4 shadow-xl relative transition-all duration-300 hover:scale-105 ${!isOwned ? 'opacity-75' : 'cursor-pointer'}`}
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`mt-2 text-xs px-3 py-1.5 rounded-full transition-all font-medium ${
                          isSelected 
                            ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-md' 
                            : 'bg-gradient-to-r from-primary/10 to-primary/20 text-primary hover:from-primary/20 hover:to-primary/30'
                        }`}
                      >
                        {isSelected ? '使用中' : '選択'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* キャラクター詳細説明 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h3 className="font-bold mb-4 text-primary-dark text-lg">🎆 キャラクター解放条件</h3>
          <div className="space-y-3">
            {[
              { name: '天然水ちゃん', condition: '初期解放' },
              { name: 'プレモル太郎', condition: '生ビールを1杯飲む' },
              { name: '角ハイくん', condition: 'ハイボールを1杯飲む' },
              { name: '翠ちゃん', condition: 'ジンソーダを1杯飲む' },
              { name: 'レモンサワー子', condition: 'サワーを1杯飲む' },
              { name: 'オールフリー先輩', condition: 'ノンアルを3杯飲む' }
            ].map((char, index) => {
              const isUnlocked = userCharacters.some(uc => uc.character_type === CHARACTERS.find(c => c.name === char.name)?.id)
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isUnlocked ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isUnlocked ? '✓' : '🔒'}
                    </div>
                    <span className="font-medium text-sm">{char.name}</span>
                  </div>
                  <span className="text-xs text-gray-600">{char.condition}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
            <p className="text-sm text-yellow-700 text-center">
              💡 ヒント: 対応する飲み物を撮影すると自動的にキャラクターが解放されます！
            </p>
          </div>
        </motion.div>
        
        {/* ボトムスペーシング */}
        <div className="pb-24"></div>
      </div>
    </div>
  )
}