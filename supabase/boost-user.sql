-- 特定ユーザーをランキング上位にブーストするスクリプト
-- Supabase SQL Editorで実行してください

-- ========================================
-- 特定のメールアドレスのユーザーを強化
-- ========================================

-- メールアドレスを指定（変更してください）
DO $$
DECLARE
  target_email TEXT := 'asada@haudi.jp'; -- ここを変更
  target_user_id UUID;
  boost_points INT := 5000; -- 追加するポイント数
  i INT;
BEGIN
  -- メールアドレスからユーザーIDを取得
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    -- auth.usersにアクセスできない場合は、nicknameから検索
    SELECT user_id INTO target_user_id
    FROM profiles
    WHERE nickname LIKE '%asada%' OR nickname LIKE '%浅田%'
    LIMIT 1;
  END IF;
  
  IF target_user_id IS NOT NULL THEN
    -- ポイントを大幅に増加
    UPDATE profiles
    SET 
      total_points = COALESCE(total_points, 0) + boost_points
    WHERE user_id = target_user_id;
    
    -- 全キャラクターを解放（高レベル）
    INSERT INTO user_characters (
      user_id,
      character_type,
      level,
      exp,
      evolution_stage,
      created_at
    )
    SELECT 
      target_user_id,
      unnest(ARRAY['beer', 'highball', 'water', 'gin', 'sour', 'non_alcohol']),
      20, -- レベル20
      90, -- 経験値90%
      3,  -- 最終進化
      NOW()
    ON CONFLICT (user_id, character_type) 
    DO UPDATE SET 
      level = GREATEST(user_characters.level, 20),
      evolution_stage = 3;
    
    -- プレミアムな消費記録を追加（50件）
    FOR i IN 1..50 LOOP
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
        target_user_id,
        CASE floor(random() * 5)::INT
          WHEN 0 THEN 'ザ・プレミアム・モルツ マスターズドリーム'
          WHEN 1 THEN '白州ハイボール'
          WHEN 2 THEN '知多ハイボール'
          WHEN 3 THEN '翠'
          ELSE 'ザ・プレミアム・モルツ'
        END,
        CASE floor(random() * 5)::INT
          WHEN 0 THEN 'draft_beer'
          WHEN 1 THEN 'highball'
          WHEN 2 THEN 'gin_soda'
          WHEN 3 THEN 'sour'
          ELSE 'draft_beer'
        END,
        'ジョッキ',
        700,
        1,
        'サントリーバー ' || 
          CASE floor(random() * 5)::INT
            WHEN 0 THEN '銀座店'
            WHEN 1 THEN '六本木店'
            WHEN 2 THEN '新宿店'
            WHEN 3 THEN '渋谷店'
            ELSE '品川店'
          END,
        35.6812 + (random() - 0.5) * 0.1,
        139.7671 + (random() - 0.5) * 0.1,
        50, -- 高ポイント
        NOW() - (floor(random() * 30)::TEXT || ' days')::INTERVAL
      );
    END LOOP;
    
    -- 全バッジを付与
    INSERT INTO user_badges (user_id, badge_id, earned_at)
    SELECT 
      target_user_id,
      id,
      NOW() - (floor(random() * 30)::TEXT || ' days')::INTERVAL
    FROM badges
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    RAISE NOTICE 'ユーザー % を強化しました', target_email;
  ELSE
    RAISE NOTICE 'ユーザー % が見つかりませんでした', target_email;
  END IF;
END $$;

-- ========================================
-- 結果確認
-- ========================================

-- 強化後のランキング確認
SELECT 
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as 順位,
  p.nickname as ニックネーム,
  p.total_points as ポイント,
  COUNT(DISTINCT c.id) as 記録数,
  COUNT(DISTINCT ub.badge_id) as バッジ数,
  p.created_at::DATE as 登録日
FROM profiles p
LEFT JOIN consumptions c ON c.user_id = p.user_id
LEFT JOIN user_badges ub ON ub.user_id = p.user_id
GROUP BY p.user_id, p.nickname, p.total_points, p.created_at
ORDER BY p.total_points DESC
LIMIT 10;

-- 特定ユーザーの詳細確認（nicknameで検索）
SELECT 
  p.nickname,
  p.total_points,
  p.selected_character,
  COUNT(DISTINCT c.id) as 記録数,
  COUNT(DISTINCT ub.badge_id) as バッジ数,
  COUNT(DISTINCT uc.character_type) as キャラ数,
  MAX(uc.level) as 最高レベル
FROM profiles p
LEFT JOIN consumptions c ON c.user_id = p.user_id
LEFT JOIN user_badges ub ON ub.user_id = p.user_id
LEFT JOIN user_characters uc ON uc.user_id = p.user_id
WHERE p.nickname LIKE '%asada%' OR p.nickname LIKE '%浅田%'
GROUP BY p.user_id, p.nickname, p.total_points, p.selected_character;

-- ========================================
-- クイックブーストコマンド（簡易版）
-- ========================================

-- 任意のユーザーに即座に1000ポイント追加
-- nicknameを変更して実行
/*
UPDATE profiles
SET total_points = total_points + 1000
WHERE nickname = 'あなたのニックネーム';
*/

-- 全員に100ポイントボーナス
/*
UPDATE profiles
SET total_points = total_points + 100;
*/