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
-- user_rolesテーブル用
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

-- profilesテーブル用
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

-- デフォルトの管理者ユーザーを作成するための一時的な関数
CREATE OR REPLACE FUNCTION setup_initial_admin()
RETURNS VOID AS $$
BEGIN
  -- 最初にサインアップしたユーザーを管理者にする
  INSERT INTO user_roles (user_id, role)
  SELECT id, 'admin'
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- インデックスを追加（パフォーマンス改善）
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);