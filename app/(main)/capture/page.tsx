'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

export default function CapturePage() {
  const [image, setImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('画像は5MB以下にしてください')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setImage(base64)
        analyzeImage(base64.split(',')[1])
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setPoints(data.points)
      toast.success('画像を解析しました！')
    } catch (error) {
      toast.error('画像解析に失敗しました')
      console.error(error)
    } finally {
      setAnalyzing(false)
    }
  }

  const saveRecord = async () => {
    if (!analysis) return

    // Don't save non-Suntory products
    if (analysis.is_suntory === false) {
      toast.error('サントリー製品のみ記録できます')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase.from('consumptions').insert({
        user_id: user.id,
        brand_name: analysis.brand_name,
        product_type: analysis.product_type,
        volume_ml: analysis.volume_ml,
        quantity: analysis.quantity,
        points_earned: points,
        ai_analysis: analysis,
      } as any)

      if (error) throw error

      // キャラクター解放チェック
      const characterUnlockMap: Record<string, string> = {
        'draft_beer': 'premol',
        'highball': 'kakuhai',
        'gin_soda': 'sui',
        'sour': 'lemon',
        'non_alcohol': 'allfree',
      }

      const characterToUnlock = characterUnlockMap[analysis.product_type]
      
      if (characterToUnlock) {
        // すでに解放済みか確認
        const { data: existingChar } = await supabase
          .from('user_characters')
          .select('id')
          .eq('user_id', user.id)
          .eq('character_type', characterToUnlock)
          .single()

        if (!existingChar) {
          // キャラクターを解放
          await supabase
            .from('user_characters')
            .insert({
              user_id: user.id,
              character_type: characterToUnlock,
              level: 1,
              exp: 0,
              evolution_stage: 1,
            } as any)

          const characterNames: Record<string, string> = {
            'premol': 'プレモル太郎',
            'kakuhai': '角ハイくん',
            'sui': '翠ちゃん',
            'lemon': 'レモンサワー子',
            'allfree': 'オールフリー先輩',
          }

          toast.success(`🎉 ${characterNames[characterToUnlock]}が解放されました！`, {
            duration: 5000,
          })
        }
      }

      // Only update points if there are points to add
      if (points > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('user_id', user.id)
          .single()

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ total_points: (profileData?.total_points || 0) + points } as any)
          .eq('user_id', user.id)

        if (profileError) throw profileError

        toast.success(`${points}ポイント獲得！`)
        
        // バッジチェック（非同期で実行）
        import('@/lib/badges/system').then(({ checkAndGrantBadges }) => {
          checkAndGrantBadges(user.id).then(newBadges => {
            newBadges.forEach(badgeName => {
              setTimeout(() => {
                toast.success(`🎖️ バッジ「${badgeName}」を獲得しました！`, {
                  duration: 5000,
                })
              }, 2000)
            })
          })
        })
      }
      
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      toast.error('記録の保存に失敗しました')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="gradient-bg text-white p-4 mb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center">飲み物を記録</h1>
          <p className="text-center text-sm mt-2 opacity-90">
            AIが自動で解析します
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!image && !analyzing && (
          <div className="card">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-primary rounded-xl flex flex-col items-center justify-center hover:bg-primary/5 transition-colors"
            >
              <Camera size={48} className="text-primary mb-4" />
              <span className="text-primary-dark font-medium">タップして撮影</span>
              <span className="text-sm text-gray-500 mt-2">または画像を選択</span>
            </button>
          </div>
        )}

        {analyzing && (
          <div className="card">
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="animate-spin text-primary mb-4" size={48} />
              <p className="text-primary-dark font-medium">解析中...</p>
              <p className="text-sm text-gray-500 mt-2">少々お待ちください</p>
            </div>
          </div>
        )}

        {image && !analyzing && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="card">
                <img
                  src={image}
                  alt="Captured"
                  className="w-full rounded-lg mb-4"
                />
                
                {analysis && (
                  <div className="space-y-3">
                    {analysis.error_message && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                        <p className="text-red-700 font-medium text-sm">
                          {analysis.error_message}
                        </p>
                        {!analysis.is_suntory && analysis.product_type !== 'other' && (
                          <p className="text-red-600 text-xs mt-1">
                            サントリー製品のみポイント獲得対象です
                          </p>
                        )}
                      </div>
                    )}

                    <div className={`${analysis.is_suntory !== false ? 'bg-primary/10' : 'bg-gray-100'} p-3 rounded-lg`}>
                      <h3 className={`font-bold ${analysis.is_suntory !== false ? 'text-primary-dark' : 'text-gray-700'} mb-2`}>
                        解析結果
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">商品:</span> {analysis.brand_name}</p>
                        <p><span className="font-medium">種類:</span> {analysis.product_type}</p>
                        <p><span className="font-medium">容量:</span> {analysis.volume_ml}ml</p>
                        <p><span className="font-medium">数量:</span> {analysis.quantity}本</p>
                        <p><span className="font-medium">信頼度:</span> {Math.round(analysis.confidence * 100)}%</p>
                        {analysis.is_suntory !== undefined && (
                          <p>
                            <span className="font-medium">サントリー製品:</span>{' '}
                            <span className={analysis.is_suntory ? 'text-green-600' : 'text-red-600'}>
                              {analysis.is_suntory ? '✓' : '✗'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {analysis.is_suntory !== false && (
                      <div className="text-center p-4 bg-accent/10 rounded-lg">
                        <p className="text-2xl font-bold text-accent">
                          +{points} ポイント
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setImage(null)
                          setAnalysis(null)
                          setPoints(0)
                        }}
                        className="btn-secondary"
                      >
                        撮り直す
                      </button>
                      {analysis.is_suntory !== false ? (
                        <button
                          onClick={saveRecord}
                          className="btn-primary"
                        >
                          記録する
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setImage(null)
                            setAnalysis(null)
                            setPoints(0)
                          }}
                          className="btn-primary"
                        >
                          別の商品を撮影
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!analysis && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setImage(null)}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary"
                  >
                    撮り直す
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-6 card">
          <h3 className="font-bold mb-2">撮影のコツ</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 商品ラベルが見えるように撮影</li>
            <li>• 明るい場所で撮影</li>
            <li>• 複数本ある場合は全体を撮影</li>
          </ul>
        </div>
      </div>
    </div>
  )
}