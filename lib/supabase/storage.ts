import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const BUCKET_NAME = 'consumption-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadImageOptions {
  file: File
  userId: string
  consumptionId: string
}

export interface UploadResult {
  success: boolean
  publicUrl?: string
  storagePath?: string
  error?: string
}

export async function uploadConsumptionImage({
  file,
  userId,
  consumptionId
}: UploadImageOptions): Promise<UploadResult> {
  const supabase = createClientComponentClient()

  try {
    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'ファイルサイズが5MBを超えています'
      }
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: '対応していないファイル形式です（JPEG, PNG, WebPのみ）'
      }
    }

    // ファイル名生成（ユーザーID/消費ID_タイムスタンプ.拡張子）
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${consumptionId}_${timestamp}.${fileExt}`

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: 'アップロードに失敗しました'
      }
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    // image_uploadsテーブルに記録
    const { error: dbError } = await supabase
      .from('image_uploads')
      .insert({
        user_id: userId,
        consumption_id: consumptionId,
        storage_path: data.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      // アップロードした画像を削除
      await supabase.storage.from(BUCKET_NAME).remove([data.path])
      return {
        success: false,
        error: 'データベースへの記録に失敗しました'
      }
    }

    // consumptionsテーブルを更新
    await supabase
      .from('consumptions')
      .update({
        image_storage_path: data.path,
        image_url: publicUrl
      })
      .eq('id', consumptionId)

    return {
      success: true,
      publicUrl,
      storagePath: data.path
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: '予期しないエラーが発生しました'
    }
  }
}

export async function deleteConsumptionImage(storagePath: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

export async function getImageUrl(storagePath: string): Promise<string | null> {
  const supabase = createClientComponentClient()

  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    return data.publicUrl
  } catch (error) {
    console.error('Get URL error:', error)
    return null
  }
}

export function compressImage(file: File, maxWidth: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // リサイズ計算
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          resolve(compressedFile)
        }, 'image/jpeg', 0.85) // 85%品質
      }
    }
    reader.onerror = reject
  })
}