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
  ChevronLeft
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
      href: '/admin/products',
      label: '製品管理',
      icon: Package,
      active: pathname === '/admin/products'
    },
    {
      href: '/admin/rankings',
      label: 'ランキング管理',
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
    <div className="min-h-screen bg-gray-100">
      {/* モバイルメニューボタン */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-lg"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* サイドバー */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full bg-white shadow-lg transition-transform duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/admin" className={`font-bold text-xl text-primary-dark ${!sidebarOpen && 'hidden'}`}>
              管理画面
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className={`transition-transform ${!sidebarOpen && 'rotate-180'}`} size={20} />
            </button>
          </div>

          {/* メニュー */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                        ${item.active 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-gray-100 text-gray-700'
                        }
                      `}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* ユーザーセクション */}
          <div className="border-t p-4">
            <Link 
              href="/" 
              className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title={!sidebarOpen ? 'ユーザー画面へ' : undefined}
            >
              <ChevronLeft size={20} />
              {sidebarOpen && <span>ユーザー画面へ</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title={!sidebarOpen ? 'ログアウト' : undefined}
            >
              <LogOut size={20} />
              {sidebarOpen && <span>ログアウト</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className={`
        transition-all duration-300
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        ${mobileMenuOpen && 'lg:ml-0'}
      `}>
        {/* モバイルオーバーレイ */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {children}
      </main>
    </div>
  )
}