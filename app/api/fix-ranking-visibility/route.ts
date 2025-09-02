import { NextResponse } from 'next/server'

// ランキング表示用のRLSポリシーを修正
const FIX_RANKING_SQL = `
-- profilesテーブルのRLSポリシーを修正
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 新しいポリシーを作成
-- 全員が全プロフィールを閲覧可能（ランキング表示のため）
CREATE POLICY "Anyone can view profiles for ranking" ON profiles
  FOR SELECT USING (true);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- consumptionsテーブルも同様に修正（ランキング集計のため）
DROP POLICY IF EXISTS "Users can view their own consumptions" ON consumptions;

-- ランキング集計のため全員が閲覧可能
CREATE POLICY "Anyone can view consumptions for ranking" ON consumptions
  FOR SELECT USING (true);

-- ユーザーは自分の記録のみ挿入可能
CREATE POLICY "Users can insert their own consumptions" ON consumptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 確認クエリ
SELECT 
  'RLSポリシー修正完了' as status,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE total_points > 0) as profiles_with_points;
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
        'profilesテーブルを全員が閲覧可能に変更',
        'consumptionsテーブルも全員が閲覧可能に変更',
        'ランキング機能が正常に動作するようになります'
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