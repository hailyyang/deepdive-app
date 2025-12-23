"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useUser, SignInButton } from "@clerk/nextjs"
import { toast } from "sonner"
import { checkIfSaved, unsaveItem } from "@/app/actions/library"

interface ResultCardProps {
  title: string
  content: string
  analogy?: string
  keyTerms: string[]
  isVisible: boolean
  isLoading?: boolean
  topic?: string
  level?: number
}

export function ResultCard({ 
  title, 
  content, 
  analogy, 
  keyTerms, 
  isVisible, 
  isLoading = false,
  topic = "",
  level = 0
}: ResultCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [savedItemId, setSavedItemId] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const { isSignedIn, user } = useUser()

  // Check if item is already saved when component mounts or when topic/level changes
  useEffect(() => {
    if (isSignedIn && topic && content) {
      checkIfSaved(topic, level).then((result) => {
        setIsSaved(result.saved)
        setSavedItemId(result.itemId)
      })
    }
  }, [isSignedIn, topic, level, content])

  const handleSave = async () => {
    if (!isSignedIn) {
      // This will be handled by the SignInButton wrapper
      return
    }

    if (!topic || !content) {
      toast.error("Unable to save: Missing topic or content")
      return
    }

    // If already saved, unsave it
    if (isSaved && savedItemId) {
      setIsSaving(true)
      try {
        const result = await unsaveItem(savedItemId)
        if (result.success) {
          setIsSaved(false)
          setSavedItemId(undefined)
          toast.success("Removed from library")
        } else {
          toast.error(result.error || 'Failed to remove item')
        }
      } catch (error) {
        console.error('Error unsaving item:', error)
        toast.error('Failed to remove item')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Save the item
    setIsSaving(true)

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          level: level,
          content: {
            explanation: content,
            analogy: analogy || '',
            key_terms: keyTerms || [],
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Already saved
          setIsSaved(true)
          toast.success("Already saved to library!")
        } else {
          throw new Error(data.error || 'Failed to save item')
        }
      } else {
        setIsSaved(true)
        toast.success("Saved to library!")
        // Re-check to get the item ID
        const checkResult = await checkIfSaved(topic, level)
        setSavedItemId(checkResult.itemId)
      }
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save item')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isVisible) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <p className="text-center text-muted-foreground">
            Enter a concept above and click "Deep Dive" to begin learning...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">Thinking...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!content) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="prose prose-sm max-w-none text-pretty leading-relaxed text-foreground">{content}</div>

        {analogy && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">💡 Analogy:</h3>
            <p className="text-pretty leading-relaxed text-foreground">{analogy}</p>
          </div>
        )}

        {keyTerms.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Key Terms:</h3>
            <div className="flex flex-wrap gap-2">
              {keyTerms.map((term, index) => (
                <span key={index} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border pt-4">
          {isSignedIn ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current text-red-500" : ""}`} />
              {isSaving ? (isSaved ? "Removing..." : "Saving...") : isSaved ? "Saved" : "Save to Library"}
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-transparent"
              >
                <Heart className="h-4 w-4" />
                Save to Library
              </Button>
            </SignInButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
