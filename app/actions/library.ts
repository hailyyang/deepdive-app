'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface SavedItem {
  id: string
  user_id: string
  topic: string
  level: string
  content: {
    explanation: string
    analogy: string
    key_terms: string[]
  }
  created_at: string
}

export async function getSavedItems(): Promise<SavedItem[]> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return []
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createServerClient(true)

    // Query saved_items table
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved items:', error)
      return []
    }

    return (data as SavedItem[]) || []
  } catch (error) {
    console.error('Error in getSavedItems:', error)
    return []
  }
}

export async function unsaveItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Create Supabase client with service role to bypass RLS
    const supabase = createServerClient(true)

    // Delete the item
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId) // Ensure user can only delete their own items

    if (error) {
      console.error('Error unsaving item:', error)
      return { success: false, error: 'Failed to unsave item' }
    }

    // Revalidate the library page to refresh the data
    revalidatePath('/library')

    return { success: true }
  } catch (error) {
    console.error('Error in unsaveItem:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function checkIfSaved(topic: string, level: number): Promise<{ saved: boolean; itemId?: string }> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { saved: false }
    }

    const topicLower = topic.toLowerCase().trim()
    const levelString = String(level)

    // Create Supabase client with service role to bypass RLS
    const supabase = createServerClient(true)

    // Check if item exists
    const { data, error } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('topic', topicLower)
      .eq('level', levelString)
      .single()

    if (error || !data) {
      return { saved: false }
    }

    return { saved: true, itemId: data.id }
  } catch (error) {
    console.error('Error checking if saved:', error)
    return { saved: false }
  }
}

