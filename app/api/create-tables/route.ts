import { createServerComponentClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CREATE_TABLES_SQL = `
-- venuesテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  is_restaurant BOOLEAN DEFAULT false,
  special_bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- check_insテーブルを作成
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  check_in_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_active_checkin UNIQUE (user_id, is_active)
);

-- venue_menusテーブルを作成
CREATE TABLE IF NOT EXISTS venue_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  default_volume_ml INTEGER DEFAULT 350,
  container TEXT,
  price INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- venue_beaconsテーブルを作成（オプション）
CREATE TABLE IF NOT EXISTS venue_beacons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  beacon_uuid TEXT NOT NULL,
  major INTEGER,
  minor INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_venue_id ON check_ins(venue_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_is_active ON check_ins(is_active);
CREATE INDEX IF NOT EXISTS idx_venue_menus_venue_id ON venue_menus(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_beacons_venue_id ON venue_beacons(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_beacons_uuid ON venue_beacons(beacon_uuid);

-- RLSを有効化
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_beacons ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから作成
DROP POLICY IF EXISTS "Anyone can view venues" ON venues;
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (true);

-- check_insテーブルのポリシー
DROP POLICY IF EXISTS "Users can view own check-ins" ON check_ins;
CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own check-ins" ON check_ins;
CREATE POLICY "Users can create own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own check-ins" ON check_ins;
CREATE POLICY "Users can update own check-ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);

-- venue_menusテーブルのポリシー
DROP POLICY IF EXISTS "Anyone can view menus" ON venue_menus;
CREATE POLICY "Anyone can view menus" ON venue_menus
  FOR SELECT USING (true);

-- venue_beaconsテーブルのポリシー
DROP POLICY IF EXISTS "Anyone can view beacons" ON venue_beacons;
CREATE POLICY "Anyone can view beacons" ON venue_beacons
  FOR SELECT USING (true);

-- チェックイン/アウト用のRPC関数
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
`;

export async function POST() {
  try {
    // 認証チェックを削除（セットアップ用なのでログイン不要）
    
    return NextResponse.json({
      success: false,
      message: 'テーブル作成SQLを生成しました',
      instruction: 'Supabaseダッシュボードで以下のSQLを実行してください',
      sql: CREATE_TABLES_SQL,
      steps: [
        '1. Supabaseダッシュボードにログイン',
        '2. SQL Editorを開く',
        '3. 下記のSQLをコピーして実行',
        '4. その後、再度セットアップを実行'
      ]
    })
  } catch (error) {
    console.error('Create tables error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createServerComponentClient()
  
  try {
    const checks = {
      venues: false,
      check_ins: false,
      venue_menus: false,
      venue_beacons: false
    }

    // テーブルの存在確認
    const { error: venuesError } = await supabase.from('venues').select('id').limit(1)
    if (!venuesError) checks.venues = true

    const { error: checkInsError } = await supabase.from('check_ins').select('id').limit(1)
    if (!checkInsError) checks.check_ins = true

    const { error: menusError } = await supabase.from('venue_menus').select('id').limit(1)
    if (!menusError) checks.venue_menus = true

    const { error: beaconsError } = await supabase.from('venue_beacons').select('id').limit(1)
    if (!beaconsError) checks.venue_beacons = true

    return NextResponse.json({ 
      status: 'Tables status',
      checks
    })
  } catch (error) {
    console.error('Check tables error:', error)
    return NextResponse.json({ 
      error: 'Failed to check tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}