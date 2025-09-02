'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Trophy, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bug,
  Star,
  MapPin
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  async function checkAdminAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // 簡易的な管理者判定（開発中は全員管理者）
      setIsAdmin(true)
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    {
      href: '/admin',
      label: 'ダッシュボード',
      icon: LayoutDashboard,
      active: pathname === '/admin'
    },
    {
      href: '/admin/users',
      label: 'ユーザー管理',
      icon: Users,
      active: pathname === '/admin/users'
    },
    {
      href: '/admin/venues',
      label: '店舗管理',
      icon: MapPin,
      active: pathname === '/admin/venues'
    },
    {
      href: '/admin/products',
      label: '製品管理',
      icon: Package,
      active: pathname === '/admin/products'
    },
    {
      href: '/admin/rankings',
      label: 'ランキング',
      icon: Trophy,
      active: pathname === '/admin/rankings'
    },
    {
      href: '/admin/analytics',
      label: '分析',
      icon: TrendingUp,
      active: pathname === '/admin/analytics'
    },
    {
      href: '/admin/debug',
      label: 'デバッグ',
      icon: Bug,
      active: pathname === '/admin/debug'
    },
    {
      href: '/admin/settings',
      label: '設定',
      icon: Settings,
      active: pathname === '/admin/settings'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">管理者権限が必要です</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* モバイルメニューボタン */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:bg-white/95 transition-all duration-200"
        >
          {mobileMenuOpen ? <X size={24} className="text-slate-600" /> : <Menu size={24} className="text-slate-600" />}
        </button>
      </div>

      {/* サイドバー */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-indigo-900 via-blue-800 to-purple-900 shadow-2xl transition-all duration-300
        ${sidebarOpen ? 'w-72' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <Link href="/admin" className={`transition-opacity ${!sidebarOpen && 'opacity-0 w-0'}`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Star className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">KANPAI!</h1>
                  <p className="text-blue-200 text-sm">by Suntory</p>
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className={`transition-transform text-white/80 ${!sidebarOpen && 'rotate-180'}`} size={20} />
            </button>
          </div>

          {/* メニュー */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                        ${item.active 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                          : 'hover:bg-white/10 text-white/80 hover:text-white hover:scale-105'
                        }
                      `}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon size={22} className={item.active ? 'text-white' : 'text-white/80 group-hover:text-white'} />
                      {sidebarOpen && (
                        <span className={`font-medium ${item.active ? 'text-white' : 'text-white/90'}`}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* ユーザーセクション */}
          <div className="border-t border-white/10 p-6 space-y-2">
            <Link 
              href="/" 
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200 group"
              title={!sidebarOpen ? 'ユーザー画面へ' : undefined}
            >
              <ChevronLeft size={20} className="text-white/80 group-hover:text-white" />
              {sidebarOpen && <span className="font-medium">ユーザー画面へ</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/20 text-white/80 hover:text-white transition-all duration-200 group"
              title={!sidebarOpen ? 'ログアウト' : undefined}
            >
              <LogOut size={20} className="text-white/80 group-hover:text-red-300" />
              {sidebarOpen && <span className="font-medium">ログアウト</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className={`
        transition-all duration-300
        ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}
        ${mobileMenuOpen && 'lg:ml-0'}
      `}>
        {/* モバイルオーバーレイ */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ヘッダーバー */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {menuItems.find(item => item.active)?.label || 'KANPAI! Admin'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                管理画面
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Star className="text-white" size={16} />
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}