# GitHub & Vercelデプロイ手順

## 1. GitHubリポジトリの作成

以下の手順でGitHubにリポジトリを作成してください：

### 方法A: GitHub Webサイトから
1. https://github.com/haudi-development にアクセス
2. "New repository"をクリック
3. リポジトリ名: `suntory-game-app`
4. 公開設定: Public
5. READMEやライセンスは追加しない（既にあるため）
6. "Create repository"をクリック

### 方法B: GitHub CLIを使用（認証済みの場合）
```bash
gh auth login
gh repo create haudi-development/suntory-game-app --public --source=. --remote=origin --push
```

## 2. 手動でプッシュ（方法Aの場合）

リポジトリ作成後、以下のコマンドを実行：

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/haudi-development/suntory-game-app.git

# mainブランチにプッシュ
git push -u origin main
```

## 3. Vercelへのデプロイ

### 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### デプロイ手順
1. https://vercel.com にアクセス
2. "Import Project"をクリック
3. GitHubリポジトリ `haudi-development/suntory-game-app` を選択
4. Framework Preset: Next.js を選択
5. 環境変数を設定
6. "Deploy"をクリック

## 4. ビルド設定

Vercelでの推奨設定：
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: 18.x

## 注意事項

- ポート3002で開発サーバーが動作するよう設定済み
- Supabaseのダッシュボードでメール確認を無効化するか、`supabase/fix-email-confirmation.sql`を実行してユーザーのメール確認を完了させてください

## トラブルシューティング

### ビルドエラーが発生した場合
```bash
# ローカルでビルドテスト
npm run build
```

### 型エラーが発生した場合
```bash
# 型チェック
npx tsc --noEmit
```