import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

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

const ADMIN_ID = 'user_37GIjuBW1YNC0bLc2U3J3bdOq6z'

const LEVEL_NAMES: Record<number, string> = {
  0: 'child',
  1: 'high school student',
  2: 'college student',
  3: 'PhD student',
}

// Helper function to increment usage count
async function incrementUsageCount(userId: string, supabase: ReturnType<typeof createServerClient>) {
  const today = new Date().toISOString().split('T')[0]

  // Fetch current usage
  const { data: usageData } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (usageData) {
    const lastUpdated = usageData.last_updated
      ? new Date(usageData.last_updated).toISOString().split('T')[0]
      : null

    if (lastUpdated !== today) {
      // Reset for new day
      await supabase
        .from('user_usage')
        .upsert({
          user_id: userId,
          count: 1,
          last_updated: today,
        }, {
          onConflict: 'user_id',
        })
    } else {
      // Increment existing count
      await supabase
        .from('user_usage')
        .update({
          count: (usageData.count || 0) + 1,
          last_updated: today,
        })
        .eq('user_id', userId)
    }
  } else {
    // Create new record
    await supabase
      .from('user_usage')
      .insert({
        user_id: userId,
        count: 1,
        last_updated: today,
      })
  }
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

    // Get current user ID
    const { userId } = await auth()

    // Create server-side Supabase client with service role to bypass RLS
    const supabase = createServerClient(true)

    // Check rate limit if user is authenticated
    if (userId) {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

      // Fetch user's usage record
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (usageError && usageError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching user usage:', usageError)
      }

      let currentCount = 0

      if (usageData) {
        const lastUpdated = usageData.last_updated
          ? new Date(usageData.last_updated).toISOString().split('T')[0]
          : null

        // Check if we need to reset (new day)
        if (lastUpdated !== today) {
          currentCount = 0
        } else {
          currentCount = usageData.count || 0
        }
      }

      // Check if limit reached (skip for admin)
      if (userId !== ADMIN_ID && currentCount >= 5) {
        return NextResponse.json(
          { error: 'Daily limit reached. You have used all 5 free searches today. Please upgrade to continue.', limitReached: true },
          { status: 429 }
        )
      }
    }

    const topicLower = topic.toLowerCase().trim()
    const levelName = LEVEL_NAMES[level] || 'general audience'
    const levelString = String(level) // Convert level to string for database

    // Create regular Supabase client for cache check
    const supabaseCache = createServerClient()

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabaseCache
      .from('cached_explanations')
      .select('*')
      .eq('topic', topicLower)
      .eq('level', levelString)
      .single()

    if (cachedData && !cacheError && cachedData.content) {
      const content = cachedData.content as ExplanationResponse
      
      // Increment usage count for cache hit (if user is authenticated)
      if (userId) {
        await incrementUsageCount(userId, supabase)
      }
      
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
    const { error: insertError } = await supabaseCache
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

    // Increment usage count for Gemini call (if user is authenticated)
    if (userId) {
      await incrementUsageCount(userId, supabase)
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

