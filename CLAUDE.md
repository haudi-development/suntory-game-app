# サントリー飲食体験ゲーミフィケーションアプリ - 開発ルール

## プロジェクト概要
AI画像解析とゲーミフィケーションで飲食体験をエンターテインメント化するWebアプリ

## 技術スタック（厳守）
- Next.js 14 (App Router必須)
- Supabase (PostgreSQL + Auth + Realtime)
- OpenAI Vision API
- Vercel
- Tailwind CSS + Framer Motion

## 重要な開発ルール

### 1. ディレクトリ構造
```
/app                    # ユーザー向けアプリ
  /(auth)              # 認証関連
  /(main)              # メインアプリ
    /capture           # 撮影・AI解析
    /venue            # 店舗関連
    /profile          # マイページ
    /leaderboard      # ランキング
/app/admin             # 管理者向け
/app/screen           # 店内ディスプレイ
/components
  /ui                 # 共通UIコンポーネント
  /game              # ゲーム要素（キャラクター等）
/lib
  /supabase          # Supabase関連
  /openai            # AI解析
/public
  /characters        # キャラクター画像
```

### 2. デザインシステム
```css
/* 必ずこのカラーパレットを使用 */
--primary: #6DCFF6;      /* サントリー爽やか水色 */
--primary-dark: #0099DA; /* サントリー青 */
--accent: #FFD700;       /* ゴールド（成功・レベルアップ） */
```

### 3. AI画像解析仕様
```typescript
// 必ず以下の形式でレスポンスを返す
interface AIAnalysisResult {
  brand_name: string;      // 商品名（商品マスタと照合）
  product_type: string;    // draft_beer/highball/sour等
  container: string;       // ジョッキ/グラス/缶
  volume_ml: number;       // 推定容量
  quantity: number;        // 写っている数
  confidence: number;      // 信頼度(0-1)
}
```

### 4. キャラクターシステム
6種類のキャラクター（変更禁止）:
- プレモルくん - ビール系
- 角ハイ坊や - ハイボール系
- 翠ジン妖精 - ジン系
- レモンサワー兄弟 - サワー系
- オールフリー先生 - ノンアル系
- 天然水スピリット - 水・茶系

進化段階: 4段階（レベル1→3→5→10で進化）

### 5. データベース命名規則
- テーブル名: 複数形小文字（users, consumptions）
- カラム名: スネークケース（user_id, created_at）
- 外部キー: テーブル名_id形式

### 6. API設計
```typescript
// Supabase RPCは以下の命名規則
get_user_ranking(user_id, scope, period)
record_consumption(user_id, venue_id, consumption_data)
update_character_exp(user_id, character_type, exp_gained)
```

### 7. モバイルファースト必須
- ユーザーアプリ: 375px-428px最適化
- タッチ操作前提（ボタン最小44px）
- スワイプジェスチャー対応

### 8. パフォーマンス要件
- 画像: 最大5MB、自動圧縮
- AI解析: 3秒以内にレスポンス
- アニメーション: 60fps維持

### 9. エラーハンドリング
- AI解析失敗時: 手動選択フォールバック必須
- ネットワークエラー: オフライン対応メッセージ
- 認証エラー: 自動リダイレクト

### 10. 商品マスタ区分
- 飲食店向け: draft_beer, highball, sour等（サーバー提供）
- 小売店向け: can_beer, can_highball等（缶・瓶）
※Phase1は飲食店向けのみ実装

## 実装禁止事項
- localStorage/sessionStorageの使用（Supabase使用）
- 外部CDNからのスクリプト読み込み
- インラインスタイル（Tailwind使用）
- any型の使用（TypeScript厳格モード）

## コミット規則
- feat: 新機能追加
- fix: バグ修正
- style: スタイル調整
- refactor: リファクタリング
- docs: ドキュメント更新

## 環境変数（.env.local必須）
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

## フェーズ管理
- Phase1: 基本機能（AI解析、記録、簡易ランキング）
- Phase2: ゲーミフィケーション（キャラ、称号、アニメ）
- Phase3: 実店舗連携（IoT、リアルタイム演出）

## デモ用ダミーデータ
必ず以下の店舗を初期データに含める:
- 銀座プレモルテラス
- 梅田角ハイ横丁
- 札幌ビール園
- 名古屋翠ジンバー
- 福岡レモンサワー屋台

## 開発時の約束

### ビルド確認の徹底
- 報告前に必ず `npm run build` を実行
- エラーゼロを確認してから報告
- TypeScriptの型エラーも完全解消
- **エラーが完全に解消されるまで開発完了報告をしない**
- 開発サーバーが正常に動作し、全ページが表示可能な状態を確認

### GitHubプッシュルール（重要）
- **変更がある時は必ずGitHubにプッシュする**
- プッシュ前に必ず `npm run build` でビルドテストを実行
- ビルドエラーがないことを確認してからコミット・プッシュ
- 各機能実装・バグ修正後は即座にプッシュ
- プッシュ漏れを防ぐため、作業終了時に必ず `git status` で確認

### テスト実施
- 各機能実装後に動作確認
- 主要なユーザーフローを毎回検証
- エッジケースも考慮したテスト

### ドキュメント管理
- 進捗状況を PROGRESS.md に記録
- 設計情報を DESIGN.md に整理
- APIドキュメントを API.md に記載

### 自主的な開発
- 詳細な実装方法は自己判断で決定
- UIの細部は最適と思う方法で実装
- 不明点は仕様書から推測して進行

### 品質保証
- TypeScriptのany型を使用しない
- 適切なエラーハンドリング実装
- パフォーマンスを意識した実装

### 誠実な報告
- 実装できない機能は早期に報告
- 推測で実装した箇所は明示
- 技術的制約は隠さず共有