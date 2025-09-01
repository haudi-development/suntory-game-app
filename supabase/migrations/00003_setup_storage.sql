-- Supabase Storageバケットの設定（SQL Editorで実行）
-- 注意: これらのコマンドはSupabaseダッシュボードのSQL Editorで実行する必要があります

-- consumptionsテーブルに画像関連カラムを追加
ALTER TABLE consumptions 
ADD COLUMN IF NOT EXISTS image_storage_path TEXT,
ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_consumptions_image_path ON consumptions(image_storage_path);

-- Storage用のRLSポリシー設定用のメタデータ
-- 実際のバケット作成はSupabaseダッシュボードまたはAPIで行う必要があります
COMMENT ON TABLE consumptions IS 'Storage buckets needed: consumption-images (public read, authenticated write)';

-- 画像アップロード情報を記録するテーブル
CREATE TABLE IF NOT EXISTS image_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consumption_id UUID REFERENCES consumptions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consumption_id)
);

-- RLSを有効化
ALTER TABLE image_uploads ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can view own uploads" ON image_uploads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON image_uploads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON image_uploads
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_image_uploads_user_id ON image_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_image_uploads_consumption_id ON image_uploads(consumption_id);