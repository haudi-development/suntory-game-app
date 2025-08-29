-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  selected_character TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User characters table
CREATE TABLE user_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_type TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  evolution_stage INTEGER DEFAULT 1,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consumptions table
CREATE TABLE consumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  volume_ml INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  points_earned INTEGER NOT NULL,
  image_url TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges table
CREATE TABLE user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Leaderboard cache table
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope TEXT NOT NULL,
  scope_id TEXT,
  period TEXT NOT NULL,
  rankings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX idx_consumptions_user_id ON consumptions(user_id);
CREATE INDEX idx_consumptions_venue_id ON consumptions(venue_id);
CREATE INDEX idx_consumptions_created_at ON consumptions(created_at);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_leaderboard_cache_scope ON leaderboard_cache(scope, scope_id, period);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User characters policies
CREATE POLICY "Users can view their own characters" ON user_characters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own characters" ON user_characters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own characters" ON user_characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Consumptions policies
CREATE POLICY "Users can view their own consumptions" ON consumptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consumptions" ON consumptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User badges policies
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Venues policies (public read)
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (true);

-- Leaderboard cache policies (public read)
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_cache
  FOR SELECT USING (true);

-- Functions
CREATE OR REPLACE FUNCTION get_user_ranking(
  p_user_id UUID,
  p_scope TEXT,
  p_period TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Simplified ranking logic
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'rank', 1,
    'points', COALESCE((SELECT total_points FROM profiles WHERE user_id = p_user_id), 0),
    'scope', p_scope,
    'period', p_period
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION record_consumption(
  p_user_id UUID,
  p_venue_id UUID,
  p_consumption_data JSONB
) RETURNS VOID AS $$
BEGIN
  -- Insert consumption record
  INSERT INTO consumptions (
    user_id,
    venue_id,
    brand_name,
    product_type,
    volume_ml,
    quantity,
    points_earned,
    ai_analysis
  ) VALUES (
    p_user_id,
    p_venue_id,
    p_consumption_data->>'brand_name',
    p_consumption_data->>'product_type',
    (p_consumption_data->>'volume_ml')::INTEGER,
    COALESCE((p_consumption_data->>'quantity')::INTEGER, 1),
    (p_consumption_data->>'points_earned')::INTEGER,
    p_consumption_data->'ai_analysis'
  );
  
  -- Update user points
  UPDATE profiles 
  SET total_points = total_points + (p_consumption_data->>'points_earned')::INTEGER
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_character_exp(
  p_user_id UUID,
  p_character_type TEXT,
  p_exp_gained INTEGER
) RETURNS VOID AS $$
DECLARE
  current_level INTEGER;
  current_exp INTEGER;
  new_exp INTEGER;
  new_level INTEGER;
  new_stage INTEGER;
BEGIN
  -- Get current character stats
  SELECT level, exp 
  INTO current_level, current_exp
  FROM user_characters
  WHERE user_id = p_user_id AND character_type = p_character_type;
  
  -- Calculate new exp
  new_exp := current_exp + p_exp_gained;
  
  -- Simple level calculation (every 100 exp = 1 level)
  new_level := 1 + (new_exp / 100);
  
  -- Evolution stage based on level
  new_stage := CASE
    WHEN new_level >= 10 THEN 4
    WHEN new_level >= 5 THEN 3
    WHEN new_level >= 3 THEN 2
    ELSE 1
  END;
  
  -- Update character
  UPDATE user_characters
  SET 
    exp = new_exp,
    level = new_level,
    evolution_stage = new_stage
  WHERE user_id = p_user_id AND character_type = p_character_type;
END;
$$ LANGUAGE plpgsql;