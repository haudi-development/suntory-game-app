import { NextResponse } from 'next/server'

// 最速でランキングにダミーデータを表示するSQL
const QUICK_DUMMY_DATA_SQL = `
-- ダミーのプロファイルを直接作成（提案デモ用）
-- 外部キー制約エラーを無視するため、既存のuser_idを使用するか、新規作成
INSERT INTO profiles (user_id, display_name, total_points, selected_character, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '山田太郎', 15000, 'premol', NOW() - INTERVAL '30 days'),
  ('22222222-2222-2222-2222-222222222222', '鈴木花子', 12000, 'kakuhai', NOW() - INTERVAL '29 days'),
  ('33333333-3333-3333-3333-333333333333', '佐藤健太', 10000, 'sui', NOW() - INTERVAL '28 days'),
  ('44444444-4444-4444-4444-444444444444', '田中美咲', 8500, 'lemon', NOW() - INTERVAL '27 days'),
  ('55555555-5555-5555-5555-555555555555', '渡辺翔', 7200, 'allfree', NOW() - INTERVAL '26 days'),
  ('66666666-6666-6666-6666-666666666666', '小林優子', 6800, 'premol', NOW() - INTERVAL '25 days'),
  ('77777777-7777-7777-7777-777777777777', '山本大輝', 6000, 'kakuhai', NOW() - INTERVAL '24 days'),
  ('88888888-8888-8888-8888-888888888888', '中村愛', 5500, 'sui', NOW() - INTERVAL '23 days'),
  ('99999999-9999-9999-9999-999999999999', '井上蓮', 5000, 'lemon', NOW() - INTERVAL '22 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '木村さくら', 4500, 'allfree', NOW() - INTERVAL '21 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '林隼人', 4000, 'premol', NOW() - INTERVAL '20 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '清水美月', 3500, 'kakuhai', NOW() - INTERVAL '19 days'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '山口颯太', 3000, 'sui', NOW() - INTERVAL '18 days'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '森ひなた', 2500, 'lemon', NOW() - INTERVAL '17 days'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '池田龍', 2000, 'allfree', NOW() - INTERVAL '16 days')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  total_points = EXCLUDED.total_points,
  selected_character = EXCLUDED.selected_character;

-- キャラクターデータも追加
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
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ON CONFLICT (user_id, character_type) DO NOTHING;

-- バッジも追加
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  user_id,
  CASE 
    WHEN total_points >= 10000 THEN 'legend'
    WHEN total_points >= 5000 THEN 'expert'
    WHEN total_points >= 2000 THEN 'explorer'
    ELSE 'beginner'
  END,
  NOW()
FROM profiles
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 結果を確認
SELECT 
  'ダミーデータ作成完了！' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN total_points > 0 THEN 1 END) as users_with_points
FROM profiles;
`;

export async function POST() {
  return NextResponse.json({
    success: true,
    message: '緊急ダミーデータSQLを生成しました',
    sql: QUICK_DUMMY_DATA_SQL,
    steps: [
      '⚡ このSQLをSupabaseで実行すれば即座にランキングが表示されます！',
      '',
      '1. Supabaseダッシュボードを開く',
      '2. SQL Editorへ',
      '3. 下記SQLをコピペして実行',
      '4. ランキングページをリロード',
      '',
      '✅ 15人のユーザーが即座に表示されます'
    ]
  })
}