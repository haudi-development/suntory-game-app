'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal } from 'lucide-react'
import Link from 'next/link'

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<any[]>([])
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRankings()
  }, [period])

  async function fetchRankings() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50)

      setRankings(data || [])
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      <div className="gradient-bg text-white p-4 mb-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center">ランキング</h1>
          <p className="text-center text-sm mt-2 opacity-90">
            みんなと競い合おう！
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'daily'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            デイリー
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'weekly'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            週間
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            月間
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((user, index) => {
              const rank = index + 1
              const medal = getMedalIcon(rank)
              
              return (
                <div
                  key={user.id}
                  className={`card flex items-center justify-between ${
                    rank <= 3 ? 'border-2 border-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-500">
                          {rank}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.nickname || 'ユーザー'}</p>
                      <p className="text-sm text-gray-500">
                        {user.total_points.toLocaleString()} pt
                      </p>
                    </div>
                  </div>
                  
                  {rank <= 3 && (
                    <Trophy className="text-accent" size={24} />
                  )}
                </div>
              )
            })}

            {rankings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                まだランキングデータがありません
              </div>
            )}
          </div>
        )}
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
          <Link href="/leaderboard" className="flex flex-col items-center p-2 text-primary-dark">
            <Trophy size={24} className="mb-1" />
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