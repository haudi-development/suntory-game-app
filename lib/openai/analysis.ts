import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIAnalysisResult {
  brand_name: string
  product_type: string
  container: string
  volume_ml: number
  quantity: number
  confidence: number
  is_suntory?: boolean
  error_message?: string | null
}

// Supabaseから製品リストを取得
async function getSuntoryProducts(): Promise<string[]> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    const { data } = await supabase
      .from('suntory_products')
      .select('brand_name')
      .eq('is_active', true)
    
    return data?.map(p => p.brand_name) || []
  } catch (error) {
    console.error('Error fetching products:', error)
    // フォールバックとして基本的な製品リストを返す
    return [
      'ザ・プレミアム・モルツ', '金麦', '角ハイボール', '翠', 
      'こだわり酒場のレモンサワー', '-196℃', 'ほろよい',
      'オールフリー', 'サントリー天然水', '伊右衛門', 'BOSS'
    ]
  }
}

export async function analyzeDrinkImage(imageBase64: string): Promise<AIAnalysisResult> {
  try {
    // データベースから最新の製品リストを取得
    const suntoryProducts = await getSuntoryProducts()
    const productListText = suntoryProducts.join('、')

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたは飲料画像解析AIです。画像から以下の情報を抽出してJSON形式で返してください：
          - brand_name: 商品名（正確な名称）
          - product_type: draft_beer/highball/sour/gin_soda/non_alcohol/water/softdrink/other のいずれか
          - container: ジョッキ/グラス/缶/瓶 のいずれか
          - volume_ml: 推定容量（ml）
          - quantity: 写っている本数
          - confidence: 解析の信頼度（0-1）
          - is_suntory: サントリー製品かどうか（true/false）
          - error_message: サントリー製品でない場合のメッセージ（null or string）
          
          重要：
          1. サントリー製品でない場合は、is_suntory: false, error_message: "サントリー製品ではありません"
          2. 飲料以外（食べ物など）の場合は、product_type: "other", error_message: "飲料ではありません"
          3. 画像が不鮮明な場合は、confidence を低く設定
          
          サントリー製品の判定基準：
          1. 以下のブランドはサントリー製品です（データベースから取得）：
          ${productListText}
          
          2. 以下は他社製品です（サントリーではありません）：
          コカ・コーラ社：コカ・コーラ、綾鷹、爽健美茶、アクエリアス、い・ろ・は・す、ジョージア
          アサヒ：スーパードライ、クリアアサヒ、ウィルキンソン、三ツ矢サイダー、ワンダ、十六茶
          キリン：一番搾り、淡麗、午後の紅茶、生茶、ファイア、キリンレモン
          サッポロ：黒ラベル、ヱビス、サッポロ生ビール
          伊藤園：お〜いお茶、充実野菜
          ペプシコ：ペプシ
          
          3. 判定のポイント：
          - 綾鷹 → コカ・コーラ社製品なので is_suntory: false
          - 伊右衛門 → サントリー製品なので is_suntory: true
          - お〜いお茶 → 伊藤園製品なので is_suntory: false
          - 烏龍茶（サントリー） → is_suntory: true
          - C.C.レモン → サントリー製品なので is_suntory: true
          
          必ず製造メーカーを正確に判定してください。`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この飲料画像を解析してください。"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No analysis result')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response')
    }

    const result = JSON.parse(jsonMatch[0])
    
    return {
      brand_name: result.brand_name || '不明',
      product_type: result.product_type || 'other',
      container: result.container || 'ジョッキ',
      volume_ml: result.volume_ml || 350,
      quantity: result.quantity || 1,
      confidence: result.confidence || 0.5,
      is_suntory: result.is_suntory !== false,
      error_message: result.error_message || null,
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    
    return {
      brand_name: '不明',
      product_type: 'other',
      container: 'ジョッキ',
      volume_ml: 350,
      quantity: 1,
      confidence: 0,
      is_suntory: false,
      error_message: '画像を解析できませんでした',
    }
  }
}

export function calculatePoints(analysis: AIAnalysisResult): number {
  let points = 10
  
  const typeMultiplier: Record<string, number> = {
    draft_beer: 1.2,
    highball: 1.3,
    sour: 1.1,
    gin_soda: 1.4,
    non_alcohol: 0.8,
    water: 0.5,
    softdrink: 0.5,
  }
  
  points *= typeMultiplier[analysis.product_type] || 1
  
  if (analysis.volume_ml >= 500) {
    points *= 1.5
  }
  
  points *= analysis.quantity
  
  if (analysis.confidence > 0.8) {
    points *= 1.1
  }
  
  return Math.round(points)
}