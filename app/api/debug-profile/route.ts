import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 現在のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // プロフィールデータを取得
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // デバッグ情報を返す
    return NextResponse.json({
      user_id: user.id,
      profile: profile,
      selected_character: profile?.selected_character,
      has_character: !!profile?.selected_character,
      character_type: typeof profile?.selected_character
    })
  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}