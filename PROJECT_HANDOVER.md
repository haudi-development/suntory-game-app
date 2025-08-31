# プロジェクト引き継ぎドキュメント

## プロジェクト概要
サントリー飲食体験ゲーミフィケーションアプリの開発プロジェクト。
AI画像解析とゲーミフィケーション要素を組み合わせた、サントリー商品の消費体験を記録・共有するWebアプリケーション。

## 現在の状態
- **基本機能**: 完成済み
- **管理画面**: 実装済み
- **製品マスタDB**: 動作中
- **ダミーデータ**: 生成スクリプト完成
- **デプロイ**: Vercel + GitHub自動デプロイ設定済み

## 最近の重要な変更

### 1. SQL制約エラーの修正（2024-12-31）
- **問題**: profilesテーブルのON CONFLICT制約エラー
- **原因**: user_idカラムにユニーク制約がない
- **解決**: 
  - すべてのON CONFLICT句をIF NOT EXISTSチェックに置き換え
  - PL/pgSQL変数名を`user_id`から`new_user_id`に変更
  - 修正ファイル: `/supabase/seed-dummy-data.sql`, `/supabase/seed-top-rankers.sql`

### 2. サントリー製品マスタDB実装（2024-12-30）
- **目的**: 非サントリー製品（綾鷹等）のポイント付与を防止
- **実装**: 
  - `suntory_products`テーブル作成（100種類以上の製品登録）
  - AI解析時に動的に製品リストを取得
  - 管理画面から製品の追加・編集・削除可能

### 3. 管理ダッシュボード追加（2024-12-29）
- **場所**: `/admin`
- **機能**: 統計表示、ユーザー管理、製品管理、バッジ管理
- **認証**: 現状は認証なし（要実装）

## 技術的な注意点

### 1. Tailwind CSS
- **現状**: v3を使用（v4から手動でダウングレード済み）
- **理由**: v4で正しくスタイルが適用されない問題があった
- **注意**: v4へのアップグレードは慎重に

### 2. Supabase設定
- **RLS**: 全テーブルで有効
- **認証**: メール確認は無効化推奨
- **型生成**: `npm run supabase:types`で型定義を更新

### 3. OpenAI API
- **モデル**: gpt-4o-mini（Vision API）
- **用途**: 飲料画像の解析
- **制限**: 1リクエスト3秒以内のレスポンス想定

## 環境変数（必須）
```env
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_APP_URL=xxx
```

## データベース初期化手順

1. Supabaseプロジェクト作成
2. SQL Editorで以下を順番に実行：
   ```
   1. /supabase/migrations/00001_initial_schema.sql
   2. /supabase/seed-products.sql
   3. /supabase/fix-profiles-constraints.sql
   4. /supabase/fix-profiles-table.sql
   5. /supabase/seed-dummy-data.sql（オプション）
   6. /supabase/seed-top-rankers.sql（オプション）
   ```

## よくあるエラーと対処法

### 1. "column 'updated_at' does not exist"
- **対処**: `/supabase/fix-profiles-table.sql`を実行

### 2. "ON CONFLICT specification"エラー
- **対処**: `/supabase/fix-profiles-constraints.sql`を実行

### 3. "column reference 'user_id' is ambiguous"
- **対処**: 最新版のSQLファイルを使用（変数名修正済み）

## 未実装・改善が必要な機能

1. **管理画面の認証**
   - 現在は誰でもアクセス可能
   - 管理者ロールの実装が必要

2. **プッシュ通知**
   - PWA化と合わせて実装予定

3. **画像ストレージ**
   - 現在は画像を保存していない
   - Supabase Storageの活用を検討

4. **キャッシュ戦略**
   - ランキングキャッシュは実装済み
   - 他のデータもキャッシュ検討

## 開発時の注意事項

1. **コミット前**：
   - 型チェック: `npm run type-check`
   - リント: `npm run lint`

2. **新機能追加時**：
   - TypeScript strict modeを維持
   - モバイルファースト（375px-428px）で設計
   - Tailwind CSSのみ使用（インラインスタイル禁止）

3. **データベース変更時**：
   - マイグレーションファイルを作成
   - 型定義を更新: `npm run supabase:types`

## 次の開発者への引き継ぎメッセージ案

```
サントリーゲーミフィケーションアプリの開発を引き継ぎます。

## 現在の状態
- 基本機能、管理画面、製品マスタDBは実装済み
- SQLエラーはすべて修正済み（2024-12-31時点）
- Vercelにデプロイ済み、GitHub自動デプロイ設定済み

## 重要ファイル
- README.md: 完全なドキュメント
- PROJECT_HANDOVER.md: この引き継ぎ文書
- /supabase/: データベース関連ファイル
- /lib/openai/analysis.ts: AI解析ロジック
- /app/admin/: 管理画面

## 次の作業候補
1. 管理画面の認証実装
2. PWA対応
3. 画像ストレージ実装
4. プッシュ通知機能

## 環境変数
.env.localファイルに以下が必要：
- Supabase関連（URL, ANON_KEY, SERVICE_ROLE_KEY）
- OpenAI API Key
- App URL

質問があればGitHub Issuesまたは過去のコミット履歴を参照してください。
```

## リポジトリ情報
- **GitHub**: https://github.com/haudi-development/suntory-game-app
- **Vercel**: https://suntory-game-app.vercel.app
- **Supabase**: プロジェクトダッシュボードで確認

## 連絡先
GitHubのIssuesで質問を受け付けています。