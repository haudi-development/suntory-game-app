import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用してSupabaseクライアントを作成
const supabase = createClient(
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
    
    // 山田太郎のuser_idを取得（display_nameで検索）
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('display_name', '山田太郎')
      .single()
    
    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: '山田太郎が見つかりません', details: profileError }, { status: 404 })
    }
    
    if (!profiles) {
      return NextResponse.json({ error: '山田太郎が見つかりません' }, { status: 404 })
    }
    
    const userId = profiles.user_id
    
    // 解禁するキャラクター
    const charactersToUnlock = [
      { character_type: 'premol', name: 'プレモルくん' },
      { character_type: 'kakuhai', name: '角ハイ坊や' },
      { character_type: 'lemon', name: 'レモンサワー兄弟' }
    ]
    
    const unlockedCharacters = []
    
    for (const char of charactersToUnlock) {
      // 既に解禁済みか確認
      const { data: existing } = await supabase
        .from('user_characters')
        .select('id')
        .eq('user_id', userId)
        .eq('character_type', char.character_type)
        .single()
      
      if (!existing) {
        // 未解禁なら解禁する
        const { error } = await supabase
          .from('user_characters')
          .insert({
            user_id: userId,
            character_type: char.character_type,
            level: 1,
            exp: 0,
            evolution_stage: 1
          })
        
        if (!error) {
          unlockedCharacters.push(char.name)
        }
      }
    }
    
    return NextResponse.json({ 
      message: '山田太郎のキャラクターを解禁しました',
      unlocked: unlockedCharacters,
      already_unlocked: charactersToUnlock
        .filter(c => !unlockedCharacters.find(u => u === c.name))
        .map(c => c.name)
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'キャラクター解禁に失敗しました' }, { status: 500 })
  }
}