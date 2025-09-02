import { createClient } from '@/lib/supabase/client'

/**
 * データベーステストヘルパー
 * SQLを実行する前に制約をチェック
 */

export class DatabaseTestHelper {
  private supabase = createClient()

  /**
   * auth.usersに存在するuser_idか確認
   */
  async validateUserId(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId)
    return !error && !!data
  }

  /**
   * テーブルのUNIQUE制約を確認
   */
  async checkUniqueConstraints(tableName: string): Promise<string[]> {
    const { data, error } = await this.supabase.rpc('get_table_constraints', {
      table_name: tableName
    })
    
    if (error) {
      console.error('Error checking constraints:', error)
      return []
    }
    
    return data?.filter((c: any) => c.constraint_type === 'UNIQUE')
      .map((c: any) => c.column_name) || []
  }

  /**
   * 安全なテストデータ作成
   */
  async createSafeTestData() {
    // 既存ユーザーを取得
    const { data: users } = await this.supabase.auth.admin.listUsers()
    
    if (!users || users.users.length === 0) {
      throw new Error('No existing users found. Please create users through Supabase Auth first.')
    }

    const testData = []
    const testNames = [
      '山田太郎', '鈴木花子', '佐藤健太', '田中美咲', '渡辺翔',
      '小林優子', '山本大輝', '中村愛', '井上蓮', '木村さくら'
    ]

    for (let i = 0; i < Math.min(users.users.length, testNames.length); i++) {
      const user = users.users[i]
      const name = testNames[i]
      const points = 15000 - (i * 1000)

      // profilesを更新（INSERTではなくUPDATE）
      const { error } = await this.supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: name,
          total_points: points,
          selected_character: ['premol', 'kakuhai', 'sui', 'lemon', 'allfree'][i % 5]
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`Error updating profile for ${name}:`, error)
      } else {
        testData.push({ user_id: user.id, name, points })
      }
    }

    return testData
  }

  /**
   * SQLの安全性チェック
   */
  validateSQL(sql: string): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = []
    
    // auth.usersへのINSERTチェック
    if (/INSERT\s+INTO\s+auth\.users/i.test(sql)) {
      warnings.push('❌ auth.usersへのINSERTは禁止されています')
    }
    
    // gen_random_uuid()の使用チェック
    if (/gen_random_uuid\(\)/i.test(sql) && /INSERT\s+INTO\s+profiles/i.test(sql)) {
      warnings.push('⚠️ profilesテーブルに新規UUIDを使用しています。auth.usersに存在しない可能性があります')
    }
    
    // ON CONFLICTの使用チェック
    if (/ON\s+CONFLICT\s*\(\s*user_id\s*\)/i.test(sql) && /profiles/i.test(sql)) {
      warnings.push('⚠️ profilesテーブルのuser_idにはUNIQUE制約がありません')
    }
    
    // 外部キー確認の推奨
    if (/INSERT\s+INTO/i.test(sql) && !/WHERE\s+user_id\s+IN\s*\(\s*SELECT/i.test(sql)) {
      warnings.push('💡 user_id IN (SELECT id FROM auth.users)での確認を推奨')
    }
    
    return {
      isValid: warnings.filter(w => w.startsWith('❌')).length === 0,
      warnings
    }
  }
}

// シングルトンインスタンス
export const dbTestHelper = new DatabaseTestHelper()