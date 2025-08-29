'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Camera, Trophy, User, MapPin } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: '🏠', label: 'ホーム' },
    { href: '/capture', icon: <Camera size={24} />, label: '撮影' },
    { href: '/leaderboard', icon: <Trophy size={24} />, label: 'ランキング' },
    { href: '/profile', icon: <User size={24} />, label: 'マイページ' },
  ]

  return (
    <nav className="mobile-nav safe-area-inset">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 ${
                isActive ? 'text-primary-dark' : 'text-gray-600'
              }`}
            >
              {typeof item.icon === 'string' ? (
                <div className="text-2xl mb-1">{item.icon}</div>
              ) : (
                <div className="mb-1">{item.icon}</div>
              )}
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}