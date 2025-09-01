'use client'

import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <ShieldX className="w-20 h-20 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          アクセス権限がありません
        </h1>
        
        <p className="text-gray-600 mb-8">
          このページにアクセスするには管理者またはモデレーター権限が必要です。
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
          >
            ホームに戻る
          </Link>
          
          <Link
            href="/profile"
            className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            マイページへ
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          権限に関するお問い合わせは管理者までご連絡ください。
        </p>
      </div>
    </div>
  )
}