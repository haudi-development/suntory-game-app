'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bug, Database, Check, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminDebugPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('asada@haudi.jp')
  const [userData, setUserData] = useState<any>(null)
  const supabase = createClient()

  // asada@haudi.jpのユーザー情報を検索
  async function findUser() {
    setLoading(true)
    try {
      // profilesテーブルから全ユーザーを取得
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('All profiles:', profiles)
      
      if (profileError) {
        toast.error(`プロフィール取得エラー: ${profileError.message}`)
        return
      }

      // メールアドレスに基づいて検索（通常はauth.usersテーブルからの情報が必要）
      setUserData({
        profiles: profiles || [],
        searchEmail: email,
        totalUsers: profiles?.length || 0
      })

      toast.success(`${profiles?.length || 0}件のプロフィールを取得しました`)
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error(`検索エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // データベース接続テスト
  async function testDatabaseConnection() {
    setLoading(true)
    const results: any = {}

    try {
      // 1. Supabase接続テスト
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      results.supabaseConnection = !testError
      results.supabaseError = testError?.message

      // 2. テーブル存在確認
      const tables = ['profiles', 'user_characters', 'consumptions', 'badges', 'user_badges', 'suntory_products']
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        results[`table_${table}`] = !error
        if (error) {
          results[`table_${table}_error`] = error.message
        }
      }

      // 3. Auth状態確認
      const { data: { user } } = await supabase.auth.getUser()
      results.authUser = user ? user.email : 'Not logged in'

      setTestResults(results)
      toast.success('接続テスト完了')
    } catch (error: any) {
      console.error('Test error:', error)
      toast.error(`テストエラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // テーブル初期化
  async function initializeTables() {
    setLoading(true)
    try {
      // suntory_productsテーブルの作成
      const { error } = await supabase
        .from('suntory_products')
        .select('count')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        toast.info('suntory_productsテーブルを作成します...')
        
        // 初期データを投入
        const initialProducts = [
          { brand_name: 'ザ・プレミアム・モルツ', product_category: 'draft_beer', product_line: 'プレミアムモルツ' },
          { brand_name: '金麦', product_category: 'draft_beer', product_line: '金麦' },
          { brand_name: '角ハイボール', product_category: 'highball', product_line: '角' },
          { brand_name: 'こだわり酒場のレモンサワー', product_category: 'sour', product_line: 'こだわり酒場' },
          { brand_name: '翠', product_category: 'gin_soda', product_line: '翠' },
          { brand_name: 'オールフリー', product_category: 'non_alcohol', product_line: 'オールフリー' },
          { brand_name: 'サントリー天然水', product_category: 'water', product_line: '天然水' },
          { brand_name: '伊右衛門', product_category: 'water', product_line: '伊右衛門' },
          { brand_name: 'BOSS', product_category: 'softdrink', product_line: 'BOSS' },
        ]

        const { error: insertError } = await supabase
          .from('suntory_products')
          .upsert(initialProducts, { onConflict: 'brand_name' })

        if (insertError) {
          toast.error(`データ投入エラー: ${insertError.message}`)
        } else {
          toast.success('suntory_productsテーブルを初期化しました')
        }
      } else {
        toast.info('suntory_productsテーブルは既に存在します')
      }

      await testDatabaseConnection()
    } catch (error: any) {
      console.error('Initialization error:', error)
      toast.error(`初期化エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Bug className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              デバッグツール
            </h1>
            <p className="text-gray-600">KANPAI! システムの診断とトラブルシューティング</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ユーザー検索 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">ユーザー検索</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  検索するメールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="asada@haudi.jp"
                />
              </div>
              <button
                onClick={findUser}
                disabled={loading}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? '検索中...' : 'ユーザーを検索'}
              </button>
              
              {userData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">検索結果:</p>
                  <p className="text-xs text-gray-600">総ユーザー数: {userData.totalUsers}</p>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {userData.profiles.map((profile: any) => (
                      <div key={profile.user_id} className="text-xs py-1 border-b">
                        <span className="font-medium">{profile.nickname}</span>
                        <span className="text-gray-500 ml-2">({profile.user_id.substring(0, 8)}...)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* データベース接続テスト */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="text-blue-500" />
              データベース接続テスト
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button
                onClick={testDatabaseConnection}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'テスト中...' : '接続テスト実行'}
              </button>
              
              <button
                onClick={initializeTables}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '初期化中...' : 'テーブル初期化'}
              </button>

              {Object.keys(testResults).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">テスト結果:</p>
                  {Object.entries(testResults).map(([key, value]) => {
                    if (key.includes('error')) return null
                    const isSuccess = value === true || (typeof value === 'string' && !key.includes('Error'))
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span>{key.replace(/_/g, ' ')}</span>
                        <span className={`flex items-center gap-1 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                          {isSuccess ? <Check size={16} /> : <X size={16} />}
                          {typeof value === 'string' ? value : isSuccess ? 'OK' : 'Failed'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SQL実行手順 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Supabase SQL Editorでの確認方法:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Supabaseダッシュボードにログイン</li>
          <li>左メニューから「SQL Editor」を選択</li>
          <li>supabase/check-user.sqlの内容をコピー&ペースト</li>
          <li>「Run」ボタンをクリックして実行</li>
          <li>asada@haudi.jpのユーザー情報が表示されます</li>
        </ol>
      </div>
    </div>
  )
}