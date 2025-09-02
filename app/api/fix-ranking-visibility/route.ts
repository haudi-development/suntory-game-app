import { NextResponse } from 'next/server'

// ランキング表示用のRLSポリシーを修正
const FIX_RANKING_SQL = `
-- 一旦すべてのポリシーを削除してから再作成
DO $$ 
BEGIN
  -- profilesテーブルのポリシーを削除
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Anyone can view profiles for ranking" ON profiles;
  
  -- consumptionsテーブルのポリシーを削除
  DROP POLICY IF EXISTS "Users can view their own consumptions" ON consumptions;
  DROP POLICY IF EXISTS "Users can insert their own consumptions" ON consumptions;
  DROP POLICY IF EXISTS "Anyone can view consumptions for ranking" ON consumptions;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- エラーを無視
END $$;

-- profilesテーブルの新しいポリシー
CREATE POLICY "public_read_profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "own_update_profiles" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_insert_profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- consumptionsテーブルの新しいポリシー  
CREATE POLICY "public_read_consumptions" ON consumptions
  FOR SELECT USING (true);

CREATE POLICY "own_insert_consumptions" ON consumptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 確認クエリ
SELECT 
  'RLSポリシー修正完了' as status,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE total_points > 0) as profiles_with_points,
  (SELECT COUNT(*) FROM consumptions) as total_consumptions;
`;

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'ランキング表示用RLSポリシー修正SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: FIX_RANKING_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 下記のSQLをコピーして実行',
        '4. ランキングページを再読み込み'
      ],
      notes: [
        '既存のポリシーをすべて削除',
        'シンプルな名前で新規作成',
        'エラーが出ても続行するように設定'
      ]
    })
  } catch (error) {
    console.error('Fix ranking visibility error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}