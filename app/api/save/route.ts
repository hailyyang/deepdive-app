import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

interface RequestBody {
  topic: string
  level: number
  content: {
    explanation: string
    analogy: string
    key_terms: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to save items.' },
        { status: 401 }
      )
    }

    const body: RequestBody = await request.json()
    const { topic, level, content } = body

    if (!topic || level === undefined || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, level, and content' },
        { status: 400 }
      )
    }

    const topicLower = topic.toLowerCase().trim()
    const levelString = String(level)

    // Create server-side Supabase client with service role to bypass RLS for MVP
    // TODO: Secure this properly by passing Clerk token to Supabase
    const supabase = createServerClient(true)

    // Check if item already exists for this user
    const { data: existingItem } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topicLower)
      .eq('level', levelString)
      .single()

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item already saved', saved: true },
        { status: 409 }
      )
    }

    // Insert new saved item
    const { error: insertError } = await supabase
      .from('saved_items')
      .insert({
        user_id: userId,
        topic: topicLower,
        level: levelString,
        content: content,
      })

    if (insertError) {
      console.error('Error saving to Supabase:', insertError)
      return NextResponse.json(
        { error: 'Failed to save item to library' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Item saved to library successfully',
    })
  } catch (error) {
    console.error('Error in save API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

