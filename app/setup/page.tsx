'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const supabase = createClient()

  const setupDatabase = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      // 1. 認証チェック
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です')
        return
      }
      logs.push('✅ 認証確認完了')

      // 2. データベース接続テスト
      const { error: connError } = await supabase.from('profiles').select('id').limit(1)
      if (connError) {
        logs.push(`❌ データベース接続エラー: ${connError.message}`)
      } else {
        logs.push('✅ データベース接続成功')
      }

      // 3. 店舗データをセットアップ
      logs.push('📦 店舗データをセットアップ中...')
      const setupVenuesRes = await fetch('/api/setup-venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (setupVenuesRes.ok) {
        const venuesResult = await setupVenuesRes.json()
        logs.push(`✅ ${venuesResult.message || '店舗データセットアップ完了'}`)
      } else {
        const error = await setupVenuesRes.text()
        logs.push(`⚠️ 店舗データセットアップ: ${error}`)
      }

      // 4. テストユーザー作成
      logs.push('👤 テストユーザーを確認中...')
      const testUserRes = await fetch('/api/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (testUserRes.ok) {
        const testUserResult = await testUserRes.json()
        logs.push(`✅ ${testUserResult.message || 'テストユーザー準備完了'}`)
      } else {
        logs.push('⚠️ テストユーザー作成スキップ')
      }

      // 5. デモデータ作成
      logs.push('🎮 デモデータをセットアップ中...')
      const demoRes = await fetch('/api/setup-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (demoRes.ok) {
        const demoResult = await demoRes.json()
        logs.push(`✅ ${demoResult.message || 'デモデータセットアップ完了'}`)
      } else {
        logs.push('⚠️ デモデータセットアップスキップ')
      }

      logs.push('🎉 セットアップ完了！')
      toast.success('セットアップが完了しました')
    } catch (error) {
      console.error('Setup error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('セットアップ中にエラーが発生しました')
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  const checkDatabase = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      logs.push('🔍 データベース状態を確認中...')
      
      // profilesテーブル（RLSポリシーのテスト）
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (profilesError) {
        if (profilesError.message.includes('infinite recursion')) {
          logs.push(`❌ RLSポリシーエラー: 無限再帰が検出されました`)
          logs.push(`⚠️ 修正が必要です - 下の「RLSポリシー修正」ボタンをクリック`)
        } else {
          logs.push(`❌ profiles テーブル: ${profilesError.message}`)
        }
      } else {
        logs.push('✅ profiles テーブル: 正常')
      }
      
      // venues テーブル
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id')
        .limit(1)
      
      if (venuesError) {
        logs.push(`❌ venues テーブル: ${venuesError.message}`)
      } else {
        const { count } = await supabase
          .from('venues')
          .select('*', { count: 'exact', head: true })
        logs.push(`✅ venues テーブル: ${count || 0}件のデータ`)
      }

      // check_ins テーブル
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id')
        .limit(1)
      
      if (checkInsError) {
        logs.push(`❌ check_ins テーブル: ${checkInsError.message}`)
      } else {
        logs.push('✅ check_ins テーブル: 正常')
      }

      // venue_menus テーブル
      const { data: menus, error: menusError } = await supabase
        .from('venue_menus')
        .select('id')
        .limit(1)
      
      if (menusError) {
        logs.push(`❌ venue_menus テーブル: ${menusError.message}`)
      } else {
        const { count } = await supabase
          .from('venue_menus')
          .select('*', { count: 'exact', head: true })
        logs.push(`✅ venue_menus テーブル: ${count || 0}件のデータ`)
      }

      // RPC関数テスト
      try {
        await supabase.rpc('check_in_to_venue', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_venue_id: '00000000-0000-0000-0000-000000000000',
          p_method: 'test'
        })
        logs.push('✅ RPC関数 check_in_to_venue: 存在')
      } catch (e: any) {
        if (e.message?.includes('violates foreign key constraint')) {
          logs.push('✅ RPC関数 check_in_to_venue: 正常動作')
        } else {
          logs.push(`❌ RPC関数 check_in_to_venue: ${e.message}`)
        }
      }

    } catch (error) {
      console.error('Check error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  const fixPolicies = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      const response = await fetch('/api/fix-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (result.sql) {
        logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        result.steps.forEach((step: string) => logs.push(step))
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logs.push('')
        // SQLを改行ごとに分割して表示
        const sqlLines = result.sql.split('\n')
        sqlLines.forEach((line: string) => logs.push(line))
      }
    } catch (error) {
      console.error('Fix policies error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  const fixVenues = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      logs.push('🔄 Venues修正SQLを生成中...')
      
      const response = await fetch('/api/fix-venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      console.log('Fix venues response:', result)
      
      if (result.sql) {
        logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        if (result.steps && Array.isArray(result.steps)) {
          result.steps.forEach((step: string) => logs.push(step))
        }
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logs.push('SQL:')
        logs.push('```sql')
        // SQLを改行ごとに分割して表示
        const sqlLines = result.sql.split('\n')
        sqlLines.forEach((line: string) => logs.push(line))
        logs.push('```')
      } else {
        logs.push('⚠️ SQLの生成に失敗しました')
        logs.push(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      console.error('Fix venues error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  const fixRankingVisibility = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      logs.push('🔄 ランキング表示修正SQLを生成中...')
      
      const response = await fetch('/api/fix-ranking-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      console.log('Fix ranking visibility response:', result)
      
      if (result.sql) {
        logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        if (result.steps && Array.isArray(result.steps)) {
          result.steps.forEach((step: string) => logs.push(step))
        }
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        if (result.notes && Array.isArray(result.notes)) {
          logs.push('📝 実行内容:')
          result.notes.forEach((note: string) => logs.push(`  • ${note}`))
        }
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logs.push('SQL:')
        logs.push('```sql')
        const sqlLines = result.sql.split('\n')
        sqlLines.forEach((line: string) => logs.push(line))
        logs.push('```')
      } else {
        logs.push('⚠️ SQLの生成に失敗しました')
        logs.push(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      console.error('Fix ranking visibility error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  const createTestUsers = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      logs.push('🔄 テストユーザー作成SQLを生成中...')
      
      const response = await fetch('/api/setup-test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      console.log('Create test users response:', result)
      
      if (result.sql) {
        logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        if (result.steps && Array.isArray(result.steps)) {
          result.steps.forEach((step: string) => logs.push(step))
        }
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        if (result.notes && Array.isArray(result.notes)) {
          logs.push('📝 実行内容:')
          result.notes.forEach((note: string) => logs.push(`  • ${note}`))
        }
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logs.push('SQL:')
        logs.push('```sql')
        const sqlLines = result.sql.split('\n')
        sqlLines.forEach((line: string) => logs.push(line))
        logs.push('```')
      } else {
        logs.push('⚠️ SQLの生成に失敗しました')
        logs.push(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      console.error('Create test users error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  const createTables = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []

    try {
      logs.push('🔄 テーブル作成SQLを生成中...')
      
      const response = await fetch('/api/create-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      console.log('Create tables response:', result)
      
      if (result.sql) {
        logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        if (result.steps && Array.isArray(result.steps)) {
          result.steps.forEach((step: string) => logs.push(step))
        }
        logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        logs.push('SQL:')
        logs.push('```sql')
        // SQLを改行ごとに分割して表示
        const sqlLines = result.sql.split('\n')
        sqlLines.forEach((line: string) => logs.push(line))
        logs.push('```')
      } else {
        logs.push('⚠️ SQLの生成に失敗しました')
        logs.push(JSON.stringify(result, null, 2))
      }
    } catch (error) {
      console.error('Create tables error:', error)
      logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResults(logs)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">データベースセットアップ</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">セットアップツール</h2>
          <p className="text-gray-600 mb-4">
            データベースの初期設定と動作確認を行います。
          </p>
          
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? '実行中...' : '初期セットアップ実行'}
            </button>
            
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? '確認中...' : 'データベース状態確認'}
            </button>
            
            <button
              onClick={fixPolicies}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '生成中...' : 'RLSポリシー修正SQL生成'}
            </button>
            
            <button
              onClick={createTables}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '生成中...' : 'テーブル作成SQL生成'}
            </button>
            
            <button
              onClick={fixVenues}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '生成中...' : 'Venues修正SQL生成'}
            </button>
            
            <button
              onClick={createTestUsers}
              disabled={loading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? '生成中...' : 'テストユーザー作成SQL生成'}
            </button>
            
            <button
              onClick={fixRankingVisibility}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '生成中...' : 'ランキング表示修正SQL生成'}
            </button>
            
            <button
              onClick={async () => {
                setLoading(true)
                setResults([])
                const logs: string[] = []
                try {
                  logs.push('🔄 チェックアウト修正SQLを生成中...')
                  const response = await fetch('/api/fix-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  })
                  const result = await response.json()
                  if (result.sql) {
                    logs.push('📋 以下のSQLをSupabaseダッシュボードで実行してください:')
                    logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                    result.steps.forEach((step: string) => logs.push(step))
                    logs.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
                    logs.push('SQL:')
                    logs.push('```sql')
                    result.sql.split('\n').forEach((line: string) => logs.push(line))
                    logs.push('```')
                  }
                } catch (error) {
                  logs.push(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
                } finally {
                  setResults(logs)
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? '生成中...' : 'チェックアウト修正SQL生成'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">実行結果</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-primary hover:underline">
            ホームに戻る
          </a>
        </div>
      </div>
    </div>
  )
}