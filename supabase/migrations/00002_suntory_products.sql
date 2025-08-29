-- サントリー製品マスタテーブル
CREATE TABLE IF NOT EXISTS suntory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(255) NOT NULL UNIQUE,
  product_category VARCHAR(50) NOT NULL, -- draft_beer, highball, sour, gin_soda, non_alcohol, water, softdrink, wine, whisky
  product_line VARCHAR(255), -- 商品ライン（例：プレミアムモルツ、-196℃）
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_suntory_products_brand_name ON suntory_products(brand_name);
CREATE INDEX idx_suntory_products_category ON suntory_products(product_category);
CREATE INDEX idx_suntory_products_active ON suntory_products(is_active);

-- 初期データ投入
INSERT INTO suntory_products (brand_name, product_category, product_line) VALUES
-- ビール
('ザ・プレミアム・モルツ', 'draft_beer', 'プレミアムモルツ'),
('ザ・プレミアム・モルツ マスターズドリーム', 'draft_beer', 'プレミアムモルツ'),
('ザ・プレミアム・モルツ 香るエール', 'draft_beer', 'プレミアムモルツ'),
('モルツ', 'draft_beer', 'モルツ'),
('金麦', 'draft_beer', '金麦'),
('金麦 糖質75%オフ', 'draft_beer', '金麦'),
('金麦 ゴールド・ラガー', 'draft_beer', '金麦'),
('セブンプレミアム ザ・ブリュー', 'draft_beer', 'その他ビール'),
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
('ほろよい カシスとオレンジ', 'sour', 'ほろよい'),
('ほろよい 梅酒ソーダ', 'sour', 'ほろよい'),
('ストロングゼロ', 'sour', 'ストロングゼロ'),

-- ジン
('翠 ジンソーダ', 'gin_soda', '翠'),
('翠 ジンソーダ 濃いめ', 'gin_soda', '翠'),
('ROKU ジン', 'gin_soda', 'ROKU'),
('ビーフィーター ジン', 'gin_soda', 'ビーフィーター'),

-- ノンアルコール
('オールフリー', 'non_alcohol', 'オールフリー'),
('オールフリー コラーゲンリッチ', 'non_alcohol', 'オールフリー'),
('オールフリー ライムショット', 'non_alcohol', 'オールフリー'),
('のんある気分', 'non_alcohol', 'のんある気分'),
('のんある気分 レモンサワーテイスト', 'non_alcohol', 'のんある気分'),
('のんある気分 梅酒サワーテイスト', 'non_alcohol', 'のんある気分'),

-- 水・お茶
('サントリー天然水', 'water', '天然水'),
('サントリー天然水 スパークリング', 'water', '天然水'),
('サントリー天然水 スパークリングレモン', 'water', '天然水'),
('南アルプスの天然水', 'water', '天然水'),
('サントリー烏龍茶', 'water', 'お茶'),
('伊右衛門', 'water', 'お茶'),
('伊右衛門 特茶', 'water', 'お茶'),
('伊右衛門 京都ブレンド', 'water', 'お茶'),
('伊右衛門 濃い味', 'water', 'お茶'),
('黒烏龍茶', 'water', 'お茶'),
('胡麻麦茶', 'water', 'お茶'),
('GREEN DA・KA・RA', 'water', 'GREEN DAKARA'),
('GREEN DA・KA・RA やさしい麦茶', 'water', 'GREEN DAKARA'),

-- コーヒー
('BOSS 無糖ブラック', 'softdrink', 'BOSS'),
('BOSS カフェオレ', 'softdrink', 'BOSS'),
('BOSS レインボーマウンテンブレンド', 'softdrink', 'BOSS'),
('BOSS THE LATTE', 'softdrink', 'BOSS'),
('クラフトボス ブラック', 'softdrink', 'クラフトボス'),
('クラフトボス ラテ', 'softdrink', 'クラフトボス'),
('クラフトボス 微糖', 'softdrink', 'クラフトボス'),
('プレミアムボス', 'softdrink', 'BOSS'),

-- ソフトドリンク
('C.C.レモン', 'softdrink', 'C.C.レモン'),
('C.C.レモン ゼロ', 'softdrink', 'C.C.レモン'),
('ペプシコーラ', 'softdrink', 'ペプシ'),
('ペプシコーラ ゼロ', 'softdrink', 'ペプシ'),
('ペプシ スペシャル', 'softdrink', 'ペプシ'),
('なっちゃん オレンジ', 'softdrink', 'なっちゃん'),
('なっちゃん りんご', 'softdrink', 'なっちゃん'),
('デカビタC', 'softdrink', 'デカビタ'),
('デカビタC ゼロ', 'softdrink', 'デカビタ'),
('リプトン ミルクティー', 'softdrink', 'リプトン'),
('リプトン レモンティー', 'softdrink', 'リプトン'),
('オランジーナ', 'softdrink', 'オランジーナ'),
('レモンジーナ', 'softdrink', 'オランジーナ'),

-- ワイン
('酸化防止剤無添加のおいしいワイン', 'wine', 'おいしいワイン'),
('デリカメゾン', 'wine', 'デリカメゾン'),
('フロムファーム', 'wine', 'フロムファーム'),
('サンタ バイ サンタ カロリーナ', 'wine', 'サンタ'),

-- ウイスキー
('山崎', 'whisky', '山崎'),
('白州', 'whisky', '白州'),
('響', 'whisky', '響'),
('知多', 'whisky', '知多'),
('角瓶', 'whisky', '角'),
('トリス', 'whisky', 'トリス'),
('トリス クラシック', 'whisky', 'トリス'),
('ローヤル', 'whisky', 'ローヤル'),
('オールド', 'whisky', 'オールド'),
('ジムビーム', 'whisky', 'ジムビーム'),
('メーカーズマーク', 'whisky', 'メーカーズマーク'),
('バランタイン', 'whisky', 'バランタイン'),
('ラフロイグ', 'whisky', 'ラフロイグ'),
('ボウモア', 'whisky', 'ボウモア'),
('マッカラン', 'whisky', 'マッカラン')
ON CONFLICT (brand_name) DO NOTHING;

-- RLS
ALTER TABLE suntory_products ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Products are viewable by everyone" ON suntory_products
  FOR SELECT USING (true);

-- 管理者のみ編集可能（今は全員可能にしておく）
CREATE POLICY "Products are editable by admins" ON suntory_products
  FOR ALL USING (true);