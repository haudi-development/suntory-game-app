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
    checkAuth()
    fetchVenues()
    checkCurrentCheckIn()
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

      if (error) throw error
      
      const venueList = data || []
      setVenues(venueList)
      
      // デモ用：ランダムに距離を設定
      const venuesWithDistance = venueList.map(v => ({
        ...v,
        distance: Math.floor(Math.random() * 3000) + 100 // 100m〜3km
      })).sort((a, b) => a.distance - b.distance)
      
      const nearby = venuesWithDistance.slice(0, 3)
      setNearbyVenues(nearby)
      
      return nearby // 返り値として近くの店舗を返す
    } catch (error) {
      console.error('Error fetching venues:', error)
      toast.error('店舗情報の取得に失敗しました')
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
      
      // 撮影画面へ遷移
      setTimeout(() => {
        router.push('/capture')
      }, 2000)
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4">
        <h1 className="text-2xl font-bold">チェックイン</h1>
        <p className="text-sm opacity-90 mt-1">
          店舗にチェックインして特別ボーナスをゲット！
        </p>
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

      <div className="p-4 space-y-6">
        {/* デモモード表示 */}
        {demoMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              🎮 デモモード: ビーコンをシミュレートしています
            </p>
          </div>
        )}

        {/* チェックイン方法 */}
        {!currentCheckIn && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">チェックイン方法</h2>
            
            {/* ビーコン検出 */}
            <button
              onClick={simulateBeaconScan}
              disabled={scanningBeacon}
              className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wifi className={`w-6 h-6 text-blue-600 ${scanningBeacon ? 'animate-pulse' : ''}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    {scanningBeacon ? 'ビーコンを検索中...' : '自動検出'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    店内のビーコンを検出
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* QRコード */}
            <button
              onClick={() => toast.info('QRコード機能は準備中です')}
              className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">QRコード</h3>
                  <p className="text-sm text-gray-500">
                    テーブルのQRをスキャン
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {/* 近くの店舗 */}
        {!currentCheckIn && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">近くの店舗</h2>
            
            <AnimatePresence>
              {nearbyVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => handleCheckIn(venue.id, 'manual')}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* すべての店舗を表示 */}
            <button
              onClick={() => router.push('/venue')}
              className="w-full text-center text-primary font-medium py-2"
            >
              すべての店舗を見る →
            </button>
          </div>
        )}

        {/* チェックイン中の場合のアクション */}
        {currentCheckIn && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/capture')}
              className="w-full bg-primary text-white rounded-xl p-4 font-semibold flex items-center justify-center gap-2"
            >
              <Beer className="w-5 h-5" />
              飲み物を記録する
            </button>
            
            <button
              onClick={() => router.push('/venue/menu')}
              className="w-full bg-white border-2 border-primary text-primary rounded-xl p-4 font-semibold"
            >
              店舗メニューを見る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}