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

export async function analyzeDrinkImage(imageBase64: string): Promise<AIAnalysisResult> {
  try {
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
          
          サントリー製品例：
          ビール：ザ・プレミアム・モルツ、モルツ、香るエール、金麦
          ハイボール：角ハイボール、白州ハイボール、知多ハイボール、トリスハイボール、ジムビームハイボール
          サワー：こだわり酒場レモンサワー、-196℃、ほろよい、グレープフルーツサワー
          ジン：翠（SUI）ジンソーダ
          ノンアル：オールフリー、のんある気分
          水・茶：サントリー天然水、烏龍茶、伊右衛門、BOSS（コーヒー）
          
          他社製品の場合でも正確に商品名を識別してください。`
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