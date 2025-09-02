import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 現在のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // プロフィールを確認
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('selected_character')
      .eq('user_id', user.id)
      .single()
    
    // selected_characterがnullまたは空の場合、デフォルトを設定
    if (!existingProfile?.selected_character) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selected_character: 'premol' })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('Error updating default character:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        message: 'Default character set to premol',
        selected_character: 'premol'
      })
    }
    
    return NextResponse.json({ 
      message: 'Character already set',
      selected_character: existingProfile.selected_character
    })
  } catch (error) {
    console.error('Set default character error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}