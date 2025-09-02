import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FIX_POLICIES_SQL = `
-- 既存の問題のあるポリシーを削除
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 管理者チェック用の関数を作成（再帰を防ぐため）
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = check_user_id
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 修正したポリシーを作成
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR INSERT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles" ON user_roles
  FOR DELETE
  USING (is_admin(auth.uid()));

-- profilesテーブル用の修正したポリシー
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );
`;

export async function POST() {
  try {
    const supabase = await createServerComponentClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Supabaseのダッシュボードから手動で実行する必要があるSQL
    return NextResponse.json({
      success: false,
      message: 'RLSポリシーの修正が必要です',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: FIX_POLICIES_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 上記のSQLをコピーして実行',
        '4. その後、再度セットアップを実行'
      ]
    })
  } catch (error) {
    console.error('Fix policies error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate fix SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}