import { NextResponse } from 'next/server'

// 追加のテストユーザーを既存のauth.usersに追加
const ADD_MORE_TEST_USERS_SQL = `
-- 既存のユーザーで、まだプロファイルがないか、ポイントが0のユーザーを更新
WITH available_users AS (
  SELECT 
    au.id as user_id,
    ROW_NUMBER() OVER (ORDER BY au.created_at) as rank_num
  FROM auth.users au
  LEFT JOIN profiles p ON p.user_id = au.id
  WHERE p.total_points IS NULL OR p.total_points = 0
  LIMIT 14  -- 既に1人いるので、残り14人を追加
)
UPDATE profiles p
SET 
  display_name = CASE au.rank_num
    WHEN 1 THEN '鈴木花子'
    WHEN 2 THEN '佐藤健太'
    WHEN 3 THEN '田中美咲'
    WHEN 4 THEN '渡辺翔'
    WHEN 5 THEN '小林優子'
    WHEN 6 THEN '山本大輝'
    WHEN 7 THEN '中村愛'
    WHEN 8 THEN '井上蓮'
    WHEN 9 THEN '木村さくら'
    WHEN 10 THEN '林隼人'
    WHEN 11 THEN '清水美月'
    WHEN 12 THEN '山口颯太'
    WHEN 13 THEN '森ひなた'
    WHEN 14 THEN '池田龍'
    ELSE 'ユーザー' || au.rank_num::text
  END,
  total_points = CASE au.rank_num
    WHEN 1 THEN 12000
    WHEN 2 THEN 10000
    WHEN 3 THEN 8500
    WHEN 4 THEN 7200
    WHEN 5 THEN 6800
    WHEN 6 THEN 6000
    WHEN 7 THEN 5500
    WHEN 8 THEN 5000
    WHEN 9 THEN 4500
    WHEN 10 THEN 4000
    WHEN 11 THEN 3500
    WHEN 12 THEN 3000
    WHEN 13 THEN 2500
    WHEN 14 THEN 2000
    ELSE 1000
  END,
  selected_character = CASE (au.rank_num % 6)
    WHEN 0 THEN 'premol'
    WHEN 1 THEN 'kakuhai'
    WHEN 2 THEN 'sui'
    WHEN 3 THEN 'lemon'
    WHEN 4 THEN 'allfree'
    ELSE 'premol'
  END
FROM available_users au
WHERE p.user_id = au.user_id;

-- もし更新対象がない場合は、既存ユーザーの中からランダムにダミーデータを追加
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- 更新された行数を確認
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RAISE NOTICE 'No users available to update. You may need to create more auth users first.';
    
    -- 既存の1人のユーザーだけでもデモ用に複数のダミーレコードを作成（本番環境では非推奨）
    -- これは一時的なデモ用です
    WITH test_data AS (
      SELECT 
        user_id,
        unnest(ARRAY[
          '鈴木花子', '佐藤健太', '田中美咲', '渡辺翔', 
          '小林優子', '山本大輝', '中村愛', '井上蓮'
        ]) as name,
        unnest(ARRAY[
          12000, 10000, 8500, 7200, 
          6800, 6000, 5500, 5000
        ]) as points
      FROM profiles
      WHERE total_points > 0
      LIMIT 1
    )
    INSERT INTO profiles (user_id, display_name, total_points, selected_character)
    SELECT 
      gen_random_uuid(),  -- 仮のUUIDを生成（注意：これはauth.usersに存在しません）
      name,
      points,
      'premol'
    FROM test_data
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 結果を確認
SELECT 
  'テストユーザー追加完了' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN total_points > 0 THEN 1 END) as users_with_points
FROM profiles;
`;

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: '追加テストユーザー作成SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: ADD_MORE_TEST_USERS_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く', 
        '3. 下記のSQLをコピーして実行',
        '4. ランキングページを再読み込み'
      ],
      notes: [
        '既存のauth.usersのプロファイルを更新',
        'もしauth.usersが1人しかいない場合は警告を表示',
        '複数のユーザーをランキングに表示'
      ]
    })
  } catch (error) {
    console.error('Add more test users error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}