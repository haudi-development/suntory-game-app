import { createClient } from '@/lib/supabase/client'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
}

export interface UserStats {
  totalPoints: number
  totalConsumptions: number
  consecutiveDays: number
  uniqueProducts: number
  favoriteType: string
  totalVolume: number
  daysSinceJoined: number
  weeklyRank?: number
  monthlyRank?: number
}

export const BADGES: Badge[] = [
  {
    id: 'first_drink',
    name: 'はじめての一杯',
    icon: '🍺',
    description: '初めて記録を投稿',
    condition: (stats) => stats.totalConsumptions >= 1
  },
  {
    id: '3days_streak',
    name: '3日連続',
    icon: '🔥',
    description: '3日連続で記録',
    condition: (stats) => stats.consecutiveDays >= 3
  },
  {
    id: 'perfect_week',
    name: 'パーフェクトウィーク',
    icon: '🎯',
    description: '7日連続で記録',
    condition: (stats) => stats.consecutiveDays >= 7
  },
  {
    id: 'explorer',
    name: '探検家',
    icon: '🗾',
    description: '5種類以上の商品を試す',
    condition: (stats) => stats.uniqueProducts >= 5
  },
  {
    id: 'variety',
    name: 'バラエティ飲み',
    icon: '🌈',
    description: '10種類以上の商品を試す',
    condition: (stats) => stats.uniqueProducts >= 10
  },
  {
    id: 'beginner',
    name: 'ビギナー',
    icon: '🌟',
    description: '100ポイント達成',
    condition: (stats) => stats.totalPoints >= 100
  },
  {
    id: 'expert',
    name: 'エキスパート',
    icon: '⭐',
    description: '500ポイント達成',
    condition: (stats) => stats.totalPoints >= 500
  },
  {
    id: 'legend',
    name: 'レジェンド',
    icon: '👑',
    description: '1000ポイント達成',
    condition: (stats) => stats.totalPoints >= 1000
  },
  {
    id: 'champion',
    name: 'チャンピオン',
    icon: '🏆',
    description: '週間ランキング1位',
    condition: (stats) => stats.weeklyRank === 1
  },
  {
    id: 'top10',
    name: 'トップ10',
    icon: '🎖️',
    description: '週間ランキングTOP10入り',
    condition: (stats) => stats.weeklyRank !== undefined && stats.weeklyRank <= 10
  },
  {
    id: 'night_owl',
    name: 'ナイトオウル',
    icon: '🌙',
    description: '22時以降の記録10回',
    condition: (stats) => false // 特殊条件のため別途実装
  },
  {
    id: 'day_drinker',
    name: '昼飲みの達人',
    icon: '☀️',
    description: '15時前の記録5回',
    condition: (stats) => false // 特殊条件のため別途実装
  },
  {
    id: 'hydration',
    name: '水分補給マスター',
    icon: '💧',
    description: '水・お茶を含めて記録',
    condition: (stats) => false // 特殊条件のため別途実装
  },
  {
    id: 'volume_king',
    name: 'ボリュームキング',
    icon: '🍻',
    description: '総量10L達成',
    condition: (stats) => stats.totalVolume >= 10000
  },
  {
    id: 'anniversary',
    name: 'アニバーサリー',
    icon: '🎂',
    description: '登録から30日',
    condition: (stats) => stats.daysSinceJoined >= 30
  }
]

export async function checkAndGrantBadges(userId: string) {
  const supabase = createClient()
  
  try {
    // ユーザーの統計情報を取得
    const stats = await getUserStats(userId)
    
    // 既に持っているバッジを取得
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
    
    const existingBadgeIds = existingBadges?.map(b => b.badge_id) || []
    
    // 新しく獲得できるバッジをチェック
    const newBadges: string[] = []
    
    for (const badge of BADGES) {
      if (!existingBadgeIds.includes(badge.id) && badge.condition(stats)) {
        // バッジを付与
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            earned_at: new Date().toISOString()
          })
        
        newBadges.push(badge.name)
      }
    }
    
    return newBadges
  } catch (error) {
    console.error('Error checking badges:', error)
    return []
  }
}

async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient()
  
  // プロフィール情報
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // 総記録数
  const { count: totalConsumptions } = await supabase
    .from('consumptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  // ユニークな商品数
  const { data: uniqueProductsData } = await supabase
    .from('consumptions')
    .select('brand_name')
    .eq('user_id', userId)
  
  const uniqueProducts = new Set(uniqueProductsData?.map(d => d.brand_name)).size
  
  // 総容量
  const { data: volumeData } = await supabase
    .from('consumptions')
    .select('volume_ml, quantity')
    .eq('user_id', userId)
  
  const totalVolume = volumeData?.reduce((sum, d) => sum + (d.volume_ml * d.quantity), 0) || 0
  
  // 連続日数の計算
  const { data: datesData } = await supabase
    .from('consumptions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  const consecutiveDays = calculateConsecutiveDays(datesData?.map(d => d.created_at) || [])
  
  // 登録からの日数
  const daysSinceJoined = profile?.created_at 
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  // お気に入りのタイプ
  const { data: typesData } = await supabase
    .from('consumptions')
    .select('product_type')
    .eq('user_id', userId)
  
  const typeCount: Record<string, number> = {}
  typesData?.forEach(d => {
    typeCount[d.product_type] = (typeCount[d.product_type] || 0) + 1
  })
  
  const favoriteType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  
  return {
    totalPoints: profile?.total_points || 0,
    totalConsumptions: totalConsumptions || 0,
    consecutiveDays,
    uniqueProducts,
    favoriteType,
    totalVolume,
    daysSinceJoined
  }
}

function calculateConsecutiveDays(dates: string[]): number {
  if (dates.length === 0) return 0
  
  const sortedDates = dates
    .map(d => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // ユニークな日付のみ
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  let consecutive = 1
  let currentDate = new Date(sortedDates[0])
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i])
    const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      consecutive++
      currentDate = prevDate
    } else {
      break
    }
  }
  
  return consecutive
}