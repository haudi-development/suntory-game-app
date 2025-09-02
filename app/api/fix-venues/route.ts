import { NextResponse } from 'next/server'

const FIX_VENUES_SQL = `
-- venuesテーブルに不足しているカラムを追加
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS is_restaurant BOOLEAN DEFAULT true;

ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS special_bonus_points INTEGER DEFAULT 50;

ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 既存のレコードを更新
UPDATE venues 
SET is_restaurant = true,
    special_bonus_points = 50
WHERE is_restaurant IS NULL;

-- デモ用の店舗データを挿入（既存データがない場合）
INSERT INTO venues (name, address, is_restaurant, special_bonus_points, latitude, longitude)
VALUES 
  ('銀座プレモルテラス', '東京都中央区銀座8-3-1', true, 100, 35.6695, 139.7625),
  ('梅田角ハイ横丁', '大阪府大阪市北区梅田1-1-3', true, 80, 34.7024, 135.4937),
  ('札幌ビール園', '北海道札幌市中央区北1条西4-2-2', true, 120, 43.0621, 141.3544),
  ('名古屋翠ジンバー', '愛知県名古屋市中区栄3-15-33', true, 90, 35.1681, 136.9066),
  ('福岡レモンサワー屋台', '福岡県福岡市博多区中洲1-1', true, 70, 33.5902, 130.4017),
  ('渋谷サントリーバー', '東京都渋谷区道玄坂2-29-1', true, 60, 35.6580, 139.6994),
  ('横浜ハイボール酒場', '神奈川県横浜市西区南幸2-15-1', true, 75, 35.4437, 139.6380),
  ('京都プレミアム茶屋', '京都府京都市中京区河原町通', true, 110, 35.0116, 135.7681)
ON CONFLICT DO NOTHING;

-- 各店舗にメニューを追加
WITH venue_ids AS (
  SELECT id, name FROM venues WHERE is_restaurant = true
)
INSERT INTO venue_menus (venue_id, product_name, product_type, default_volume_ml, container, price, is_available)
SELECT 
  v.id,
  m.product_name,
  m.product_type,
  m.default_volume_ml,
  m.container,
  m.price,
  true
FROM venue_ids v
CROSS JOIN (
  VALUES
    ('ザ・プレミアム・モルツ（生）', 'draft_beer', 350, 'jug', 580),
    ('ザ・プレミアム・モルツ（生）中', 'draft_beer', 500, 'jug', 780),
    ('角ハイボール', 'highball', 350, 'glass', 480),
    ('角ハイボール（メガ）', 'highball', 700, 'mug', 880),
    ('翠ジンソーダ', 'gin_soda', 350, 'glass', 520),
    ('こだわり酒場のレモンサワー', 'sour', 350, 'glass', 450),
    ('オールフリー', 'non_alcohol', 334, 'bottle', 380),
    ('プレミアムピッチャー', 'draft_beer', 1500, 'pitcher', 2200)
) AS m(product_name, product_type, default_volume_ml, container, price)
WHERE NOT EXISTS (
  SELECT 1 FROM venue_menus 
  WHERE venue_id = v.id 
  AND product_name = m.product_name
);
`;

export async function POST() {
  try {
    return NextResponse.json({
      success: false,
      message: 'venuesテーブル修正SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: FIX_VENUES_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 下記のSQLをコピーして実行',
        '4. その後、チェックインページを再読み込み'
      ]
    })
  } catch (error) {
    console.error('Fix venues error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}