'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Wifi, QrCode, ChevronRight, Clock, Award, Beer } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface Venue {
  id: string
  name: string
  address: string
  is_restaurant: boolean
  special_bonus_points: number
  distance?: number
}

interface CheckIn {
  id: string
  venue_id: string
  checked_in_at: string
  is_active: boolean
  venue?: Venue
}

export default function CheckInPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([])
  const [currentCheckIn, setCurrentCheckIn] = useState<CheckIn | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanningBeacon, setScanningBeacon] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [demoMode, setDemoMode] = useState(true) // デモモード
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      await checkAuth()
      await fetchVenues()
      await checkCurrentCheckIn()
    }
    initializePage()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirectedFrom=/checkin')
    }
  }

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_restaurant', true)
        .order('name')

      if (error) {
        console.error('Venues fetch error:', error)
        throw error
      }
      
      let venueList = data || []
      
      // データがない場合は初期データをセットアップ
      if (venueList.length === 0) {
        console.log('店舗データが見つからないため、セットアップを実行します...')
        const setupResponse = await fetch('/api/setup-venues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (setupResponse.ok) {
          const setupResult = await setupResponse.json()
          console.log('セットアップ完了:', setupResult)
          
          // 再度取得
          const { data: newData } = await supabase
            .from('venues')
            .select('*')
            .eq('is_restaurant', true)
            .order('name')
          
          venueList = newData || []
        }
      }
      
      setVenues(venueList)
      
      // デモ用：ランダムに距離を設定
      const venuesWithDistance = venueList.map(v => ({
        ...v,
        distance: Math.floor(Math.random() * 3000) + 100 // 100m〜3km
      })).sort((a, b) => a.distance - b.distance)
      
      const nearby = venuesWithDistance.slice(0, 3)
      setNearbyVenues(nearby)
      
      return nearby // 返り値として近くの店舗を返す
    } catch (error: any) {
      console.error('Error fetching venues:', error)
      const errorMessage = error?.message || '不明なエラー'
      toast.error(`店舗情報の取得に失敗: ${errorMessage}`)
      return []
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (data) {
        setCurrentCheckIn(data)
      }
    } catch (error) {
      // アクティブなチェックインがない場合はエラーになるが問題ない
    }
  }

  const simulateBeaconScan = async () => {
    setScanningBeacon(true)
    
    // デモ：3秒後にランダムな店舗を検出
    setTimeout(async () => {
      setScanningBeacon(false)
      
      // 店舗リストを取得（既にある場合はそれを使用）
      let availableVenues = nearbyVenues
      if (availableVenues.length === 0) {
        availableVenues = await fetchVenues()
      }
      
      if (availableVenues.length > 0) {
        // ランダムに店舗を選択（デモ用）
        const randomIndex = Math.floor(Math.random() * Math.min(3, availableVenues.length))
        const selectedVenue = availableVenues[randomIndex]
        toast.success(`ビーコン検出: ${selectedVenue.name}`)
        await handleCheckIn(selectedVenue.id, 'beacon')
      } else {
        toast.error('近くに店舗が見つかりませんでした')
      }
    }, 3000)
  }

  const handleCheckIn = async (venueId: string, method: string = 'manual') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // RPC関数を呼び出してチェックイン
      const { data, error } = await supabase
        .rpc('check_in_to_venue', {
          p_user_id: user.id,
          p_venue_id: venueId,
          p_method: method
        })

      if (error) throw error

      const venue = venues.find(v => v.id === venueId)
      toast.success(`${venue?.name}にチェックインしました！`)
      
      // ボーナスポイント表示
      if (venue?.special_bonus_points) {
        setTimeout(() => {
          toast.success(`🎉 ボーナス ${venue.special_bonus_points}pt 獲得！`, {
            duration: 5000,
            icon: '🏆'
          })
        }, 1000)
      }

      // チェックイン状態を更新
      await checkCurrentCheckIn()
      
      // 自動遷移を削除 - ユーザーが自分のタイミングで記録画面へ移動できるように
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('チェックインに失敗しました')
    }
  }

  const handleCheckOut = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .rpc('check_out_from_venue', {
          p_user_id: user.id
        })

      if (error) throw error

      toast.success('チェックアウトしました')
      setCurrentCheckIn(null)
    } catch (error) {
      console.error('Check-out error:', error)
      toast.error('チェックアウトに失敗しました')
    }
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  const getTimeSinceCheckIn = () => {
    if (!currentCheckIn) return ''
    const checkInTime = new Date(currentCheckIn.checked_in_at)
    const now = new Date()
    const diff = Math.floor((now.getTime() - checkInTime.getTime()) / 1000 / 60)
    if (diff < 60) return `${diff}分`
    return `${Math.floor(diff / 60)}時間${diff % 60}分`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
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
            <h1 className="text-2xl font-bold mb-2">チェックイン</h1>
            <p className="text-white/80 text-sm">
              店舗にチェックインして特別ボーナスをゲット！
            </p>
          </motion.div>
        </div>
      </div>

      {/* 現在のチェックイン状態 */}
      {currentCheckIn && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-b-2 border-green-200 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="font-semibold">チェックイン中</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {currentCheckIn.venue?.name}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>滞在時間: {getTimeSinceCheckIn()}</span>
              </div>
            </div>
            <button
              onClick={handleCheckOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
            >
              チェックアウト
            </button>
          </div>
        </motion.div>
      )}

      <div className="px-4 -mt-6 relative z-20 space-y-6">
        {/* デモモード表示 */}
        {demoMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-sm text-yellow-800 text-center">
              🎮 デモモード: ビーコンをシミュレートしています
            </p>
          </motion.div>
        )}

        {/* チェックイン方法 */}
        {!currentCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-xl space-y-4"
          >
            <h2 className="font-bold text-gray-900 text-lg">チェックイン方法</h2>
            
            {/* ビーコン検出 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={simulateBeaconScan}
              disabled={scanningBeacon}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 flex items-center justify-between hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Wifi className={`w-6 h-6 text-white ${scanningBeacon ? 'animate-pulse' : ''}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">
                    {scanningBeacon ? 'ビーコンを検索中...' : '自動検出'}
                  </h3>
                  <p className="text-sm text-blue-100">
                    店内のビーコンを検出
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-100" />
            </motion.button>

            {/* QRコード */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toast.info('QRコード機能は準備中です')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 flex items-center justify-between hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">QRコード</h3>
                  <p className="text-sm text-purple-100">
                    テーブルのQRをスキャン
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-100" />
            </motion.button>
          </motion.div>
        )}

        {/* 近くの店舗 */}
        {!currentCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-xl space-y-4"
          >
            <h2 className="font-bold text-gray-900 text-lg">近くの店舗</h2>
            
            <AnimatePresence>
              {nearbyVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl shadow-sm overflow-hidden border border-gray-100"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckIn(venue.id, 'manual')}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Beer className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {venue.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {venue.address}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">
                            📍 {formatDistance(venue.distance || 0)}
                          </span>
                          {venue.special_bonus_points > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              +{venue.special_bonus_points}pt ボーナス
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* すべての店舗を表示 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/venue')}
              className="w-full text-center text-primary font-medium py-3 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
            >
              すべての店舗を見る →
            </motion.button>
          </motion.div>
        )}

        {/* チェックイン中の場合のアクション */}
        {currentCheckIn && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-xl space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/capture')}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-4 font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              <Beer className="w-5 h-5" />
              飲み物を記録する
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/venue/menu')}
              className="w-full bg-white border-2 border-primary text-primary rounded-xl p-4 font-semibold hover:bg-primary/5 transition-colors"
            >
              店舗メニューを見る
            </motion.button>
          </motion.div>
        )}
      </div>
      
      {/* ボトムスペーシング */}
      <div className="pb-24"></div>
    </div>
  )
}