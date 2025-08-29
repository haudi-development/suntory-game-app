-- asada@haudi.jp ユーザーの確認
-- このSQLをSupabaseのSQL Editorで実行してください

-- auth.usersテーブルからメールアドレスで検索
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'asada@haudi.jp';

-- profilesテーブルの確認
SELECT 
  p.*,
  u.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'asada@haudi.jp';

-- user_charactersテーブルの確認
SELECT 
  uc.*,
  u.email
FROM user_characters uc
LEFT JOIN auth.users u ON u.id = uc.user_id
WHERE u.email = 'asada@haudi.jp';

-- 全ユーザーのリスト（最新10件）
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.nickname,
  p.total_points,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;