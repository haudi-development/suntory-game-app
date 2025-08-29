'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Award, Calendar, Clock, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<any>({
    daily: [],
    weekly: [],
    monthly: [],
    allTime: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState('daily')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRankings()
  }, [selectedPeriod])

  async function fetchRankings() {
    try {
      setLoading(true)
      const now = new Date()
      let startDate = new Date()

      switch (selectedPeriod) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'weekly':
          startDate.setDate(now.getDate() - 7)
          break
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'allTime':
          startDate = new Date('2024-01-01')
          break
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(100)

      setRankings(prev => ({
        ...prev,
        [selectedPeriod]: data || []
      }))
    } catch (error) {
      console.error('Error fetching rankings:', error)
      toast.error('ランキングの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { value: 'daily', label: '日間', icon: Clock },
    { value: 'weekly', label: '週間', icon: Calendar },
    { value: 'monthly', label: '月間', icon: Calendar },
    { value: 'allTime', label: '全期間', icon: Trophy }
  ]

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500'
      case 2:
        return 'text-gray-400'
      case 3:
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ランキング管理</h1>
        <p className="text-gray-600 mt-2">ユーザーランキングの表示と管理</p>
      </div>

      {/* 期間選択タブ */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          {periods.map(period => {
            const Icon = period.icon
            return (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Icon size={18} />
                {period.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">参加者数</p>
              <p className="text-2xl font-bold">{rankings[selectedPeriod].length}</p>
            </div>
            <Users className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">最高ポイント</p>
              <p className="text-2xl font-bold">
                {rankings[selectedPeriod][0]?.total_points || 0}
              </p>
            </div>
            <Trophy className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均ポイント</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  rankings[selectedPeriod].reduce((sum: number, u: any) => sum + (u.total_points || 0), 0) /
                  (rankings[selectedPeriod].length || 1)
                )}
              </p>
            </div>
            <Award className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* ランキングテーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                順位
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ポイント
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                レベル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録日
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings[selectedPeriod].slice(0, 50).map((user: any, index: number) => (
              <tr key={user.user_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl ${getMedalColor(index + 1)}`}>
                      {index < 3 ? <Medal size={24} /> : index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.nickname || 'ユーザー'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.user_id.substring(0, 8)}...
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-lg font-bold text-primary">
                    {user.total_points || 0} pt
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    Lv. {Math.floor((user.total_points || 0) / 100) + 1}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}