-- チェックインシステム用のテーブル作成

-- 店舗チェックインテーブル
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  check_in_method TEXT, -- 'beacon', 'qr', 'manual', 'demo'
  beacon_uuid TEXT, -- ビーコンのUUID（ある場合）
  points_earned INTEGER DEFAULT 0,
  CONSTRAINT one_active_checkin UNIQUE (user_id, is_active) -- 1人1つのアクティブチェックイン
);

-- 飲食店メニューテーブル
CREATE TABLE IF NOT EXISTS venue_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_name_en TEXT,
  product_type TEXT NOT NULL, -- 'draft_beer', 'highball_jug', 'sour_pitcher' 等
  container TEXT NOT NULL, -- 'jug', 'glass', 'pitcher', 'mug'
  default_volume_ml INTEGER NOT NULL,
  price INTEGER,
  points_per_unit INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT true,
  is_seasonal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, product_name, container)
);

-- ビーコン管理テーブル（将来の実装用）
CREATE TABLE IF NOT EXISTS venue_beacons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  beacon_uuid TEXT NOT NULL UNIQUE,
  beacon_major INTEGER,
  beacon_minor INTEGER,
  floor_number INTEGER,
  area_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- venuesテーブルに飲食店フラグを追加
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS is_restaurant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS special_bonus_points INTEGER DEFAULT 50;

-- RLSポリシー設定
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_beacons ENABLE ROW LEVEL SECURITY;

-- チェックインポリシー
CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- メニューは誰でも閲覧可能
CREATE POLICY "Anyone can view venue menus" ON venue_menus
  FOR SELECT USING (true);

-- ビーコンは誰でも閲覧可能
CREATE POLICY "Anyone can view beacons" ON venue_beacons
  FOR SELECT USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_check_ins_user_active ON check_ins(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_check_ins_venue ON check_ins(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_menus_venue ON venue_menus(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_beacons_uuid ON venue_beacons(beacon_uuid);

-- チェックイン/アウト用の関数
CREATE OR REPLACE FUNCTION check_in_to_venue(
  p_user_id UUID,
  p_venue_id UUID,
  p_method TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_check_in_id UUID;
BEGIN
  -- 既存のアクティブなチェックインをチェックアウト
  UPDATE check_ins 
  SET is_active = false, 
      checked_out_at = NOW()
  WHERE user_id = p_user_id 
    AND is_active = true;

  -- 新しいチェックインを作成
  INSERT INTO check_ins (user_id, venue_id, check_in_method)
  VALUES (p_user_id, p_venue_id, p_method)
  RETURNING id INTO v_check_in_id;

  RETURN v_check_in_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- チェックアウト用の関数
CREATE OR REPLACE FUNCTION check_out_from_venue(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE check_ins 
  SET is_active = false, 
      checked_out_at = NOW()
  WHERE user_id = p_user_id 
    AND is_active = true;
    
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;