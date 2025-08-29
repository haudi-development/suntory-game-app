-- すべてのユーザーのメール確認を完了にする
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 特定のメールアドレスのユーザーだけを確認済みにする場合
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'your-email@example.com' AND email_confirmed_at IS NULL;

-- 確認結果を表示
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users
ORDER BY created_at DESC;