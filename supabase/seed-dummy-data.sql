-- ダミーデータ投入スクリプト
-- Supabase SQL Editorで実行してください
-- 注意: 既存のデータを保持したまま、ダミーデータを追加します

-- ========================================
-- 1. ダミーユーザーの作成
-- ========================================

-- ダミーユーザーのメールアドレスリスト
DO $$
DECLARE
  dummy_users TEXT[] := ARRAY[
    'tanaka@example.com',
    'suzuki@example.com', 
    'yamada@example.com',
    'sato@example.com',
    'watanabe@example.com',
    'kobayashi@example.com',
    'yoshida@example.com',
    'yamamoto@example.com',
    'nakamura@example.com',
    'inoue@example.com',
    'kimura@example.com',
    'hayashi@example.com',
    'shimizu@example.com',
    'yamaguchi@example.com',
    'mori@example.com',
    'ikeda@example.com',
    'hashimoto@example.com',
    'yamashita@example.com',
    'ishikawa@example.com',
    'nakajima@example.com'
  ];
  
  nicknames TEXT[] := ARRAY[
    '田中太郎', '鈴木花子', '山田一郎', '佐藤美咲', '渡辺健太',
    '小林優子', '吉田翔', '山本愛', '中村大輝', '井上さくら',
    '木村隼人', '林美月', '清水蓮', '山口あかり', '森翼',
    '池田みなみ', '橋本颯太', '山下ひなた', '石川龍', '中島ゆい'
  ];
  
  character_types TEXT[] := ARRAY['beer', 'highball', 'water', 'gin', 'sour', 'non_alcohol'];
  venues TEXT[] := ARRAY[
    'サントリーバー 銀座店', 'サントリーバー 新宿店', 'サントリーバー 渋谷店',
    'サントリーバー 六本木店', 'サントリーバー 品川店', 'サントリーバー 池袋店',
    'サントリーバー 上野店', 'サントリーバー 横浜店', 'サントリーバー 大阪店',
    'サントリーバー 名古屋店'
  ];
  
  brands TEXT[] := ARRAY[
    'ザ・プレミアム・モルツ', '金麦', '角ハイボール', 'トリスハイボール',
    'こだわり酒場のレモンサワー', '-196℃ ストロングゼロ', '翠ジンソーダ',
    'オールフリー', 'サントリー天然水', '伊右衛門', 'BOSS'
  ];
  
  user_id UUID;
  i INT;
  j INT;
  random_points INT;
  random_char TEXT;
  created_date TIMESTAMP;
BEGIN
  -- 各ダミーユーザーを作成
  FOR i IN 1..20 LOOP
    -- ランダムなポイント数（100-5000）
    random_points := 100 + floor(random() * 4900)::INT;
    
    -- ランダムな作成日（過去30日以内）
    created_date := NOW() - (random() * 30 || ' days')::INTERVAL;
    
    -- ユーザーIDを生成
    user_id := gen_random_uuid();
    
    -- プロフィール作成
    INSERT INTO profiles (
      user_id,
      nickname,
      selected_character,
      total_points,
      created_at
    ) VALUES (
      user_id,
      nicknames[i],
      character_types[1 + floor(random() * 6)::INT],
      random_points,
      created_date
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- キャラクター解放（ランダムに3-6体）
    FOR j IN 1..(3 + floor(random() * 4)::INT) LOOP
      INSERT INTO user_characters (
        user_id,
        character_type,
        level,
        exp,
        evolution_stage,
        created_at
      ) VALUES (
        user_id,
        character_types[j],
        1 + floor(random() * 10)::INT,
        floor(random() * 100)::INT,
        1 + floor(random() * 3)::INT,
        created_date
      ) ON CONFLICT (user_id, character_type) DO NOTHING;
    END LOOP;
    
    -- 消費記録を作成（各ユーザー5-20件）
    FOR j IN 1..(5 + floor(random() * 16)::INT) LOOP
      INSERT INTO consumptions (
        user_id,
        brand_name,
        product_type,
        container,
        volume_ml,
        quantity,
        venue_name,
        latitude,
        longitude,
        points_earned,
        created_at
      ) VALUES (
        user_id,
        brands[1 + floor(random() * array_length(brands, 1))::INT],
        CASE floor(random() * 7)::INT
          WHEN 0 THEN 'draft_beer'
          WHEN 1 THEN 'highball'
          WHEN 2 THEN 'sour'
          WHEN 3 THEN 'gin_soda'
          WHEN 4 THEN 'non_alcohol'
          WHEN 5 THEN 'water'
          ELSE 'softdrink'
        END,
        CASE floor(random() * 4)::INT
          WHEN 0 THEN 'ジョッキ'
          WHEN 1 THEN 'グラス'
          WHEN 2 THEN '缶'
          ELSE '瓶'
        END,
        CASE floor(random() * 3)::INT
          WHEN 0 THEN 350
          WHEN 1 THEN 500
          ELSE 700
        END,
        1,
        venues[1 + floor(random() * array_length(venues, 1))::INT],
        35.6812 + (random() - 0.5) * 0.1, -- 東京周辺の緯度
        139.7671 + (random() - 0.5) * 0.1, -- 東京周辺の経度
        10 + floor(random() * 20)::INT,
        created_date + (random() * 30 || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ========================================
-- 2. バッジマスタデータの作成
-- ========================================

INSERT INTO badges (id, name, icon, description, condition_type, condition_value, created_at) VALUES
  ('first_drink', 'はじめての一杯', '🍺', '初めて記録を作成', 'consumption_count', 1, NOW()),
  ('10_drinks', '常連さん', '🍻', '10回記録達成', 'consumption_count', 10, NOW()),
  ('50_drinks', 'ベテラン', '🏅', '50回記録達成', 'consumption_count', 50, NOW()),
  ('100_drinks', 'マスター', '👑', '100回記録達成', 'consumption_count', 100, NOW()),
  ('3days_streak', '3日連続', '🔥', '3日連続で記録', 'streak_days', 3, NOW()),
  ('7days_streak', '週間マスター', '🌟', '7日連続で記録', 'streak_days', 7, NOW()),
  ('30days_streak', '月間チャンピオン', '🏆', '30日連続で記録', 'streak_days', 30, NOW()),
  ('explorer', '探検家', '🗾', '5つの異なる店舗で記録', 'unique_venues', 5, NOW()),
  ('night_owl', 'ナイトオウル', '🌙', '22時以降に10回記録', 'time_condition', 10, NOW()),
  ('early_bird', '早起き鳥', '🌅', '午前中に5回記録', 'time_condition', 5, NOW()),
  ('weekend_warrior', '週末戦士', '🎉', '週末に20回記録', 'weekend_count', 20, NOW()),
  ('variety_seeker', 'バラエティシーカー', '🌈', '10種類の異なる商品を記録', 'unique_products', 10, NOW()),
  ('premium_lover', 'プレミアム愛好家', '💎', 'プレミアムモルツを10回記録', 'specific_product', 10, NOW()),
  ('highball_master', 'ハイボールマスター', '🥃', 'ハイボールを20回記録', 'product_type', 20, NOW()),
  ('healthy_choice', 'ヘルシーチョイス', '💚', 'ノンアルコールを10回記録', 'product_type', 10, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- ========================================
-- 3. ダミーユーザーにバッジを付与
-- ========================================

DO $$
DECLARE
  user_record RECORD;
  badge_record RECORD;
  consumption_count INT;
BEGIN
  -- 各ユーザーに対してバッジを付与
  FOR user_record IN SELECT user_id, total_points FROM profiles LOOP
    -- 消費記録数を取得
    SELECT COUNT(*) INTO consumption_count 
    FROM consumptions 
    WHERE user_id = user_record.user_id;
    
    -- 記録数に応じたバッジを付与
    IF consumption_count >= 1 THEN
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (user_record.user_id, 'first_drink', NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF consumption_count >= 10 THEN
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (user_record.user_id, '10_drinks', NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF consumption_count >= 50 THEN
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (user_record.user_id, '50_drinks', NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- ポイントが高いユーザーには追加バッジ
    IF user_record.total_points >= 1000 THEN
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES 
        (user_record.user_id, 'variety_seeker', NOW()),
        (user_record.user_id, 'explorer', NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- ランダムに追加バッジを付与（リアル感を出すため）
    IF random() > 0.5 THEN
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (user_record.user_id, 'weekend_warrior', NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF random() > 0.7 THEN
      INSERT INTO user_badges (user_id, badge_id, earned_at)
      VALUES (user_record.user_id, 'night_owl', NOW())
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ========================================
-- 4. 統計情報の確認
-- ========================================

-- 作成されたデータの確認
SELECT 
  'ユーザー数' as データ種別,
  COUNT(*) as 件数
FROM profiles
UNION ALL
SELECT 
  '消費記録数',
  COUNT(*)
FROM consumptions
UNION ALL
SELECT 
  'バッジ種類数',
  COUNT(*)
FROM badges
UNION ALL
SELECT 
  'ユーザーバッジ付与数',
  COUNT(*)
FROM user_badges;

-- ランキング確認（トップ10）
SELECT 
  p.nickname,
  p.total_points,
  COUNT(DISTINCT c.id) as 記録数,
  COUNT(DISTINCT ub.badge_id) as バッジ数
FROM profiles p
LEFT JOIN consumptions c ON c.user_id = p.user_id
LEFT JOIN user_badges ub ON ub.user_id = p.user_id
GROUP BY p.user_id, p.nickname, p.total_points
ORDER BY p.total_points DESC
LIMIT 10;