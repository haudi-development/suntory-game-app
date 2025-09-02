'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Loader2, AlertCircle, Edit, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadConsumptionImage, compressImage } from '@/lib/supabase/storage'
import { ErrorHandler, handleOffline } from '@/lib/error-handler'
import ManualSelectionModal from '@/components/capture/ManualSelectionModal'
import RecordEditModal from '@/components/capture/RecordEditModal'
import { useCheckIn } from '@/contexts/CheckInContext'

export default function CapturePage() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [showManualSelection, setShowManualSelection] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [analysisError, setAnalysisError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { currentCheckIn, venueMenus, isCheckedIn } = useCheckIn()

  // ページ読み込み時に認証チェック
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirectedFrom=/capture')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('画像は5MB以下にしてください')
        return
      }

      // 画像を圧縮
      const compressedFile = await compressImage(file)
      setImageFile(compressedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setImage(base64)
        analyzeImage(base64.split(',')[1])
      }
      reader.readAsDataURL(compressedFile)
    }
  }

  const analyzeImage = async (base64: string) => {
    if (handleOffline()) return
    
    setAnalyzing(true)
    setAnalysisError(false)
    
    try {
      const response = await ErrorHandler.retry(async () => {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        })
        
        if (!res.ok) {
          throw new Error('Analysis failed')
        }
        
        return res
      }, 2, 2000)

      const data = await response.json()
      setAnalysis(data.analysis)
      setPoints(data.points)
      toast.success('画像を解析しました！')
    } catch (error) {
      const appError = ErrorHandler.handle(error)
      ErrorHandler.notify(appError)
      setAnalysisError(true)
      
      // エラー時は手動選択を促す
      setTimeout(() => {
        setShowManualSelection(true)
      }, 2000)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleManualSelect = (product: any) => {
    setAnalysis(product)
    setPoints(product.points_per_unit || 10)
    setAnalysisError(false)
    toast.success('商品を選択しました')
  }

  const handleEditSave = (editedRecord: any) => {
    setAnalysis({
      ...analysis,
      ...editedRecord
    })
    toast.success('記録を更新しました')
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
        router.push('/login?redirectedFrom=/capture')
        return
      }

      // 消費記録を作成
      const { data: consumptionData, error } = await supabase
        .from('consumptions')
        .insert({
          user_id: user.id,
          brand_name: analysis.brand_name,
          product_type: analysis.product_type,
          volume_ml: analysis.volume_ml,
          quantity: analysis.quantity,
          points_earned: points,
          ai_analysis: analysis,
        } as any)
        .select()
        .single()

      if (error) throw error

      // 画像をStorageにアップロード
      if (imageFile && consumptionData) {
        const uploadResult = await uploadConsumptionImage({
          file: imageFile,
          userId: user.id,
          consumptionId: consumptionData.id
        })

        if (uploadResult.success) {
          toast.success('画像を保存しました')
        } else {
          console.error('Image upload failed:', uploadResult.error)
        }
      }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
        
        <div className="relative z-10 px-4 pt-16 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-2xl font-bold mb-2">飲み物を記録</h1>
            <p className="text-white/80 text-sm">
              {isCheckedIn ? '店舗メニューから選択できます' : 'AIが自動で解析します'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* チェックイン状態表示 */}
      {isCheckedIn && currentCheckIn && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-b-2 border-green-200 p-4 mb-6"
        >
          <div className="max-w-md mx-auto flex items-center gap-2 text-green-700">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentCheckIn.venue?.name}にチェックイン中 - ボーナス2倍！
            </span>
          </div>
        </motion.div>
      )}

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!image && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl mb-6"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-primary rounded-xl flex flex-col items-center justify-center hover:bg-primary/5 transition-all duration-300 hover:scale-105"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-primary mb-4"
              >
                <Camera size={48} />
              </motion.div>
              <span className="text-primary-dark font-medium text-lg mb-2">タップして撮影</span>
              <span className="text-sm text-gray-500">または画像を選択</span>
            </button>
          </motion.div>
        )}

        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl mb-6"
          >
            <div className="flex flex-col items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-primary mb-4"
              >
                <Loader2 size={48} />
              </motion.div>
              <p className="text-primary-dark font-medium text-lg">AI解析中...</p>
              <p className="text-sm text-gray-500 mt-2">少々お待ちください</p>
            </div>
          </motion.div>
        )}

        {image && !analyzing && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 shadow-xl">
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

                    <div className={`${analysis.is_suntory !== false ? 'bg-primary/10' : 'bg-gray-100'} p-3 rounded-lg relative`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold ${analysis.is_suntory !== false ? 'text-primary-dark' : 'text-gray-700'}`}>
                          解析結果
                        </h3>
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">商品:</span> {analysis.brand_name}</p>
                        <p><span className="font-medium">種類:</span> {analysis.product_type}</p>
                        <p><span className="font-medium">容量:</span> {analysis.volume_ml}ml</p>
                        <p><span className="font-medium">数量:</span> {analysis.quantity}本</p>
                        {analysis.container && (
                          <p><span className="font-medium">容器:</span> {analysis.container}</p>
                        )}
                        <p><span className="font-medium">信頼度:</span> {Math.round((analysis.confidence || 1) * 100)}%</p>
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
                          setImageFile(null)
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
                            setImageFile(null)
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

        {analysisError && !analyzing && (
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">解析に失敗しました</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  画像から商品を特定できませんでした。手動で商品を選択してください。
                </p>
                <button
                  onClick={() => setShowManualSelection(true)}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  商品を手動で選択
                </button>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-3xl p-6 shadow-xl"
        >
          <h3 className="font-bold mb-3 text-primary-dark">📸 撮影のコツ</h3>
          <div className="space-y-2">
            {[
              '商品ラベルが見えるように撮影',
              '明るい場所で撮影', 
              '複数本ある場合は全体を撮影'
            ].map((tip, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm text-gray-600">{tip}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <ManualSelectionModal
        isOpen={showManualSelection}
        onClose={() => setShowManualSelection(false)}
        onSelect={handleManualSelect}
      />

      <RecordEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        initialData={analysis || {}}
        venueMenus={venueMenus}
        isRestaurantMode={isCheckedIn}
      />
    </div>
  )
}