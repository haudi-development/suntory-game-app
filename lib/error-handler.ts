import toast from 'react-hot-toast'

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'ANALYSIS_ERROR'
  | 'STORAGE_ERROR'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

export interface AppError {
  type: ErrorType
  message: string
  details?: any
  retryable?: boolean
}

export class ErrorHandler {
  static handle(error: any): AppError {
    console.error('Error occurred:', error)

    // ネットワークエラー
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'ネットワークエラーが発生しました。接続を確認してください。',
        retryable: true
      }
    }

    // 認証エラー
    if (error.message?.includes('auth') || error.status === 401) {
      return {
        type: 'AUTH_ERROR',
        message: 'ログインが必要です。',
        retryable: false
      }
    }

    // AI解析エラー
    if (error.message?.includes('analysis') || error.message?.includes('OpenAI')) {
      return {
        type: 'ANALYSIS_ERROR',
        message: '画像解析に失敗しました。別の画像をお試しください。',
        retryable: true
      }
    }

    // ストレージエラー
    if (error.message?.includes('storage') || error.message?.includes('upload')) {
      return {
        type: 'STORAGE_ERROR',
        message: '画像のアップロードに失敗しました。',
        retryable: true
      }
    }

    // データベースエラー
    if (error.message?.includes('database') || error.code?.startsWith('PGRST')) {
      return {
        type: 'DATABASE_ERROR',
        message: 'データの保存に失敗しました。',
        retryable: true
      }
    }

    // バリデーションエラー
    if (error.message?.includes('validation') || error.status === 400) {
      return {
        type: 'VALIDATION_ERROR',
        message: '入力内容に誤りがあります。',
        retryable: false
      }
    }

    // その他のエラー
    return {
      type: 'UNKNOWN_ERROR',
      message: '予期しないエラーが発生しました。',
      details: error,
      retryable: true
    }
  }

  static notify(error: AppError, options?: { duration?: number }) {
    const message = error.message
    const duration = options?.duration || 4000

    switch (error.type) {
      case 'AUTH_ERROR':
        toast.error(message, { duration, icon: '🔒' })
        break
      case 'NETWORK_ERROR':
        toast.error(message, { duration, icon: '📡' })
        break
      case 'ANALYSIS_ERROR':
        toast.error(message, { duration, icon: '🤖' })
        break
      default:
        toast.error(message, { duration })
    }

    return error
  }

  static async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries === 0) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.retry(fn, retries - 1, delay * 2)
    }
  }
}

// オフラインチェック
export function isOffline(): boolean {
  return !navigator.onLine
}

// オフライン時の処理
export function handleOffline(callback?: () => void) {
  if (isOffline()) {
    toast.error('オフラインです。接続を確認してください。', {
      duration: 5000,
      icon: '📵'
    })
    callback?.()
    return true
  }
  return false
}

// エラーリカバリー用のフォールバック値
export const fallbackValues = {
  defaultProduct: {
    brand_name: 'Unknown',
    product_type: 'other',
    volume_ml: 350,
    quantity: 1,
    confidence: 0,
    is_suntory: false
  },
  defaultPoints: 0,
  defaultImage: '/images/placeholder-drink.png'
}