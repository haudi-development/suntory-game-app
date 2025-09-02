import { NextResponse } from 'next/server'

// 最もシンプルな方法でダミーデータを作成
const SIMPLE_DUMMY_DATA_SQL = `
-- Step 1: profilesテーブルのRLSを一時的に無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: ダミーデータを挿入（idカラムを使用）
INSERT INTO profiles (id, user_id, display_name, total_points, selected_character, created_at)
VALUES
  (gen_random_uuid(), gen_random_uuid(), '山田太郎', 15000, 'premol', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), gen_random_uuid(), '鈴木花子', 12000, 'kakuhai', NOW() - INTERVAL '29 days'),
  (gen_random_uuid(), gen_random_uuid(), '佐藤健太', 10000, 'sui', NOW() - INTERVAL '28 days'),
  (gen_random_uuid(), gen_random_uuid(), '田中美咲', 8500, 'lemon', NOW() - INTERVAL '27 days'),
  (gen_random_uuid(), gen_random_uuid(), '渡辺翔', 7200, 'allfree', NOW() - INTERVAL '26 days'),
  (gen_random_uuid(), gen_random_uuid(), '小林優子', 6800, 'premol', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), gen_random_uuid(), '山本大輝', 6000, 'kakuhai', NOW() - INTERVAL '24 days'),
  (gen_random_uuid(), gen_random_uuid(), '中村愛', 5500, 'sui', NOW() - INTERVAL '23 days'),
  (gen_random_uuid(), gen_random_uuid(), '井上蓮', 5000, 'lemon', NOW() - INTERVAL '22 days'),
  (gen_random_uuid(), gen_random_uuid(), '木村さくら', 4500, 'allfree', NOW() - INTERVAL '21 days'),
  (gen_random_uuid(), gen_random_uuid(), '林隼人', 4000, 'premol', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), gen_random_uuid(), '清水美月', 3500, 'kakuhai', NOW() - INTERVAL '19 days'),
  (gen_random_uuid(), gen_random_uuid(), '山口颯太', 3000, 'sui', NOW() - INTERVAL '18 days'),
  (gen_random_uuid(), gen_random_uuid(), '森ひなた', 2500, 'lemon', NOW() - INTERVAL '17 days'),
  (gen_random_uuid(), gen_random_uuid(), '池田龍', 2000, 'allfree', NOW() - INTERVAL '16 days');

-- Step 3: RLSを再有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
    message: 'シンプルなダミーデータSQLを生成しました',
    sql: SIMPLE_DUMMY_DATA_SQL,
    steps: [
      '✅ これが最もシンプルな方法です！',
      '',
      '1. Supabaseダッシュボードを開く',
      '2. SQL Editorへ',
      '3. 下記SQLをコピペして実行',
      '4. ランキングページをリロード',
      '',
      '⚠️ 注意: このデータはauth.usersとは関連付けられていません',
      'デモ表示専用です'
    ]
  })
}