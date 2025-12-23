import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@/lib/supabase'

const geminiApiKey = process.env.GEMINI_API_KEY
if (!geminiApiKey) {
  console.error('GEMINI_API_KEY environment variable is not set')
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null

interface RequestBody {
  topic: string
  level: number
}

interface ExplanationResponse {
  explanation: string
  analogy: string
  key_terms: string[]
}

const LEVEL_NAMES: Record<number, string> = {
  0: 'child',
  1: 'high school student',
  2: 'college student',
  3: 'PhD student',
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { topic, level } = body

    if (!topic || level === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: topic and level' },
        { status: 400 }
      )
    }

    const topicLower = topic.toLowerCase().trim()
    const levelName = LEVEL_NAMES[level] || 'general audience'
    const levelString = String(level) // Convert level to string for database

    // Create server-side Supabase client
    const supabase = createServerClient()

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('cached_explanations')
      .select('*')
      .eq('topic', topicLower)
      .eq('level', levelString)
      .single()

    if (cachedData && !cacheError && cachedData.content) {
      const content = cachedData.content as ExplanationResponse
      return NextResponse.json({
        explanation: content.explanation,
        analogy: content.analogy,
        key_terms: content.key_terms || [],
        source: 'cache',
      })
    }

    // If not in cache, call Gemini
    if (!genAI || !geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Validate API key format
    const trimmedKey = geminiApiKey.trim()
    if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 35) {
      return NextResponse.json(
        { error: 'Invalid Gemini API key format. API keys should start with "AIza" and be at least 35 characters long.' },
        { status: 500 }
      )
    }

    // Try gemini-2.5-flash first, fallback to gemini-1.5-flash if it fails
    let model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Explain '${topic}' to a '${levelName}' audience. Return valid JSON with this exact structure: { "explanation": "...", "analogy": "...", "key_terms": ["term1", "term2", ...] }. The explanation should be comprehensive and appropriate for the audience level. The analogy should be a relatable comparison. The key_terms should be an array of important terms related to the topic.`

    let result
    try {
      result = await model.generateContent(prompt)
    } catch (modelError: any) {
      // If gemini-2.5-flash fails, try gemini-1.5-flash as fallback
      if (modelError?.message?.includes('gemini-2.5-flash') || modelError?.message?.includes('not found')) {
        console.warn('gemini-2.5-flash not available, falling back to gemini-1.5-flash')
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        result = await model.generateContent(prompt)
      } else {
        throw modelError
      }
    }
    const response = await result.response
    const text = response.text()

    // Parse JSON from response (might be wrapped in markdown code blocks)
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    let geminiResponse: ExplanationResponse
    try {
      geminiResponse = JSON.parse(jsonText)
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        geminiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse Gemini response as JSON')
      }
    }

    // Validate response structure
    if (!geminiResponse.explanation || !geminiResponse.analogy || !Array.isArray(geminiResponse.key_terms)) {
      return NextResponse.json(
        { error: 'Invalid response format from Gemini' },
        { status: 500 }
      )
    }

    // Save to Supabase - wrap everything in content field
    const { error: insertError } = await supabase
      .from('cached_explanations')
      .insert({
        topic: topicLower,
        level: levelString,
        content: {
          explanation: geminiResponse.explanation,
          analogy: geminiResponse.analogy,
          key_terms: geminiResponse.key_terms,
        },
      })

    if (insertError) {
      console.error('Error saving to Supabase:', insertError)
      // Continue anyway - return the result even if save fails
    }

    return NextResponse.json({
      explanation: geminiResponse.explanation,
      analogy: geminiResponse.analogy,
      key_terms: geminiResponse.key_terms,
      source: 'gemini',
    })
  } catch (error) {
    console.error('Error in explain API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

