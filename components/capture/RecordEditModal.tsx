'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Beer, Wine, Coffee } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RecordEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (record: EditedRecord) => void
  initialData: {
    brand_name: string
    product_type: string
    volume_ml: number
    quantity: number
    container?: string
    is_suntory?: boolean
  }
  venueMenus?: any[]
  isRestaurantMode?: boolean
}

export interface EditedRecord {
  brand_name: string
  product_type: string
  volume_ml: number
  quantity: number
  container: string
  is_suntory: boolean
}

const CONTAINER_OPTIONS = {
  restaurant: [
    { value: 'jug', label: 'ジョッキ', icon: '🍺', volumes: [350, 435, 500, 633] },
    { value: 'glass', label: 'グラス', icon: '🥃', volumes: [200, 250, 350] },
    { value: 'pitcher', label: 'ピッチャー', icon: '🏺', volumes: [1000, 1500, 2000] },
    { value: 'mug', label: 'マグ', icon: '🍻', volumes: [500, 700] },
  ],
  retail: [
    { value: 'can', label: '缶', icon: '🥫', volumes: [350, 500] },
    { value: 'bottle', label: '瓶', icon: '🍾', volumes: [334, 500, 633] },
    { value: 'pet', label: 'ペットボトル', icon: '🧴', volumes: [500, 1500, 2000] },
  ]
}

const PRODUCT_TYPES = [
  { value: 'draft_beer', label: '生ビール', icon: '🍺' },
  { value: 'highball', label: 'ハイボール', icon: '🥃' },
  { value: 'sour', label: 'サワー', icon: '🍋' },
  { value: 'gin_soda', label: 'ジンソーダ', icon: '🍸' },
  { value: 'non_alcohol', label: 'ノンアル', icon: '🚫' },
  { value: 'water', label: '水・茶', icon: '💧' },
]

export default function RecordEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  venueMenus = [],
  isRestaurantMode = false
}: RecordEditModalProps) {
  const [record, setRecord] = useState<EditedRecord>({
    brand_name: initialData.brand_name || '',
    product_type: initialData.product_type || 'draft_beer',
    volume_ml: initialData.volume_ml || 350,
    quantity: initialData.quantity || 1,
    container: initialData.container || (isRestaurantMode ? 'jug' : 'can'),
    is_suntory: initialData.is_suntory !== false
  })

  const [selectedMenu, setSelectedMenu] = useState<any>(null)

  useEffect(() => {
    if (initialData) {
      setRecord({
        brand_name: initialData.brand_name || '',
        product_type: initialData.product_type || 'draft_beer',
        volume_ml: initialData.volume_ml || 350,
        quantity: initialData.quantity || 1,
        container: initialData.container || (isRestaurantMode ? 'jug' : 'can'),
        is_suntory: initialData.is_suntory !== false
      })
    }
  }, [initialData, isRestaurantMode])

  const containers = isRestaurantMode ? CONTAINER_OPTIONS.restaurant : CONTAINER_OPTIONS.retail
  const currentContainer = containers.find(c => c.value === record.container)

  const handleMenuSelect = (menu: any) => {
    setSelectedMenu(menu)
    setRecord({
      ...record,
      brand_name: menu.product_name,
      product_type: menu.product_type,
      volume_ml: menu.default_volume_ml,
      container: menu.container,
      is_suntory: true
    })
  }

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(50, Math.min(3000, record.volume_ml + delta))
    setRecord({ ...record, volume_ml: newVolume })
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(10, record.quantity + delta))
    setRecord({ ...record, quantity: newQuantity })
  }

  const handleSave = () => {
    onSave(record)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold">記録を編集</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
            {/* 店舗メニューから選択（飲食店モードのみ） */}
            {isRestaurantMode && venueMenus.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">店舗メニュー</h3>
                <div className="grid grid-cols-2 gap-2">
                  {venueMenus.slice(0, 4).map((menu) => (
                    <button
                      key={menu.id}
                      onClick={() => handleMenuSelect(menu)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedMenu?.id === menu.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 text-left">
                        {menu.product_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {menu.default_volume_ml}ml
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 商品名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品名
              </label>
              <input
                type="text"
                value={record.brand_name}
                onChange={(e) => setRecord({ ...record, brand_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="例: ザ・プレミアム・モルツ"
              />
            </div>

            {/* 種類 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                種類
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setRecord({ ...record, product_type: type.value })}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      record.product_type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <p className="text-xs mt-1">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 容器 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                容器
              </label>
              <div className="grid grid-cols-4 gap-2">
                {containers.map((container) => (
                  <button
                    key={container.value}
                    onClick={() => setRecord({ ...record, container: container.value })}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      record.container === container.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{container.icon}</span>
                    <p className="text-xs mt-1">{container.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 容量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                容量
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVolumeChange(-50)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">{record.volume_ml}</span>
                  <span className="text-gray-500 ml-1">ml</span>
                </div>
                <button
                  onClick={() => handleVolumeChange(50)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {currentContainer && (
                <div className="flex gap-2 mt-2 justify-center">
                  {currentContainer.volumes.map((vol) => (
                    <button
                      key={vol}
                      onClick={() => setRecord({ ...record, volume_ml: vol })}
                      className={`px-3 py-1 rounded text-sm ${
                        record.volume_ml === vol
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {vol}ml
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 数量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数量
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">{record.quantity}</span>
                  <span className="text-gray-500 ml-1">杯</span>
                </div>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* サントリー製品チェック */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                サントリー製品
              </span>
              <button
                onClick={() => setRecord({ ...record, is_suntory: !record.is_suntory })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  record.is_suntory ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  animate={{ x: record.is_suntory ? 24 : 0 }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                />
              </button>
            </div>
          </div>

          {/* フッター */}
          <div className="p-4 border-t flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
            >
              保存する
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}