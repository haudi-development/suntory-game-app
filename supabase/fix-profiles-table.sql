-- profilesテーブルにupdated_atカラムを追加
-- Supabase SQL Editorで実行してください

-- updated_atカラムが存在しない場合は追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 既存レコードのupdated_atを設定
UPDATE profiles 
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;

-- テーブル構造の確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;