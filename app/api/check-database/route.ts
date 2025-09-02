import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // profilesテーブルのデータを確認
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
    
    // auth.usersテーブルのユーザー数を確認
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    // consumptionsテーブルのデータを確認
    const { data: consumptions, error: consumptionsError } = await supabase
      .from('consumptions')
      .select('user_id')
      .limit(10)
    
    // user_charactersテーブルのデータを確認
    const { data: characters, error: charactersError } = await supabase
      .from('user_characters')
      .select('user_id')
      .limit(10)
    
    // user_badgesテーブルのデータを確認
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select('user_id')
      .limit(10)
    
    return NextResponse.json({
      success: true,
      data: {
        users: {
          count: users?.length || 0,
          error: usersError?.message
        },
        profiles: {
          count: profiles?.length || 0,
          withPoints: profiles?.filter(p => p.total_points > 0).length || 0,
          topUsers: profiles?.slice(0, 5).map(p => ({
            user_id: p.user_id,
            display_name: p.display_name,
            total_points: p.total_points
          })),
          error: profilesError?.message
        },
        consumptions: {
          count: consumptions?.length || 0,
          error: consumptionsError?.message
        },
        characters: {
          count: characters?.length || 0,
          error: charactersError?.message
        },
        badges: {
          count: badges?.length || 0,
          error: badgesError?.message
        }
      }
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}