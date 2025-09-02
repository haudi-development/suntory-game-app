import { NextResponse } from 'next/server'

// チェックアウト機能の修正SQL
const FIX_CHECKOUT_SQL = `
-- 既存の関数を削除
DROP FUNCTION IF EXISTS check_out_from_venue(UUID);

-- check_out_from_venue関数を新規作成
CREATE FUNCTION check_out_from_venue(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- アクティブなチェックインを非アクティブにする
  UPDATE check_ins
  SET 
    is_active = false,
    checked_out_at = NOW()
  WHERE user_id = p_user_id 
    AND is_active = true;
    
  -- 成功時は何も返さない
END;
$$ LANGUAGE plpgsql;

-- 既存の制約を削除して再作成
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS one_active_checkin;

-- ユーザーごとにアクティブなチェックインは1つのみという制約
-- is_active = trueの場合のみ制約を適用
CREATE UNIQUE INDEX one_active_checkin 
ON check_ins (user_id) 
WHERE is_active = true;

-- 確認クエリ
SELECT 
  'チェックアウト機能修正完了' as status,
  (SELECT COUNT(*) FROM check_ins WHERE is_active = true) as active_checkins,
  (SELECT COUNT(*) FROM check_ins WHERE is_active = false) as inactive_checkins;
`;

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'チェックアウト機能修正SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: FIX_CHECKOUT_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 下記のSQLをコピーして実行',
        '4. チェックアウト機能を再テスト'
      ],
      notes: [
        'check_out_from_venue関数を修正',
        'unique制約を部分インデックスに変更',
        'is_active=trueの場合のみ制約を適用'
      ]
    })
  } catch (error) {
    console.error('Fix checkout error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}