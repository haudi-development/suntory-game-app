import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// テストユーザーとランキングデータを作成
const CREATE_TEST_DATA_SQL = `
-- まずprofilesテーブルにdisplay_nameカラムを追加（存在しない場合）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- profilesテーブルにuser_idのUNIQUE制約を追加（存在しない場合）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- テストユーザーのプロファイルを作成
WITH test_users AS (
  SELECT 
    gen_random_uuid() as user_id,
    names.name,
    names.email,
    names.points,
    names.rank
  FROM (
    VALUES 
      ('山田太郎', 'yamada@test.com', 15000, 1),
      ('鈴木花子', 'suzuki@test.com', 12000, 2),
      ('佐藤健太', 'sato@test.com', 10000, 3),
      ('田中美咲', 'tanaka@test.com', 8500, 4),
      ('渡辺翔', 'watanabe@test.com', 7200, 5),
      ('小林優子', 'kobayashi@test.com', 6800, 6),
      ('山本大輝', 'yamamoto@test.com', 6000, 7),
      ('中村愛', 'nakamura@test.com', 5500, 8),
      ('井上蓮', 'inoue@test.com', 5000, 9),
      ('木村さくら', 'kimura@test.com', 4500, 10),
      ('林隼人', 'hayashi@test.com', 4000, 11),
      ('清水美月', 'shimizu@test.com', 3500, 12),
      ('山口颯太', 'yamaguchi@test.com', 3000, 13),
      ('森ひなた', 'mori@test.com', 2500, 14),
      ('池田龍', 'ikeda@test.com', 2000, 15)
  ) AS names(name, email, points, rank)
),
inserted_users AS (
  INSERT INTO profiles (user_id, display_name, total_points, selected_character, created_at)
  SELECT 
    user_id,
    name,
    points,
    CASE (rank % 6)
      WHEN 0 THEN 'premol'
      WHEN 1 THEN 'kakuhai'
      WHEN 2 THEN 'sui'
      WHEN 3 THEN 'lemon'
      WHEN 4 THEN 'allfree'
      ELSE 'premol'
    END,
    NOW() - INTERVAL '30 days' * random()
  FROM test_users
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    display_name = EXCLUDED.display_name
  RETURNING user_id
)
SELECT COUNT(*) as inserted_count FROM inserted_users;

-- 各テストユーザーに消費記録を作成（実際の飲んだ記録）
WITH test_users AS (
  SELECT user_id, total_points 
  FROM profiles 
  WHERE display_name LIKE '%太郎%' 
     OR display_name LIKE '%花子%'
     OR display_name LIKE '%健太%'
     OR display_name LIKE '%美咲%'
     OR display_name LIKE '%翔%'
     OR display_name LIKE '%優子%'
     OR display_name LIKE '%大輝%'
     OR display_name LIKE '%愛%'
     OR display_name LIKE '%蓮%'
     OR display_name LIKE '%さくら%'
  LIMIT 10
)
INSERT INTO consumptions (user_id, brand_name, product_type, volume_ml, quantity, points_earned, created_at)
SELECT 
  tu.user_id,
  brands.brand,
  brands.type,
  brands.volume,
  1,
  brands.points,
  NOW() - INTERVAL '1 day' * (row_number() OVER () % 30)
FROM test_users tu
CROSS JOIN LATERAL (
  SELECT * FROM (
    VALUES 
      ('ザ・プレミアム・モルツ', 'draft_beer', 350, 30),
      ('角ハイボール', 'highball', 350, 25),
      ('翠ジンソーダ', 'gin_soda', 350, 25),
      ('こだわり酒場のレモンサワー', 'sour', 350, 20),
      ('オールフリー', 'non_alcohol', 350, 15),
      ('金麦', 'draft_beer', 500, 25),
      ('角ハイボール缶', 'highball', 500, 30),
      ('-196℃ストロングゼロ', 'sour', 500, 35),
      ('サントリー天然水', 'water', 550, 10),
      ('ザ・プレミアム・モルツ マスターズドリーム', 'draft_beer', 305, 40)
  ) AS b(brand, type, volume, points)
  ORDER BY random()
  LIMIT (tu.total_points / 250)::int + 1
) brands
ON CONFLICT DO NOTHING;

-- キャラクターデータを作成
WITH test_users AS (
  SELECT user_id, selected_character
  FROM profiles 
  WHERE total_points > 0
)
INSERT INTO user_characters (user_id, character_type, level, exp, evolution_stage)
SELECT 
  user_id,
  selected_character,
  LEAST(10, 1 + (random() * 9)::int),
  (random() * 1000)::int,
  CASE 
    WHEN random() < 0.1 THEN 4
    WHEN random() < 0.3 THEN 3
    WHEN random() < 0.6 THEN 2
    ELSE 1
  END
FROM test_users
ON CONFLICT (user_id, character_type) DO NOTHING;

-- バッジを付与（実際の消費記録に基づいて）
WITH user_consumption_stats AS (
  SELECT 
    user_id,
    COUNT(*) as total_consumptions,
    COUNT(DISTINCT product_type) as unique_products,
    SUM(points_earned) as total_points_from_records
  FROM consumptions
  GROUP BY user_id
)
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  ucs.user_id,
  badge.badge_id,
  NOW() - INTERVAL '1 day' * (row_number() OVER (PARTITION BY ucs.user_id) - 1)
FROM user_consumption_stats ucs
CROSS JOIN LATERAL (
  SELECT 'first_drink' as badge_id WHERE ucs.total_consumptions >= 1
  UNION ALL
  SELECT 'beginner' WHERE ucs.total_points_from_records >= 100
  UNION ALL
  SELECT 'explorer' WHERE ucs.unique_products >= 3
  UNION ALL
  SELECT 'variety' WHERE ucs.unique_products >= 5
  UNION ALL
  SELECT 'expert' WHERE ucs.total_points_from_records >= 500
  UNION ALL
  SELECT 'legend' WHERE ucs.total_points_from_records >= 1000
) badge
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 結果を確認
SELECT 
  'テストデータ作成完了' as status,
  (SELECT COUNT(*) FROM profiles WHERE total_points > 0) as total_users,
  (SELECT COUNT(*) FROM consumptions) as total_consumptions,
  (SELECT COUNT(*) FROM user_badges) as total_badges,
  (SELECT COUNT(*) FROM user_characters) as total_characters;
`;

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'テストユーザー作成SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: CREATE_TEST_DATA_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 下記のSQLをコピーして実行',
        '4. ランキングページを再読み込み'
      ],
      notes: [
        '15人のテストユーザーを作成',
        '各ユーザーに実際の消費記録を追加',
        '消費記録に基づいてバッジを付与',
        'キャラクターレベルも設定'
      ]
    })
  } catch (error) {
    console.error('Create test users error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}