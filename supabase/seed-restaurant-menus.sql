-- 飲食店向けサントリー商品マスタとメニューデータ

-- まず飲食店フラグを更新
UPDATE venues 
SET is_restaurant = true,
    special_bonus_points = 50,
    opening_hours = '{
      "mon": "17:00-23:00",
      "tue": "17:00-23:00", 
      "wed": "17:00-23:00",
      "thu": "17:00-23:00",
      "fri": "17:00-24:00",
      "sat": "15:00-24:00",
      "sun": "15:00-22:00"
    }'::jsonb
WHERE name IN (
  'サントリー銀座ビアホール',
  'プレモル横丁 新宿店',
  '角ハイボール酒場 渋谷',
  'SUNTORY CRAFT BAR',
  'ザ・モルツ テラス'
);

-- 飲食店向けサントリー製品をproductsテーブルに追加
INSERT INTO suntory_products (brand_name, english_name, product_type, points_per_unit, is_active, category)
VALUES 
  -- 生ビール
  ('ザ・プレミアム・モルツ 生', 'The Premium Malts Draft', 'draft_beer', 35, true, 'restaurant'),
  ('ザ・プレミアム・モルツ 黒生', 'The Premium Malts Black Draft', 'draft_beer', 35, true, 'restaurant'),
  ('モルツ 生', 'Malts Draft', 'draft_beer', 30, true, 'restaurant'),
  
  -- ハイボール（ジョッキ・グラス）
  ('角ハイボール ジョッキ', 'Kaku Highball Jug', 'highball', 35, true, 'restaurant'),
  ('角ハイボール グラス', 'Kaku Highball Glass', 'highball', 25, true, 'restaurant'),
  ('知多ハイボール', 'Chita Highball', 'highball', 40, true, 'restaurant'),
  ('白州ハイボール', 'Hakushu Highball', 'highball', 50, true, 'restaurant'),
  
  -- サワー（グラス・ピッチャー）
  ('こだわり酒場のレモンサワー', 'Kodawari Lemon Sour', 'sour', 30, true, 'restaurant'),
  ('翠ジンソーダ', 'Sui Gin Soda', 'gin_soda', 35, true, 'restaurant'),
  ('-196℃ ストロングゼロ', '-196°C Strong Zero', 'sour', 30, true, 'restaurant'),
  
  -- ピッチャー
  ('角ハイボール ピッチャー', 'Kaku Highball Pitcher', 'highball', 100, true, 'restaurant'),
  ('レモンサワー ピッチャー', 'Lemon Sour Pitcher', 'sour', 90, true, 'restaurant')
ON CONFLICT (brand_name) DO NOTHING;

-- 店舗メニューデータを挿入
DO $$
DECLARE
  v_venue_id UUID;
  v_venue_name TEXT;
BEGIN
  -- 各飲食店にメニューを追加
  FOR v_venue_id, v_venue_name IN 
    SELECT id, name FROM venues WHERE is_restaurant = true
  LOOP
    INSERT INTO venue_menus (venue_id, product_name, product_name_en, product_type, container, default_volume_ml, price, points_per_unit)
    VALUES
      -- ビール系
      (v_venue_id, 'ザ・プレミアム・モルツ 生中', 'Premium Malts Draft Medium', 'draft_beer', 'jug', 435, 650, 35),
      (v_venue_id, 'ザ・プレミアム・モルツ 生大', 'Premium Malts Draft Large', 'draft_beer', 'jug', 633, 850, 45),
      (v_venue_id, 'ザ・プレミアム・モルツ グラス', 'Premium Malts Glass', 'draft_beer', 'glass', 334, 550, 30),
      (v_venue_id, 'モルツ 生中', 'Malts Draft Medium', 'draft_beer', 'jug', 435, 550, 30),
      
      -- ハイボール系
      (v_venue_id, '角ハイボール ジョッキ', 'Kaku Highball Jug', 'highball', 'jug', 500, 500, 35),
      (v_venue_id, '角ハイボール グラス', 'Kaku Highball Glass', 'highball', 'glass', 350, 400, 25),
      (v_venue_id, '角メガハイボール', 'Kaku Mega Highball', 'highball', 'mega_jug', 750, 700, 50),
      (v_venue_id, '知多ハイボール', 'Chita Highball', 'highball', 'glass', 350, 600, 40),
      
      -- サワー系
      (v_venue_id, 'こだわり酒場のレモンサワー', 'Kodawari Lemon Sour', 'sour', 'glass', 350, 450, 30),
      (v_venue_id, '翠ジンソーダ', 'Sui Gin Soda', 'gin_soda', 'glass', 350, 500, 35),
      (v_venue_id, '-196℃ ストロングゼロ', 'Strong Zero', 'sour', 'glass', 350, 480, 30),
      
      -- ピッチャー
      (v_venue_id, '角ハイボール ピッチャー', 'Kaku Highball Pitcher', 'highball', 'pitcher', 1500, 1800, 100),
      (v_venue_id, 'レモンサワー ピッチャー', 'Lemon Sour Pitcher', 'sour', 'pitcher', 1500, 1600, 90),
      
      -- ノンアル
      (v_venue_id, 'オールフリー', 'All-Free', 'non_alcohol', 'bottle', 334, 400, 15),
      (v_venue_id, 'のんある気分', 'Non-aru Kibun', 'non_alcohol', 'can', 350, 380, 15)
    ON CONFLICT (venue_id, product_name, container) DO NOTHING;
  END LOOP;
END $$;

-- デモ用のチェックイン履歴（オプション）
INSERT INTO check_ins (user_id, venue_id, check_in_method, checked_in_at, checked_out_at, is_active, points_earned)
SELECT 
  u.id,
  v.id,
  CASE WHEN RANDOM() < 0.3 THEN 'beacon' 
       WHEN RANDOM() < 0.6 THEN 'qr'
       ELSE 'manual' END,
  NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30),
  NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30) + INTERVAL '2 hours',
  false,
  50 + FLOOR(RANDOM() * 200)
FROM 
  (SELECT id FROM auth.users LIMIT 10) u
  CROSS JOIN 
  (SELECT id FROM venues WHERE is_restaurant = true LIMIT 3) v
ON CONFLICT DO NOTHING;