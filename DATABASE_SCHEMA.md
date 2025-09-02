# データベーススキーマ仕様書

## 重要な制約事項

### 1. auth.usersテーブル（Supabase認証）
- **絶対にINSERTしない** - Supabase Authenticationが管理
- 新規ユーザーは必ずSupabase Auth APIを使用
- SQLでは参照のみ可能

### 2. profilesテーブル
- `user_id` - auth.users.idへの外部キー制約（CASCADE DELETE）
- **UNIQUE制約なし** - ON CONFLICT (user_id)は使用不可
- 新規プロファイルは必ずauth.usersに存在するuser_idを使用

### 3. 外部キー制約があるテーブル
```sql
-- 必ず以下のパターンで確認
WHERE user_id IN (SELECT id FROM auth.users)
```

## テーブル構造

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  display_name TEXT,  -- 追加カラム
  selected_character TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 注意: user_idにUNIQUE制約なし
```

### consumptions
```sql
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
```

### user_characters
```sql
CREATE TABLE user_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_type TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  evolution_stage INTEGER DEFAULT 1,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_type)  -- 複合UNIQUE制約
);
```

### user_badges
```sql
CREATE TABLE user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)  -- 複合主キー
);
```

### venues
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  qr_code TEXT,
  is_restaurant BOOLEAN DEFAULT true,  -- 追加カラム
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### check_ins
```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### venue_menus
```sql
CREATE TABLE venue_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  price INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## SQL実行時のチェックリスト

### ✅ 新規データ作成前
1. auth.usersへのINSERTは絶対NG
2. 外部キー制約の確認
3. UNIQUE/PRIMARY KEY制約の確認
4. ON CONFLICTを使う場合は制約の存在確認

### ✅ テストデータ作成
```sql
-- 良い例: 既存ユーザーのみ使用
UPDATE profiles 
SET display_name = 'テスト太郎'
WHERE user_id IN (SELECT id FROM auth.users)
  AND user_id = '実際のUUID';

-- 悪い例: 新規UUID生成
INSERT INTO profiles (user_id, display_name)
VALUES (gen_random_uuid(), 'テスト太郎');  -- ❌ 外部キーエラー
```

### ✅ ON CONFLICT使用時
```sql
-- user_charactersテーブル: 複合UNIQUE制約あり
INSERT INTO user_characters (user_id, character_type, level)
VALUES ('uuid', 'premol', 1)
ON CONFLICT (user_id, character_type) DO UPDATE SET level = 2;  -- ✅

-- profilesテーブル: UNIQUE制約なし
INSERT INTO profiles (user_id, display_name)
VALUES ('uuid', 'test')
ON CONFLICT (user_id) DO UPDATE SET display_name = 'test2';  -- ❌ エラー
```

## エラー対処法

### ERROR 42P10: no unique constraint matching ON CONFLICT
- 該当テーブルにUNIQUE制約がない
- 解決: ON CONFLICTを削除、またはUNIQUE制約を追加

### ERROR 23503: foreign key constraint violation
- auth.usersに存在しないuser_id
- 解決: 既存のuser_idを使用、または事前にユーザー作成

### ERROR 42703: column does not exist
- カラムが存在しない
- 解決: ALTER TABLE ADD COLUMN IF NOT EXISTS

### ERROR 42601: syntax error
- SQL構文エラー
- 解決: PostgreSQL構文の確認

## 開発ルール

1. **SQLは段階的に実行**
   - まずALTER TABLEでスキーマ変更
   - 次にデータ操作（INSERT/UPDATE）
   - 最後に確認クエリ

2. **必ずWHERE句で安全確認**
   ```sql
   WHERE user_id IN (SELECT id FROM auth.users)
   ```

3. **デバッグ用の確認クエリを含める**
   ```sql
   -- 実行前の確認
   SELECT COUNT(*) FROM auth.users;
   SELECT COUNT(*) FROM profiles WHERE user_id IN (SELECT id FROM auth.users);
   ```

4. **エラー時のロールバック考慮**
   - DELETE文は慎重に
   - 可能ならトランザクション使用

## テスト用SQLテンプレート

```sql
-- 安全なテストデータ更新
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- 既存ユーザーから1件取得
  SELECT id INTO test_user_id 
  FROM auth.users 
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- profilesを更新
    UPDATE profiles 
    SET display_name = 'テストユーザー',
        total_points = 1000
    WHERE user_id = test_user_id;
    
    -- 結果確認
    RAISE NOTICE 'Updated user: %', test_user_id;
  ELSE
    RAISE NOTICE 'No users found';
  END IF;
END $$;
```