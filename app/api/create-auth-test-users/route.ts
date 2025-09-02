import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Service role keyを使用して管理者権限でSupabaseクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const testUsers = [
      { email: 'suzuki@test.com', password: 'test1234', name: '鈴木花子', points: 12000 },
      { email: 'sato@test.com', password: 'test1234', name: '佐藤健太', points: 10000 },
      { email: 'tanaka@test.com', password: 'test1234', name: '田中美咲', points: 8500 },
      { email: 'watanabe@test.com', password: 'test1234', name: '渡辺翔', points: 7200 },
      { email: 'kobayashi@test.com', password: 'test1234', name: '小林優子', points: 6800 },
      { email: 'yamamoto@test.com', password: 'test1234', name: '山本大輝', points: 6000 },
      { email: 'nakamura@test.com', password: 'test1234', name: '中村愛', points: 5500 },
      { email: 'inoue@test.com', password: 'test1234', name: '井上蓮', points: 5000 },
      { email: 'kimura@test.com', password: 'test1234', name: '木村さくら', points: 4500 },
    ]

    const results = []
    
    for (const testUser of testUsers) {
      try {
        // 1. Auth.usersにユーザーを作成
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true
        })

        if (authError) {
          results.push({ email: testUser.email, error: authError.message })
          continue
        }

        if (authData?.user) {
          // 2. profilesテーブルにデータを作成
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              user_id: authData.user.id,
              display_name: testUser.name,
              total_points: testUser.points,
              selected_character: ['premol', 'kakuhai', 'sui', 'lemon', 'allfree'][Math.floor(Math.random() * 5)]
            })

          if (profileError) {
            results.push({ email: testUser.email, error: `Profile error: ${profileError.message}` })
          } else {
            results.push({ email: testUser.email, success: true, userId: authData.user.id })
          }
        }
      } catch (err) {
        results.push({ email: testUser.email, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'テストユーザー作成処理が完了しました',
      results,
      summary: {
        total: testUsers.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => r.error).length
      }
    })
  } catch (error) {
    console.error('Create auth test users error:', error)
    return NextResponse.json({ 
      error: 'Failed to create test users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}