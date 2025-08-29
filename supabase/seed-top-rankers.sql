-- トップランカー作成スクリプト
-- 特定のユーザーを上位にランクインさせる
-- Supabase SQL Editorで実行してください

-- ========================================
-- トップランカーの作成（より豪華なデータ）
-- ========================================

DO $$
DECLARE
  top_users RECORD[] := ARRAY[
    ROW('佐藤マスター', 'master@example.com', 12000, 'highball')::RECORD,
    ROW('プレモル王', 'premium@example.com', 10500, 'beer')::RECORD,
    ROW('ハイボール仙人', 'highball@example.com', 9800, 'highball')::RECORD,
    ROW('翠の達人', 'sui@example.com', 8500, 'gin')::RECORD,
    ROW('サワー女王', 'sour@example.com', 7200, 'sour')::RECORD
  ];
  
  elite_brands TEXT[] := ARRAY[
    'ザ・プレミアム・モルツ マスターズドリーム',
    '白州ハイボール',
    '知多ハイボール',
    'ザ・プレミアム・モルツ 香るエール',
    '翠ジンソーダ'
  ];
  
  new_user_id UUID;
  i INT;
  j INT;
BEGIN
  -- トップ5のエリートユーザーを作成
  FOR i IN 1..5 LOOP
    new_user_id := gen_random_uuid();
    
    -- プロフィール作成（高ポイント）
    INSERT INTO profiles (
      new_user_id,
      nickname,
      selected_character,
      total_points,
      created_at
    ) VALUES (
      new_user_id,
      CASE i
        WHEN 1 THEN '佐藤マスター'
        WHEN 2 THEN 'プレモル王'
        WHEN 3 THEN 'ハイボール仙人'
        WHEN 4 THEN '翠の達人'
        ELSE 'サワー女王'
      END,
      CASE i
        WHEN 1 THEN 'highball'
        WHEN 2 THEN 'beer'
        WHEN 3 THEN 'highball'
        WHEN 4 THEN 'gin'
        ELSE 'sour'
      END,
      CASE i
        WHEN 1 THEN 12000
        WHEN 2 THEN 10500
        WHEN 3 THEN 9800
        WHEN 4 THEN 8500
        ELSE 7200
      END,
      NOW() - INTERVAL '180 days' -- 半年前から活動
    );
    
    -- 全キャラクター解放（高レベル）
    INSERT INTO user_characters (
      new_user_id,
      character_type,
      level,
      exp,
      evolution_stage,
      created_at
    ) 
    SELECT 
      new_user_id,
      unnest(ARRAY['beer', 'highball', 'water', 'gin', 'sour', 'non_alcohol']),
      15 + floor(random() * 10)::INT, -- レベル15-25
      floor(random() * 100)::INT,
      3, -- 最終進化
      NOW() - INTERVAL '180 days'
    ON CONFLICT (user_id, character_type) DO NOTHING;
    
    -- 豊富な消費記録（200-300件）
    FOR j IN 1..(200 + floor(random() * 101)::INT) LOOP
      INSERT INTO consumptions (
        new_user_id,
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
        new_user_id,
        elite_brands[1 + floor(random() * array_length(elite_brands, 1))::INT],
        CASE i
          WHEN 1 THEN 'highball'
          WHEN 2 THEN 'draft_beer'
          WHEN 3 THEN 'highball'
          WHEN 4 THEN 'gin_soda'
          ELSE 'sour'
        END,
        'ジョッキ',
        700, -- 大ジョッキ中心
        1,
        'サントリーバー ' || 
          CASE floor(random() * 10)::INT
            WHEN 0 THEN '銀座店'
            WHEN 1 THEN '六本木店'
            WHEN 2 THEN '新宿店'
            WHEN 3 THEN '渋谷店'
            WHEN 4 THEN '品川店'
            WHEN 5 THEN '赤坂店'
            WHEN 6 THEN '丸の内店'
            WHEN 7 THEN '表参道店'
            WHEN 8 THEN '恵比寿店'
            ELSE '青山店'
          END,
        35.6812 + (random() - 0.5) * 0.1,
        139.7671 + (random() - 0.5) * 0.1,
        30 + floor(random() * 20)::INT, -- 高ポイント
        NOW() - (floor(random() * 180)::TEXT || ' days')::INTERVAL
      );
    END LOOP;
    
    -- 全バッジを付与
    INSERT INTO user_badges (user_id, badge_id, earned_at)
    SELECT 
      new_user_id,
      id,
      NOW() - (floor(random() * 180)::TEXT || ' days')::INTERVAL
    FROM badges
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END $$;

-- ========================================
-- 中堅ランカーの作成（6位〜20位）
-- ========================================

DO $$
DECLARE
  mid_nicknames TEXT[] := ARRAY[
    '週末の覇者', 'ビール侍', 'サワー姫', 'ハイボール番長', 'プレモル戦士',
    '角ハイ師匠', '翠の使者', 'オールフリーの王', '金麦ソムリエ', '-196℃マスター',
    'こだわり職人', 'トリスの達人', 'BOSS愛好家', '天然水の守護者', '伊右衛門の茶人'
  ];
  
  mid_user_id UUID;
  points INT;
  i INT;
  j INT;
BEGIN
  FOR i IN 1..15 LOOP
    mid_user_id := gen_random_uuid();
    points := 7000 - (i * 300) + floor(random() * 200)::INT;
    
    INSERT INTO profiles (
      user_id,
      nickname,
      selected_character,
      total_points,
      created_at
    ) VALUES (
      mid_user_id,
      mid_nicknames[i],
      (ARRAY['beer', 'highball', 'water', 'gin', 'sour', 'non_alcohol'])[1 + floor(random() * 6)::INT],
      points,
      NOW() - INTERVAL '90 days'
    );
    
    -- キャラクター解放（4-6体、レベル10-15）
    FOR j IN 1..(4 + floor(random() * 3)::INT) LOOP
      INSERT INTO user_characters (
        user_id,
        character_type,
        level,
        exp,
        evolution_stage,
        created_at
      ) VALUES (
        mid_user_id,
        (ARRAY['beer', 'highball', 'water', 'gin', 'sour', 'non_alcohol'])[j],
        10 + floor(random() * 6)::INT,
        floor(random() * 100)::INT,
        2,
        NOW() - INTERVAL '90 days'
      ) ON CONFLICT (user_id, character_type) DO NOTHING;
    END LOOP;
    
    -- 消費記録（50-100件）
    FOR j IN 1..(50 + floor(random() * 51)::INT) LOOP
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
        mid_user_id,
        (ARRAY['ザ・プレミアム・モルツ', '金麦', '角ハイボール', 'トリスハイボール', 
               'こだわり酒場のレモンサワー', '-196℃', '翠', 'オールフリー'])[1 + floor(random() * 8)::INT],
        (ARRAY['draft_beer', 'highball', 'sour', 'gin_soda', 'non_alcohol'])[1 + floor(random() * 5)::INT],
        (ARRAY['ジョッキ', 'グラス', '缶'])[1 + floor(random() * 3)::INT],
        (ARRAY[350, 500, 700])[1 + floor(random() * 3)::INT],
        1,
        'サントリーバー ' || (ARRAY['新宿', '渋谷', '池袋', '上野', '品川'])[1 + floor(random() * 5)::INT] || '店',
        35.6812 + (random() - 0.5) * 0.1,
        139.7671 + (random() - 0.5) * 0.1,
        15 + floor(random() * 15)::INT,
        NOW() - (floor(random() * 90)::TEXT || ' days')::INTERVAL
      );
    END LOOP;
    
    -- バッジ付与（5-10個）
    INSERT INTO user_badges (user_id, badge_id, earned_at)
    SELECT 
      mid_user_id,
      id,
      NOW() - (floor(random() * 90)::TEXT || ' days')::INTERVAL
    FROM badges
    WHERE random() > 0.5
    LIMIT 5 + floor(random() * 6)::INT
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END $$;

-- ========================================
-- 確認用クエリ
-- ========================================

-- トップ20ランキング表示
SELECT 
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as 順位,
  p.nickname as ニックネーム,
  p.total_points as ポイント,
  COUNT(DISTINCT c.id) as 記録数,
  COUNT(DISTINCT ub.badge_id) as バッジ数,
  COUNT(DISTINCT uc.character_type) as キャラ数,
  MAX(uc.level) as 最高レベル
FROM profiles p
LEFT JOIN consumptions c ON c.user_id = p.user_id
LEFT JOIN user_badges ub ON ub.user_id = p.user_id
LEFT JOIN user_characters uc ON uc.user_id = p.user_id
GROUP BY p.user_id, p.nickname, p.total_points
ORDER BY p.total_points DESC
LIMIT 20;

-- バッジ取得状況
SELECT 
  b.name as バッジ名,
  b.icon as アイコン,
  COUNT(ub.user_id) as 取得者数
FROM badges b
LEFT JOIN user_badges ub ON ub.badge_id = b.id
GROUP BY b.id, b.name, b.icon
ORDER BY COUNT(ub.user_id) DESC;