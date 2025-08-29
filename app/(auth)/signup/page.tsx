'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        toast.error(`登録に失敗しました: ${authError.message}`)
        console.error('Signup error:', authError)
        setLoading(false)
        return
      }
      
      if (authData.user) {
        // プロフィール作成
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            nickname,
            selected_character: 'water', // 初期キャラクターを水に変更
          } as any)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // プロフィールがすでに存在する場合も成功として扱う
          if (!profileError.message?.includes('duplicate')) {
            toast.error(`プロフィール作成エラー: ${profileError.message}`)
          }
        }

        // 水のキャラクターだけ初期解放
        const { error: charError } = await supabase
          .from('user_characters')
          .insert({
            user_id: authData.user.id,
            character_type: 'water',
            level: 1,
            exp: 0,
            evolution_stage: 1,
          } as any)

        if (charError) {
          console.error('Character creation error:', charError)
          // キャラクターがすでに存在する場合も成功として扱う
          if (!charError.message?.includes('duplicate')) {
            toast.error(`キャラクター作成エラー: ${charError.message}`)
          }
        }

        toast.success('登録完了！')
        
        // 自動ログインを試みる
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (!signInError) {
          toast.success('自動ログインしました！')
          router.push('/')  // ホーム画面へ遷移
        } else {
          toast.info('ログイン画面からログインしてください。', { duration: 5000 })
          router.push('/login')  // ログイン画面へ遷移
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.error(`エラーが発生しました: ${error.message || 'Unknown error'}`)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">
            新規登録
          </h1>
          <p className="text-gray-600">アカウントを作成して始めましょう</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              ニックネーム
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="お名前"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="6文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登録中...' : '登録'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary-dark hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}