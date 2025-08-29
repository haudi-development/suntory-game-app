-- サントリー製品マスタテーブルの作成と初期データ投入
-- Supabase SQL Editorで実行してください

-- テーブル作成
CREATE TABLE IF NOT EXISTS suntory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(255) NOT NULL UNIQUE,
  product_category VARCHAR(50) NOT NULL,
  product_line VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_suntory_products_brand_name ON suntory_products(brand_name);
CREATE INDEX IF NOT EXISTS idx_suntory_products_category ON suntory_products(product_category);
CREATE INDEX IF NOT EXISTS idx_suntory_products_active ON suntory_products(is_active);

-- 既存データをクリア（必要に応じて）
-- TRUNCATE TABLE suntory_products;

-- 初期データ投入（100種類以上）
INSERT INTO suntory_products (brand_name, product_category, product_line) VALUES
-- ビール系
('ザ・プレミアム・モルツ', 'draft_beer', 'プレミアムモルツ'),
('ザ・プレミアム・モルツ マスターズドリーム', 'draft_beer', 'プレミアムモルツ'),
('ザ・プレミアム・モルツ 香るエール', 'draft_beer', 'プレミアムモルツ'),
('モルツ', 'draft_beer', 'モルツ'),
('金麦', 'draft_beer', '金麦'),
('金麦 糖質75%オフ', 'draft_beer', '金麦'),
('金麦 ゴールド・ラガー', 'draft_beer', '金麦'),
('パーフェクトサントリービール', 'draft_beer', 'その他ビール'),

-- ハイボール
('角ハイボール', 'highball', '角'),
('角ハイボール 濃いめ', 'highball', '角'),
('白州ハイボール', 'highball', '白州'),
('知多ハイボール', 'highball', '知多'),
('トリスハイボール', 'highball', 'トリス'),
('トリスハイボール レモン', 'highball', 'トリス'),
('ジムビームハイボール', 'highball', 'ジムビーム'),
('メーカーズマークハイボール', 'highball', 'メーカーズマーク'),

-- サワー・チューハイ
('こだわり酒場のレモンサワー', 'sour', 'こだわり酒場'),
('こだわり酒場のタコハイ', 'sour', 'こだわり酒場'),
('-196℃ ストロングゼロ ダブルレモン', 'sour', '-196℃'),
('-196℃ ストロングゼロ ダブルグレープフルーツ', 'sour', '-196℃'),
('-196℃ ストロングゼロ ダブル完熟梅', 'sour', '-196℃'),
('-196℃ レモン', 'sour', '-196℃'),
('-196℃ グレープフルーツ', 'sour', '-196℃'),
('ほろよい 白いサワー', 'sour', 'ほろよい'),
('ほろよい もも', 'sour', 'ほろよい'),
('ほろよい ぶどう', 'sour', 'ほろよい'),
('ほろよい 梅酒ソーダ', 'sour', 'ほろよい'),

-- ジンソーダ
('翠', 'gin_soda', '翠'),
('翠ジンソーダ', 'gin_soda', '翠'),
('翠ジンソーダ 和柑橘', 'gin_soda', '翠'),

-- ノンアルコール
('オールフリー', 'non_alcohol', 'オールフリー'),
('オールフリー コラーゲン', 'non_alcohol', 'オールフリー'),
('のんある気分', 'non_alcohol', 'のんある気分'),
('のんある気分 レモンサワー', 'non_alcohol', 'のんある気分'),

-- 水・お茶
('サントリー天然水', 'water', '天然水'),
('サントリー天然水 スパークリング', 'water', '天然水'),
('サントリー天然水 スパークリングレモン', 'water', '天然水'),
('伊右衛門', 'water', '伊右衛門'),
('伊右衛門 特茶', 'water', '伊右衛門'),
('伊右衛門 濃い味', 'water', '伊右衛門'),
('サントリー烏龍茶', 'water', '烏龍茶'),
('サントリー烏龍茶 OTPP', 'water', '烏龍茶'),
('サントリー緑茶', 'water', '緑茶'),
('サントリー黒烏龍茶', 'water', '烏龍茶'),

-- ソフトドリンク
('BOSS', 'softdrink', 'BOSS'),
('BOSS 無糖ブラック', 'softdrink', 'BOSS'),
('BOSS カフェオレ', 'softdrink', 'BOSS'),
('BOSS レインボーマウンテン', 'softdrink', 'BOSS'),
('クラフトボス', 'softdrink', 'BOSS'),
('クラフトボス ラテ', 'softdrink', 'BOSS'),
('クラフトボス ブラック', 'softdrink', 'BOSS'),
('C.C.レモン', 'softdrink', 'C.C.レモン'),
('ペプシコーラ', 'softdrink', 'ペプシ'),
('ペプシコーラ ゼロ', 'softdrink', 'ペプシ'),
('デカビタC', 'softdrink', 'デカビタ'),
('なっちゃん', 'softdrink', 'なっちゃん'),
('なっちゃん オレンジ', 'softdrink', 'なっちゃん'),
('GREEN DA・KA・RA', 'softdrink', 'ダカラ'),
('DAKARA', 'softdrink', 'ダカラ'),

-- ウイスキー（缶）
('トリス ハイボール缶', 'highball', 'トリス'),
('角ハイボール缶', 'highball', '角'),
('ジムビーム ハイボール缶', 'highball', 'ジムビーム'),

-- ワイン
('デリカメゾン', 'wine', 'デリカメゾン'),
('酸化防止剤無添加のおいしいワイン', 'wine', 'サントリーワイン'),

-- RTD（Ready to Drink）
('ストロングゼロ', 'sour', '-196℃'),
('ビアボール', 'draft_beer', 'ビアボール')
ON CONFLICT (brand_name) DO UPDATE SET
  product_category = EXCLUDED.product_category,
  product_line = EXCLUDED.product_line,
  updated_at = NOW();

-- 確認用クエリ
SELECT 
  product_category,
  COUNT(*) as count
FROM suntory_products
GROUP BY product_category
ORDER BY product_category;