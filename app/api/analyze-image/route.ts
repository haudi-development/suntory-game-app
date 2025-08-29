import { NextRequest, NextResponse } from 'next/server'
import { analyzeDrinkImage, calculatePoints } from '@/lib/openai/analysis'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    const analysis = await analyzeDrinkImage(imageBase64)
    // Only calculate points for Suntory products
    const points = analysis.is_suntory !== false ? calculatePoints(analysis) : 0

    return NextResponse.json({
      success: true,
      analysis,
      points,
    })
  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}