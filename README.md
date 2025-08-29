# サントリー飲食体験ゲーミフィケーションアプリ

「飲む瞬間をエンターテインメントに変える」AI画像解析とゲーミフィケーションで、サントリー商品の消費体験を楽しく記録・共有できるWebアプリケーション。

## 🚀 機能

- **AI画像解析**: OpenAI Vision APIによる飲料画像の自動解析
- **キャラクター育成**: 6種類のキャラクターと進化システム
- **ポイント・ランキング**: 飲用記録でポイント獲得、ランキング競争
- **称号・バッジ**: 実績解除システム
- **店舗連携**: 提携店舗でのチェックイン機能

## 🛠 技術スタック

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: OpenAI Vision API
- **Styling**: Tailwind CSS + Framer Motion
- **Hosting**: Vercel対応

## 📋 セットアップ

### 1. Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで以下のファイルを実行：
   - `/supabase/migrations/00001_initial_schema.sql`
   - `/supabase/seed.sql`

### 2. 環境変数の設定

`.env.local`ファイルに以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。
（ポートが使用中の場合は自動的に別のポートが割り当てられます）

## 🎮 使い方

1. **新規登録**: `/signup`から新規アカウントを作成
2. **ログイン**: メールアドレスとパスワードでログイン
3. **撮影**: 飲料を撮影してAI解析
4. **ポイント獲得**: 解析結果に応じてポイント獲得
5. **キャラクター育成**: 獲得したポイントでキャラクターが成長

## 📱 画面構成

### ユーザーアプリ（モバイル向け）
- **ホーム** (`/`): キャラクター表示、チャレンジ、クイックアクション
- **撮影・解析** (`/capture`): 画像撮影とAI解析
- **店舗** (`/venue`): 提携店舗一覧
- **ランキング** (`/leaderboard`): デイリー/週間/月間ランキング
- **マイページ** (`/profile`): キャラクターコレクション、バッジ、統計

## 🎮 キャラクターシステム

6種類のキャラクター：
- **プレモルくん**: ビール系
- **角ハイ坊や**: ハイボール系  
- **翠ジン妖精**: ジン系
- **レモンサワー兄弟**: サワー系
- **オールフリー先生**: ノンアル系
- **天然水スピリット**: 水・茶系

各キャラクターは4段階で進化（Lv.1→3→5→10）

## 🏆 ポイントシステム

- 基本: 1杯 = 10pt
- アルコール度数ボーナス
- 新商品ボーナス
- 連続来店ボーナス
- バランス飲用ボーナス

## 📊 データベース構造

主要テーブル：
- `profiles`: ユーザープロフィール
- `user_characters`: キャラクター所持状態
- `consumptions`: 飲用記録
- `user_badges`: 獲得バッジ
- `venues`: 店舗情報
- `leaderboard_cache`: ランキングキャッシュ

## 🔐 認証

Supabase Authenticationを使用。新規登録時に全キャラクターが自動付与されます。

## ⚠️ 注意事項

- 画像アップロード上限: 5MB
- AI解析は3秒以内のレスポンスを想定
- モバイルファースト設計（375px-428px最適化）
- CSSの問題により、現在は基本的なスタイルのみ適用されています

## 🚨 既知の問題

1. **CSS読み込み問題**: Tailwind CSSの一部クラスが適用されない
   - 解決策: PostCSS設定の調整が必要

2. **デモアカウント**: 
   - 新規登録から作成するか、Supabaseダッシュボードで直接ユーザーを作成してください

## 📝 開発メモ

### ビルド

```bash
npm run build
```

### 型チェック

```bash
npm run type-check
```

### コーディング規約

- TypeScript厳格モード
- Tailwind CSS使用（インラインスタイル禁止）
- App Router規約に準拠

## 🤝 今後の改善予定

- [ ] CSS問題の解決
- [ ] アニメーション強化
- [ ] リアルタイム対戦機能
- [ ] 実店舗IoT連携
- [ ] AR機能

## 📄 ライセンス

プロトタイプ版のため、商用利用は禁止されています。