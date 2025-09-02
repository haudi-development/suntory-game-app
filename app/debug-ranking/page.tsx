'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugRankingPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkDatabase()
  }, [])

  async function checkDatabase() {
    try {
      // 1. auth.usersの確認
      const { data: { user } } = await supabase.auth.getUser()
      
      // 2. profilesテーブルの確認
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
      
      // 3. 自分のプロファイル確認
      const { data: myProfile, error: myProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id || '')
        .single()
      
      // 4. consumptionsテーブルの確認
      const { data: consumptions, error: consumptionsError } = await supabase
        .from('consumptions')
        .select('*')
        .limit(10)
      
      // 5. user_charactersテーブルの確認
      const { data: characters, error: charactersError } = await supabase
        .from('user_characters')
        .select('*')
        .limit(10)
      
      // 6. user_badgesテーブルの確認
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .limit(10)

      setData({
        currentUser: user,
        profiles: {
          all: allProfiles,
          count: allProfiles?.length || 0,
          withPoints: allProfiles?.filter(p => p.total_points > 0).length || 0,
          error: profilesError
        },
        myProfile: {
          data: myProfile,
          error: myProfileError
        },
        consumptions: {
          data: consumptions,
          count: consumptions?.length || 0,
          error: consumptionsError
        },
        characters: {
          data: characters,
          count: characters?.length || 0,
          error: charactersError
        },
        badges: {
          data: badges,
          count: badges?.length || 0,
          error: badgesError
        }
      })
    } catch (error) {
      console.error('Debug error:', error)
      setData({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  async function createTestProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('ログインしてください')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name: 'テストユーザー',
        total_points: 1000,
        selected_character: 'premol'
      })
      .select()
      .single()

    if (error) {
      alert(`エラー: ${error.message}`)
    } else {
      alert('プロファイル作成成功')
      checkDatabase()
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">ランキングデバッグ</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">現在のユーザー</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(data.currentUser, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">自分のプロファイル</h2>
          {data.myProfile?.error ? (
            <div className="text-red-600">エラー: {data.myProfile.error.message}</div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(data.myProfile?.data, null, 2)}
            </pre>
          )}
          <button
            onClick={createTestProfile}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            テストプロファイル作成
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">
            Profiles ({data.profiles?.count || 0}件 / ポイント有り: {data.profiles?.withPoints || 0}件)
          </h2>
          {data.profiles?.error ? (
            <div className="text-red-600">エラー: {data.profiles.error.message}</div>
          ) : (
            <div className="space-y-2">
              {data.profiles?.all?.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="bg-gray-100 p-2 rounded">
                  <div>ID: {p.user_id}</div>
                  <div>名前: {p.display_name || '未設定'}</div>
                  <div>ポイント: {p.total_points}</div>
                  <div>キャラクター: {p.selected_character || '未選択'}</div>
                </div>
              ))}
              {data.profiles?.count === 0 && (
                <div className="text-gray-500">データがありません</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">
            Consumptions ({data.consumptions?.count || 0}件)
          </h2>
          {data.consumptions?.error ? (
            <div className="text-red-600">エラー: {data.consumptions.error.message}</div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data.consumptions?.data, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">
            Characters ({data.characters?.count || 0}件)
          </h2>
          {data.characters?.error ? (
            <div className="text-red-600">エラー: {data.characters.error.message}</div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data.characters?.data, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">
            Badges ({data.badges?.count || 0}件)
          </h2>
          {data.badges?.error ? (
            <div className="text-red-600">エラー: {data.badges.error.message}</div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data.badges?.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}