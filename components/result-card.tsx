"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Layers, Brain, Loader2 } from "lucide-react"
import { useState } from "react"

interface ResultCardProps {
  title: string
  content: string
  analogy?: string
  keyTerms: string[]
  isVisible: boolean
  isLoading?: boolean
}

export function ResultCard({ title, content, analogy, keyTerms, isVisible, isLoading = false }: ResultCardProps) {
  const [isSaved, setIsSaved] = useState(false)

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
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setIsSaved(!isSaved)}>
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current text-red-500" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Layers className="h-4 w-4" />
            Make Flashcard
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Brain className="h-4 w-4" />
            Take Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
