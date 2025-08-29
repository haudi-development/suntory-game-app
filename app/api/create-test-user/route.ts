import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // テストユーザーでサインアップ
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test@test.com',
      password: 'test1234',
      options: {
        data: {
          nickname: 'テストユーザー',
        }
      }
    })

    if (authError) {
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        hint: '新規登録画面から手動で登録してください' 
      }, { status: 400 })
    }

    if (authData.user) {
      // プロフィール作成
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          nickname: 'テストユーザー',
          selected_character: 'premol',
          total_points: 100,
        } as any)

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }

      // キャラクター初期化
      const characters = ['premol', 'kakuhai', 'sui', 'lemon', 'allfree', 'water']
      for (const character of characters) {
        await supabase
          .from('user_characters')
          .insert({
            user_id: authData.user.id,
            character_type: character,
            level: 1,
            exp: 0,
            evolution_stage: 1,
          } as any)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'テストユーザーを作成しました',
        credentials: {
          email: 'test@test.com',
          password: 'test1234'
        }
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'ユーザー作成に失敗しました' 
    }, { status: 500 })
    
  } catch (error: any) {
    console.error('Error creating test user:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}