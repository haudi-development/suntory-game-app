import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// デモ用店舗データ
const DEMO_VENUES = [
  {
    name: '銀座プレモルテラス',
    address: '東京都中央区銀座8-3-1',
    is_restaurant: true,
    special_bonus_points: 100,
    latitude: 35.6695,
    longitude: 139.7625,
  },
  {
    name: '梅田角ハイ横丁',
    address: '大阪府大阪市北区梅田1-1-3',
    is_restaurant: true,
    special_bonus_points: 80,
    latitude: 34.7024,
    longitude: 135.4937,
  },
  {
    name: '札幌ビール園',
    address: '北海道札幌市中央区北1条西4-2-2',
    is_restaurant: true,
    special_bonus_points: 120,
    latitude: 43.0621,
    longitude: 141.3544,
  },
  {
    name: '名古屋翠ジンバー',
    address: '愛知県名古屋市中区栄3-15-33',
    is_restaurant: true,
    special_bonus_points: 90,
    latitude: 35.1681,
    longitude: 136.9066,
  },
  {
    name: '福岡レモンサワー屋台',
    address: '福岡県福岡市博多区中洲1-1',
    is_restaurant: true,
    special_bonus_points: 70,
    latitude: 33.5902,
    longitude: 130.4017,
  },
  {
    name: '渋谷サントリーバー',
    address: '東京都渋谷区道玄坂2-29-1',
    is_restaurant: true,
    special_bonus_points: 60,
    latitude: 35.6580,
    longitude: 139.6994,
  },
  {
    name: '横浜ハイボール酒場',
    address: '神奈川県横浜市西区南幸2-15-1',
    is_restaurant: true,
    special_bonus_points: 75,
    latitude: 35.4437,
    longitude: 139.6380,
  },
  {
    name: '京都プレミアム茶屋',
    address: '京都府京都市中京区河原町通',
    is_restaurant: true,
    special_bonus_points: 110,
    latitude: 35.0116,
    longitude: 135.7681,
  },
]

// 各店舗のメニューデータ
const VENUE_MENUS = [
  { product_name: 'ザ・プレミアム・モルツ（生）', product_type: 'draft_beer', default_volume_ml: 350, container: 'jug', price: 580 },
  { product_name: 'ザ・プレミアム・モルツ（生）中', product_type: 'draft_beer', default_volume_ml: 500, container: 'jug', price: 780 },
  { product_name: '角ハイボール', product_type: 'highball', default_volume_ml: 350, container: 'glass', price: 480 },
  { product_name: '角ハイボール（メガ）', product_type: 'highball', default_volume_ml: 700, container: 'mug', price: 880 },
  { product_name: '翠ジンソーダ', product_type: 'gin_soda', default_volume_ml: 350, container: 'glass', price: 520 },
  { product_name: 'こだわり酒場のレモンサワー', product_type: 'sour', default_volume_ml: 350, container: 'glass', price: 450 },
  { product_name: 'オールフリー', product_type: 'non_alcohol', default_volume_ml: 334, container: 'bottle', price: 380 },
  { product_name: 'プレミアムピッチャー', product_type: 'draft_beer', default_volume_ml: 1500, container: 'pitcher', price: 2200 },
]

export async function POST() {
  const supabase = await createServerComponentClient()

  try {
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 既存の店舗をチェック
    const { data: existingVenues } = await supabase
      .from('venues')
      .select('id')
      .limit(1)

    if (existingVenues && existingVenues.length > 0) {
      return NextResponse.json({ 
        message: '店舗データは既に存在します',
        count: existingVenues.length 
      })
    }

    // 店舗を作成
    const { data: venues, error: venueError } = await supabase
      .from('venues')
      .insert(DEMO_VENUES)
      .select()

    if (venueError) {
      console.error('Venue creation error:', venueError)
      throw venueError
    }

    // 各店舗にメニューを追加
    const menuInserts = []
    for (const venue of venues) {
      for (const menu of VENUE_MENUS) {
        menuInserts.push({
          venue_id: venue.id,
          ...menu,
          is_available: true,
        })
      }
    }

    const { error: menuError } = await supabase
      .from('venue_menus')
      .insert(menuInserts)

    if (menuError) {
      console.error('Menu creation error:', menuError)
      throw menuError
    }

    return NextResponse.json({ 
      success: true,
      message: `${venues.length}件の店舗と${menuInserts.length}件のメニューを作成しました`,
      venues: venues.map(v => ({ id: v.id, name: v.name }))
    })
  } catch (error) {
    console.error('Setup venues error:', error)
    return NextResponse.json({ 
      error: 'Failed to setup venues',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createServerComponentClient()
  
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, is_restaurant')
      .eq('is_restaurant', true)
      .order('name')

    if (error) throw error

    return NextResponse.json({ 
      count: venues?.length || 0,
      venues: venues || []
    })
  } catch (error) {
    console.error('Get venues error:', error)
    return NextResponse.json({ 
      error: 'Failed to get venues',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}