'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Clock, QrCode } from 'lucide-react'
import Link from 'next/link'

export default function VenuePage() {
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchVenues()
  }, [])

  async function fetchVenues() {
    try {
      const { data } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false })

      setVenues(data || [])
    } catch (error) {
      console.error('Error fetching venues:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      <div className="gradient-bg text-white p-4 mb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center">提携店舗</h1>
          <p className="text-center text-sm mt-2 opacity-90">
            お近くの店舗を探そう
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {venues.map(venue => (
              <div key={venue.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-primary-dark">
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin size={14} />
                      <span>{venue.address}</span>
                    </div>
                  </div>
                  <QrCode className="text-primary" size={24} />
                </div>

                <div className="bg-primary/10 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-primary-dark mb-1">
                    限定チャレンジ
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• ハッピーアワー倍率 2倍（17:00-19:00）</li>
                    <li>• 店舗限定バッジあり</li>
                  </ul>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>営業中</span>
                  </div>
                  <button className="text-sm text-primary-dark font-medium hover:underline">
                    チェックイン
                  </button>
                </div>
              </div>
            ))}

            {venues.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                店舗情報を取得できませんでした
              </div>
            )}
          </div>
        )}

        <div className="mt-6 card bg-accent/10 border-2 border-accent">
          <h3 className="font-bold text-accent mb-2">店舗登録キャンペーン</h3>
          <p className="text-sm text-gray-700">
            お店で登録すると初回ボーナス100ptプレゼント！
          </p>
        </div>
      </div>

      <nav className="mobile-nav safe-area-inset">
        <div className="flex justify-around">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-600">
            <div className="text-2xl mb-1">🏠</div>
            <span className="text-xs">ホーム</span>
          </Link>
          <Link href="/capture" className="flex flex-col items-center p-2 text-gray-600">
            <div className="text-2xl mb-1">📷</div>
            <span className="text-xs">撮影</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center p-2 text-gray-600">
            <div className="text-2xl mb-1">🏆</div>
            <span className="text-xs">ランキング</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2 text-gray-600">
            <div className="text-2xl mb-1">👤</div>
            <span className="text-xs">マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}