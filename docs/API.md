# API Documentation

## 概要
サントリー飲食体験ゲーミフィケーションアプリのAPI仕様書です。

## ベースURL
- 開発環境: `http://localhost:3000/api`
- 本番環境: `https://suntory-game-app.vercel.app/api`

## 認証
一部のAPIエンドポイントはSupabase認証が必要です。
```
Authorization: Bearer <your-supabase-token>
```

## エンドポイント一覧

### 1. 画像解析 API

#### POST `/api/analyze-image`
飲料画像をAIで解析し、商品情報とポイントを返します。

**リクエスト:**
```json
{
  "imageBase64": "base64エンコードされた画像データ"
}
```

**レスポンス (成功):**
```json
{
  "success": true,
  "analysis": {
    "brand_name": "ザ・プレミアム・モルツ",
    "product_type": "draft_beer",
    "container": "jug",
    "volume_ml": 500,
    "quantity": 1,
    "confidence": 0.95,
    "is_suntory": true
  },
  "points": 30
}
```

**エラーレスポンス:**
```json
{
  "error": "Failed to analyze image",
  "code": "ANALYSIS_ERROR"
}
```

### 2. テストユーザー作成 API

#### POST `/api/create-test-user`
開発・テスト用のユーザーアカウントを作成します。

**リクエスト:**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "nickname": "テストユーザー"
}
```

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  }
}
```

### 3. デモデータセットアップ API

#### POST `/api/setup-demo`
デモ用のダミーデータを生成します（認証必要）。

**レスポンス:**
```json
{
  "success": true,
  "message": "Demo data setup completed",
  "stats": {
    "users": 50,
    "consumptions": 500,
    "badges": 150
  }
}
```

## エラーコード

| コード | 説明 |
|--------|------|
| `NETWORK_ERROR` | ネットワークエラー |
| `AUTH_ERROR` | 認証エラー |
| `ANALYSIS_ERROR` | 画像解析エラー |
| `STORAGE_ERROR` | ストレージエラー |
| `DATABASE_ERROR` | データベースエラー |
| `VALIDATION_ERROR` | バリデーションエラー |

## レート制限

- 画像解析: 60リクエスト/分
- その他API: 120リクエスト/分

## 画像仕様

### 対応フォーマット
- JPEG
- PNG
- WebP

### サイズ制限
- 最大: 5MB
- 推奨: 1920x1080px以下

## 商品タイプ (product_type)

| 値 | 説明 |
|----|------|
| `draft_beer` | 生ビール |
| `highball` | ハイボール |
| `sour` | サワー |
| `gin_soda` | ジンソーダ |
| `non_alcohol` | ノンアルコール |
| `water` | 水・茶 |
| `other` | その他 |

## 容器タイプ (container)

| 値 | 説明 |
|----|------|
| `jug` | ジョッキ |
| `glass` | グラス |
| `can` | 缶 |
| `bottle` | 瓶 |

## SDK/クライアントライブラリ

### JavaScript/TypeScript
```typescript
// 画像解析の例
async function analyzeImage(imageBase64: string) {
  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });
  
  if (!response.ok) {
    throw new Error('Analysis failed');
  }
  
  return response.json();
}
```

### cURL
```bash
# 画像解析
curl -X POST https://suntory-game-app.vercel.app/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"..."}'

# テストユーザー作成
curl -X POST https://suntory-game-app.vercel.app/api/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Postmanコレクション
[Postmanコレクションをダウンロード](./postman-collection.json)

## 変更履歴

### v1.0.0 (2024-12-31)
- 初回リリース
- 画像解析API
- テストユーザー作成API
- デモデータセットアップAPI

## サポート
問題や質問がある場合は、GitHubのIssuesまでご連絡ください。