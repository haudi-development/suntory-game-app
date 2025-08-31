# サントリー飲食体験ゲーミフィケーションアプリ

「飲む瞬間をエンターテインメントに変える」AI画像解析とゲーミフィケーションで、サントリー商品の消費体験を楽しく記録・共有できるWebアプリケーション。

## 🚀 主要機能

### ユーザー向け機能
- **AI画像解析**: OpenAI Vision API (gpt-4o-mini) による飲料画像の自動解析
  - サントリー製品データベース連携による動的製品認識
  - 非サントリー製品の除外機能
- **キャラクター育成**: 6種類のキャラクターと3段階進化システム
- **ポイント・ランキング**: 飲用記録でポイント獲得、リアルタイムランキング
- **バッジシステム**: 15種類の実績バッジ
- **店舗連携**: 提携店舗でのチェックイン機能

### 管理者向け機能（新機能）
- **管理ダッシュボード** (`/admin`): 統計情報、ユーザー管理、システム監視
- **製品マスタ管理**: サントリー製品の追加・編集・削除
- **ダミーデータ生成**: テスト用ユーザー・ランキングデータの一括生成
- **リアルタイム統計**: アクティブユーザー数、消費記録、ポイント分布の可視化

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Row Level Security)
- **AI**: OpenAI Vision API (gpt-4o-mini model)
- **Styling**: Tailwind CSS v3 + Framer Motion
- **Deployment**: Vercel + GitHub Actions
- **Type Safety**: TypeScript (strict mode)

## 📋 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/haudi-development/suntory-game-app.git
cd suntory-game-app
```

### 2. Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで以下のファイルを順番に実行：
   ```sql
   -- 基本スキーマ
   /supabase/migrations/00001_initial_schema.sql
   
   -- 製品マスタデータ
   /supabase/seed-products.sql
   
   -- プロファイル制約の修正
   /supabase/fix-profiles-constraints.sql
   /supabase/fix-profiles-table.sql
   
   -- ダミーデータ（オプション）
   /supabase/seed-dummy-data.sql
   /supabase/seed-top-rankers.sql
   ```

### 3. 環境変数の設定

`.env.local`ファイルを作成：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 🎮 使い方

### ユーザーアプリ
1. **新規登録**: `/signup`から新規アカウントを作成
2. **ログイン**: メールアドレスとパスワードでログイン
3. **撮影**: 飲料を撮影してAI解析（`/capture`）
4. **ポイント獲得**: サントリー製品のみポイント付与
5. **キャラクター育成**: 獲得したポイントでキャラクターが成長

### 管理画面
1. **アクセス**: `/admin`から管理画面へ
2. **統計確認**: ダッシュボードで各種指標を確認
3. **製品管理**: `/admin/products`で製品マスタを管理
4. **ユーザー管理**: `/admin/users`でユーザー情報を確認

## 📱 画面構成

### ユーザーアプリ（モバイル最適化: 375px-428px）
- **ホーム** (`/`): キャラクター表示、チャレンジ、クイックアクション
- **撮影・解析** (`/capture`): 画像撮影とAI解析
- **店舗** (`/venue`): 提携店舗一覧と地図表示
- **ランキング** (`/leaderboard`): デイリー/週間/月間ランキング
- **マイページ** (`/profile`): キャラクターコレクション、バッジ、統計

### 管理画面（デスクトップ向け）
- **ダッシュボード** (`/admin`): 統計サマリー、グラフ、KPI
- **ユーザー管理** (`/admin/users`): ユーザー一覧、詳細、編集
- **製品管理** (`/admin/products`): サントリー製品マスタCRUD
- **バッジ管理** (`/admin/badges`): バッジ設定と付与状況
- **設定** (`/admin/settings`): システム設定

## 🎮 キャラクターシステム

6種類のキャラクター：
- **プレモルくん** (beer): ビール系
- **角ハイ坊や** (highball): ハイボール系  
- **翠ジン妖精** (gin): ジン系
- **レモンサワー兄弟** (sour): サワー系
- **オールフリー先生** (non_alcohol): ノンアル系
- **天然水スピリット** (water): 水・茶系

進化段階：
- Stage 1: Lv.1-2（初期形態）
- Stage 2: Lv.3-4（中間形態）
- Stage 3: Lv.5+（最終形態）

## 🏆 ポイント・バッジシステム

### ポイント獲得
- 基本ポイント: 10-30pt/杯
- ボーナス:
  - 新商品: +20pt
  - 連続記録: +5pt/日
  - バランス飲用: +10pt
  - 提携店舗: ×1.5倍

### バッジ（15種類）
- **消費記録系**: はじめての一杯、常連さん、ベテラン、マスター
- **連続記録系**: 3日連続、週間マスター、月間チャンピオン
- **探索系**: 探検家、ナイトオウル、早起き鳥、週末戦士
- **商品系**: バラエティシーカー、プレミアム愛好家、ハイボールマスター、ヘルシーチョイス

## 📊 データベース構造

### 主要テーブル
- `profiles`: ユーザープロフィール（総ポイント、選択キャラクター）
- `user_characters`: キャラクター所持・レベル状態
- `consumptions`: 飲用記録（場所、時間、商品、ポイント）
- `badges`: バッジマスタ
- `user_badges`: バッジ獲得状況
- `venues`: 提携店舗情報
- `suntory_products`: サントリー製品マスタ（100種類以上）
- `leaderboard_cache`: ランキングキャッシュ

### Row Level Security (RLS)
全テーブルでRLSを有効化し、ユーザーは自分のデータのみアクセス可能

## 🔐 セキュリティ

- Supabase Authentication（メール認証）
- Row Level Security (RLS) による行レベルアクセス制御
- API Routeでのサーバーサイド処理
- 環境変数による機密情報管理
- OpenAI APIキーのサーバーサイド保護

## 📈 パフォーマンス最適化

- Next.js App Routerによる自動コード分割
- 画像最適化（next/image使用）
- Supabaseリアルタイム購読の適切な管理
- ランキングのキャッシュ機構
- データベースインデックスの最適化

## 🚨 トラブルシューティング

### よくある問題と解決方法

1. **Tailwind CSSが適用されない**
   - v4からv3へのダウングレードで解決済み
   - `npm run dev`で開発サーバー再起動

2. **Supabaseメール認証エラー**
   - Auth設定でメール確認を無効化
   - または`/supabase/confirm-emails.sql`を実行

3. **ON CONFLICT制約エラー**
   - `/supabase/fix-profiles-constraints.sql`を実行
   - ユニーク制約を追加

4. **画像アップロードエラー**
   - ファイルサイズ上限: 5MB
   - 対応形式: JPEG, PNG, WebP

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# 型チェック
npm run type-check

# リント
npm run lint

# Supabase型生成
npm run supabase:types
```

## 📝 コーディング規約

- TypeScript strict mode使用
- Tailwind CSSでスタイリング（インラインスタイル禁止）
- App Router規約準拠
- コンポーネントは`/components`配下に配置
- 共通ロジックは`/lib`配下に配置
- 型定義は`/types`に集約

## 🚀 デプロイ

### Vercel（推奨）
1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. 自動デプロイ有効化

### 環境変数（本番環境）
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🗓 更新履歴

### v1.3.0 (2024-12-31)
- ON CONFLICT制約エラーの完全修正
- SQL変数名の競合解消
- ダミーデータ生成スクリプトの安定化

### v1.2.0 (2024-12-30)
- 管理画面の大幅改善
- サントリー製品マスタDB実装
- 動的製品認識システム
- ダミーデータ生成機能

### v1.1.0 (2024-12-29)
- 管理ダッシュボード追加
- ランキングシステム強化
- バッジシステム実装

### v1.0.0 (2024-12-28)
- 初期リリース
- 基本機能実装

## 🤝 今後の開発予定

- [ ] PWA対応
- [ ] プッシュ通知
- [ ] SNS共有機能
- [ ] リアルタイム対戦
- [ ] AR機能
- [ ] 実店舗IoT連携
- [ ] 多言語対応

## 📄 ライセンス

プロトタイプ版のため、商用利用は禁止されています。

## 📞 お問い合わせ

開発に関する質問や提案は、GitHubのIssuesまでお願いします。

---

**Repository**: https://github.com/haudi-development/suntory-game-app  
**Demo**: https://suntory-game-app.vercel.app  
**Documentation**: このREADME.mdを参照