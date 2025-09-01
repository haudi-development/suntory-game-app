import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // セッションを更新（重要）
  await supabase.auth.getSession()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // 管理画面へのアクセス制御
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // ロールチェック（user_rolesテーブルが存在する場合）
    try {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
      
      if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'moderator')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    } catch (error) {
      // user_rolesテーブルがまだない場合はスキップ
      console.log('Role check skipped:', error)
    }
  }
  
  // 認証が必要な機能ページ（閲覧は可能、アクションは要認証）
  const authRequiredPaths = ['/capture', '/profile']
  const isAuthRequiredPath = authRequiredPaths.some(path => 
    req.nextUrl.pathname === path
  )
  
  // これらのページでは認証していない場合ログインへリダイレクト
  if (isAuthRequiredPath && !session) {
    // リダイレクト後に元のページに戻れるようにする
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}