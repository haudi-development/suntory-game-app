-- ユーザーロールテーブルの作成
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLSを有効化
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ポリシー：誰でも自分のロールを読み取れる
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー：管理者のみが全ロールを読み取れる
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ポリシー：管理者のみがロールを作成・更新・削除できる
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- profilesテーブルにroleカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 既存のprofilesのRLSポリシーを更新
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 管理者ユーザーを作成する関数
CREATE OR REPLACE FUNCTION make_user_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = NOW();
  
  UPDATE profiles 
  SET role = 'admin'
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- モデレーターユーザーを作成する関数
CREATE OR REPLACE FUNCTION make_user_moderator(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'moderator')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'moderator', updated_at = NOW();
  
  UPDATE profiles 
  SET role = 'moderator'
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーのロールをチェックする関数
CREATE OR REPLACE FUNCTION check_user_role(target_user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = target_user_id AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);