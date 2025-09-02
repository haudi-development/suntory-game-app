'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetupTestUsersPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const supabase = createClient()

  const createTestUsers = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    const testUsers = [
      { email: 'suzuki@test.com', password: 'Test1234!', name: '鈴木花子', points: 12000 },
      { email: 'sato@test.com', password: 'Test1234!', name: '佐藤健太', points: 10000 },
      { email: 'tanaka@test.com', password: 'Test1234!', name: '田中美咲', points: 8500 },
      { email: 'watanabe@test.com', password: 'Test1234!', name: '渡辺翔', points: 7200 },
      { email: 'kobayashi@test.com', password: 'Test1234!', name: '小林優子', points: 6800 },
      { email: 'yamamoto@test.com', password: 'Test1234!', name: '山本大輝', points: 6000 },
      { email: 'nakamura@test.com', password: 'Test1234!', name: '中村愛', points: 5500 },
      { email: 'inoue@test.com', password: 'Test1234!', name: '井上蓮', points: 5000 },
      { email: 'kimura@test.com', password: 'Test1234!', name: '木村さくら', points: 4500 },
    ]

    logs.push('🚀 テストユーザー作成開始...')

    for (const testUser of testUsers) {
      try {
        // 1. ユーザーをサインアップ
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
        })

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            logs.push(`⚠️ ${testUser.email}: 既に登録済み`)
            
            // 既存ユーザーのプロファイルを更新
            const { data: { user } } = await supabase.auth.signInWithPassword({
              email: testUser.email,
              password: testUser.password,
            })
            
            if (user) {
              await updateProfile(user.id, testUser.name, testUser.points)
              logs.push(`✅ ${testUser.email}: プロファイル更新`)
            }
          } else {
            logs.push(`❌ ${testUser.email}: ${signUpError.message}`)
          }
          continue
        }

        if (signUpData?.user) {
          // 2. プロファイルを作成
          await updateProfile(signUpData.user.id, testUser.name, testUser.points)
          logs.push(`✅ ${testUser.email}: 作成成功`)
        }
      } catch (err) {
        logs.push(`❌ ${testUser.email}: ${err instanceof Error ? err.message : 'エラー'}`)
      }
    }

    logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logs.push('✨ 完了！ランキングページを確認してください')
    
    setResults(logs)
    setLoading(false)
  }

  const updateProfile = async (userId: string, name: string, points: number) => {
    const characters = ['premol', 'kakuhai', 'sui', 'lemon', 'allfree']
    
    await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        display_name: name,
        total_points: points,
        selected_character: characters[Math.floor(Math.random() * characters.length)]
      })
  }

  const createUsingSQLOnly = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
    logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logs.push('')
    logs.push('-- 既存の最初のユーザーを複製してダミーデータを作成')
    logs.push('-- 注意: これはデモ専用です')
    logs.push('')
    logs.push(`WITH base_user AS (
  SELECT user_id FROM profiles 
  WHERE total_points > 0 
  LIMIT 1
)
INSERT INTO profiles (user_id, display_name, total_points, selected_character)
VALUES
  ((SELECT user_id FROM base_user), '山田太郎', 15000, 'premol'),
  (gen_random_uuid(), '鈴木花子', 12000, 'kakuhai'),
  (gen_random_uuid(), '佐藤健太', 10000, 'sui'),
  (gen_random_uuid(), '田中美咲', 8500, 'lemon'),
  (gen_random_uuid(), '渡辺翔', 7200, 'allfree'),
  (gen_random_uuid(), '小林優子', 6800, 'premol'),
  (gen_random_uuid(), '山本大輝', 6000, 'kakuhai'),
  (gen_random_uuid(), '中村愛', 5500, 'sui'),
  (gen_random_uuid(), '井上蓮', 5000, 'lemon'),
  (gen_random_uuid(), '木村さくら', 4500, 'allfree')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  total_points = EXCLUDED.total_points;`)
    
    logs.push('')
    logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    logs.push('⚠️ 注意: これは一時的なデモ用SQLです')
    logs.push('本番環境では使用しないでください')
    
    setResults(logs)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">テストユーザー作成</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">作成方法を選択</h2>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={createTestUsers}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '作成中...' : '方法1: Supabase Authでユーザーを作成'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                実際のユーザーアカウントを作成します（推奨）
              </p>
            </div>
            
            <div>
              <button
                onClick={createUsingSQLOnly}
                disabled={loading}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? '生成中...' : '方法2: ダミーデータSQL生成（デモ用）'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                auth.usersを使わない仮のデータを作成（デモ専用）
              </p>
            </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">実行結果</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
              {results.map((result, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/setup" className="text-blue-600 hover:underline mr-4">
            セットアップページに戻る
          </a>
          <a href="/leaderboard" className="text-blue-600 hover:underline">
            ランキングを確認
          </a>
        </div>
      </div>
    </div>
  )
}