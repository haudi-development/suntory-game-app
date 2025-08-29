-- Supabaseのメール確認を無効化する設定
-- Supabase SQL Editorで実行してください

-- 既存ユーザーのメール確認を強制的に完了状態にする
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- asada@haudi.jpユーザーの確認
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'asada@haudi.jp';

-- 全ユーザーの確認状態を表示
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 注意: メール確認の有効/無効はSupabaseダッシュボードから設定する必要があります
-- Authentication > Settings > Email Authで以下を設定:
-- - Enable email confirmations: OFF にする