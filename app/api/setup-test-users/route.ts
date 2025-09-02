import { NextResponse } from 'next/server'

// 既存のユーザーにテストデータを追加
const CREATE_TEST_DATA_SQL = `
-- display_nameカラムを追加（存在しない場合）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 既存ユーザーのプロファイルを更新
WITH ranked_users AS (
  SELECT 
    p.user_id,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as rank
  FROM profiles p
  WHERE p.user_id IN (SELECT id FROM auth.users)
  LIMIT 15
)
UPDATE profiles p
SET 
  display_name = CASE ru.rank
    WHEN 1 THEN '山田太郎'
    WHEN 2 THEN '鈴木花子'
    WHEN 3 THEN '佐藤健太'
    WHEN 4 THEN '田中美咲'
    WHEN 5 THEN '渡辺翔'
    WHEN 6 THEN '小林優子'
    WHEN 7 THEN '山本大輝'
    WHEN 8 THEN '中村愛'
    WHEN 9 THEN '井上蓮'
    WHEN 10 THEN '木村さくら'
    WHEN 11 THEN '林隼人'
    WHEN 12 THEN '清水美月'
    WHEN 13 THEN '山口颯太'
    WHEN 14 THEN '森ひなた'
    WHEN 15 THEN '池田龍'
    ELSE 'ユーザー' || ru.rank::text
  END,
  total_points = CASE ru.rank
    WHEN 1 THEN 15000
    WHEN 2 THEN 12000
    WHEN 3 THEN 10000
    WHEN 4 THEN 8500
    WHEN 5 THEN 7200
    WHEN 6 THEN 6800
    WHEN 7 THEN 6000
    WHEN 8 THEN 5500
    WHEN 9 THEN 5000
    WHEN 10 THEN 4500
    WHEN 11 THEN 4000
    WHEN 12 THEN 3500
    WHEN 13 THEN 3000
    WHEN 14 THEN 2500
    WHEN 15 THEN 2000
    ELSE 1000
  END,
  selected_character = CASE (ru.rank % 6)
    WHEN 0 THEN 'premol'
    WHEN 1 THEN 'kakuhai'
    WHEN 2 THEN 'sui'
    WHEN 3 THEN 'lemon'
    WHEN 4 THEN 'allfree'
    ELSE 'premol'
  END
FROM ranked_users ru
WHERE p.user_id = ru.user_id;

-- 消費記録をクリアして新規作成
DELETE FROM consumptions 
WHERE user_id IN (
  SELECT user_id FROM profiles 
  WHERE display_name IN ('山田太郎','鈴木花子','佐藤健太','田中美咲','渡辺翔','小林優子','山本大輝','中村愛','井上蓮','木村さくら')
);

-- 新しい消費記録を追加
INSERT INTO consumptions (user_id, brand_name, product_type, volume_ml, quantity, points_earned, created_at)
SELECT 
  p.user_id,
  products.brand,
  products.type,
  products.volume,
  1,
  products.points,
  NOW() - INTERVAL '1 day' * (row_number() OVER (PARTITION BY p.user_id) % 30)
FROM profiles p
CROSS JOIN LATERAL (
  SELECT * FROM (
    VALUES 
      ('ザ・プレミアム・モルツ', 'draft_beer', 350, 30),
      ('角ハイボール', 'highball', 350, 25),
      ('翠ジンソーダ', 'gin_soda', 350, 25),
      ('こだわり酒場のレモンサワー', 'sour', 350, 20),
      ('オールフリー', 'non_alcohol', 350, 15)
  ) AS b(brand, type, volume, points)
  ORDER BY random()
  LIMIT GREATEST(1, (p.total_points / 500)::int)
) products
WHERE p.total_points > 0
  AND p.user_id IN (SELECT id FROM auth.users);

-- キャラクターデータをクリアして新規作成
DELETE FROM user_characters 
WHERE user_id IN (
  SELECT user_id FROM profiles 
  WHERE total_points > 0
);

-- 新しいキャラクターデータを追加
INSERT INTO user_characters (user_id, character_type, level, exp, evolution_stage)
SELECT 
  user_id,
  selected_character,
  LEAST(10, 1 + (total_points / 1000)::int),
  (total_points % 1000),
  CASE 
    WHEN total_points >= 10000 THEN 4
    WHEN total_points >= 5000 THEN 3
    WHEN total_points >= 2000 THEN 2
    ELSE 1
  END
FROM profiles
WHERE total_points > 0
  AND selected_character IS NOT NULL
  AND user_id IN (SELECT id FROM auth.users);

-- バッジをクリアして新規付与
DELETE FROM user_badges 
WHERE user_id IN (
  SELECT user_id FROM profiles 
  WHERE total_points > 0
);

-- 新しいバッジを付与
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  p.user_id,
  badge.badge_id,
  NOW() - INTERVAL '1 day' * (row_number() OVER (PARTITION BY p.user_id) - 1)
FROM profiles p
CROSS JOIN LATERAL (
  SELECT 'first_drink' as badge_id WHERE p.total_points >= 100
  UNION ALL
  SELECT 'beginner' WHERE p.total_points >= 100
  UNION ALL
  SELECT 'explorer' WHERE p.total_points >= 2000
  UNION ALL
  SELECT 'variety' WHERE p.total_points >= 5000
  UNION ALL
  SELECT 'expert' WHERE p.total_points >= 5000
  UNION ALL
  SELECT 'legend' WHERE p.total_points >= 10000
) badge
WHERE p.total_points > 0
  AND p.user_id IN (SELECT id FROM auth.users);

-- 結果を確認
SELECT 
  'データ更新完了' as status,
  (SELECT COUNT(*) FROM profiles WHERE total_points > 0) as users_with_points,
  (SELECT COUNT(*) FROM consumptions) as total_consumptions,
  (SELECT COUNT(*) FROM user_badges) as total_badges,
  (SELECT COUNT(*) FROM user_characters) as total_characters;
`;

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: '既存ユーザーのテストデータ更新SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: CREATE_TEST_DATA_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 下記のSQLをコピーして実行',
        '4. ランキングページを再読み込み'
      ],
      notes: [
        '既存のauth.usersのデータを使用',
        '最大15人のユーザーにランキングデータを設定',
        '消費記録、キャラクター、バッジを自動生成',
        '既存データはクリアして再作成'
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