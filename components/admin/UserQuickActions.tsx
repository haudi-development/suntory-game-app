'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Gift, Unlock, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserQuickActionsProps {
  userId: string
  currentPoints: number
  onUpdate: () => void
}

export default function UserQuickActions({ userId, currentPoints, onUpdate }: UserQuickActionsProps) {
  const [showActions, setShowActions] = useState(false)
  const [bonusPoints, setBonusPoints] = useState(100)
  const supabase = createClient()

  async function addBonusPoints() {
    try {
      const newPoints = currentPoints + bonusPoints

      const { error } = await supabase
        .from('profiles')
        .update({ total_points: newPoints })
        .eq('user_id', userId)

      if (error) throw error

      // 履歴として記録
      await supabase
        .from('consumptions')
        .insert({
          user_id: userId,
          brand_name: `ボーナス (+${bonusPoints}pt)`,
          product_type: 'other',
          container: 'その他',
          volume_ml: 0,
          quantity: 1,
          venue_name: '管理画面',
          latitude: 35.6812,
          longitude: 139.7671,
          points_earned: bonusPoints
        })

      toast.success(`${bonusPoints}ポイントを追加しました`)
      setShowActions(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding bonus points:', error)
      toast.error('ポイント追加に失敗しました')
    }
  }

  async function unlockAllCharacters() {
    try {
      const characterTypes = ['beer', 'highball', 'water', 'gin', 'sour', 'non_alcohol']
      
      for (const charType of characterTypes) {
        await supabase
          .from('user_characters')
          .upsert({
            user_id: userId,
            character_type: charType,
            level: 10,
            exp: 0,
            evolution_stage: 2
          })
      }

      toast.success('全キャラクターを解放しました')
      onUpdate()
    } catch (error) {
      console.error('Error unlocking characters:', error)
      toast.error('キャラクター解放に失敗しました')
    }
  }

  async function grantAllBadges() {
    try {
      const { data: badges } = await supabase
        .from('badges')
        .select('id')

      if (badges) {
        for (const badge of badges) {
          await supabase
            .from('user_badges')
            .upsert({
              user_id: userId,
              badge_id: badge.id,
              earned_at: new Date().toISOString()
            })
        }
      }

      toast.success('全バッジを付与しました')
      onUpdate()
    } catch (error) {
      console.error('Error granting badges:', error)
      toast.error('バッジ付与に失敗しました')
    }
  }

  async function makeTopRanker() {
    try {
      // トップランカーにする（10000ポイント追加）
      const newPoints = currentPoints + 10000

      await supabase
        .from('profiles')
        .update({ total_points: newPoints })
        .eq('user_id', userId)

      // 全キャラクター解放
      await unlockAllCharacters()

      // 全バッジ付与
      await grantAllBadges()

      toast.success('トップランカーに設定しました！')
      setShowActions(false)
      onUpdate()
    } catch (error) {
      console.error('Error making top ranker:', error)
      toast.error('設定に失敗しました')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="text-purple-600 hover:text-purple-900"
        title="クイックアクション"
      >
        <Zap size={18} />
      </button>

      {showActions && (
        <div className="absolute right-0 top-8 z-50 bg-white border rounded-lg shadow-lg p-4 w-64">
          <h4 className="font-semibold mb-3">クイックアクション</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border rounded text-sm"
                placeholder="100"
              />
              <button
                onClick={addBonusPoints}
                className="flex-1 flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Plus size={14} />
                ポイント追加
              </button>
            </div>

            <button
              onClick={unlockAllCharacters}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Unlock size={14} />
              全キャラ解放
            </button>

            <button
              onClick={grantAllBadges}
              className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              <Gift size={14} />
              全バッジ付与
            </button>

            <button
              onClick={makeTopRanker}
              className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              <Zap size={14} />
              トップランカー化
            </button>
          </div>

          <button
            onClick={() => setShowActions(false)}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  )
}