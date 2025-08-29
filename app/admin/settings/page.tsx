'use client'

import { useState } from 'react'
import { Settings, Shield, Bell, Database, Key, Save } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'サントリー飲活アプリ',
    pointsPerDrink: 10,
    levelUpPoints: 100,
    maxDailyRecords: 50,
    enableNotifications: true,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false
  })

  const handleSave = () => {
    // 実際にはここでSupabaseに設定を保存
    toast.success('設定を保存しました')
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">システム設定</h1>
        <p className="text-gray-600 mt-2">アプリケーションの設定と管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本設定 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="text-primary" size={20} />
              基本設定
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                サイト名
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1杯あたりのポイント
              </label>
              <input
                type="number"
                value={settings.pointsPerDrink}
                onChange={(e) => setSettings({ ...settings, pointsPerDrink: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                レベルアップ必要ポイント
              </label>
              <input
                type="number"
                value={settings.levelUpPoints}
                onChange={(e) => setSettings({ ...settings, levelUpPoints: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1日の最大記録数
              </label>
              <input
                type="number"
                value={settings.maxDailyRecords}
                onChange={(e) => setSettings({ ...settings, maxDailyRecords: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* セキュリティ設定 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              セキュリティ設定
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">新規登録を許可</p>
                <p className="text-sm text-gray-600">新規ユーザーの登録を許可します</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowRegistration}
                  onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">メール認証を必須にする</p>
                <p className="text-sm text-gray-600">登録時のメール認証を必須にします</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">メンテナンスモード</p>
                <p className="text-sm text-gray-600">管理者以外のアクセスを制限します</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 通知設定 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="text-primary" size={20} />
              通知設定
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">プッシュ通知を有効化</p>
                <p className="text-sm text-gray-600">ユーザーへのプッシュ通知を有効にします</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* データベース情報 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="text-primary" size={20} />
              データベース情報
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <p className="text-sm text-gray-600">接続状態</p>
              <p className="font-medium text-green-600">接続済み</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">データベースURL</p>
              <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                postgresql://postgres.xxxxxx...
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">最終バックアップ</p>
              <p className="font-medium">2024年12月29日 15:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark flex items-center gap-2"
        >
          <Save size={20} />
          設定を保存
        </button>
      </div>
    </div>
  )
}