import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用してSupabaseクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    // デモユーザーの作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'demo@example.com',
      password: 'demo1234',
      email_confirm: true
    })

    if (authError && !authError.message.includes('already been registered')) {
      throw authError
    }

    const userId = authData?.user?.id || 'demo-user-id'

    // プロフィールの作成
    await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        nickname: 'デモユーザー',
        selected_character: 'premol',
        total_points: 0
      })

    // キャラクターの初期化
    const characters = ['premol', 'kakuhai', 'sui', 'lemon', 'allfree', 'water']
    for (const character of characters) {
      await supabaseAdmin
        .from('user_characters')
        .upsert({
          user_id: userId,
          character_type: character,
          level: 1,
          exp: 0,
          evolution_stage: 1
        })
    }

    return NextResponse.json({ success: true, message: 'Demo user created successfully' })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}