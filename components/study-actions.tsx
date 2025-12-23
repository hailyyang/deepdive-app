"use client"

import { Button } from '@/components/ui/button'
import { Layers, Brain } from 'lucide-react'
import { toast } from 'sonner'

export function StudyActions() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Study Tools:</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          // TODO: Implement flashcard functionality
          toast.info('Flashcard feature coming soon!')
        }}
      >
        <Layers className="h-4 w-4" />
        Make Flashcard
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          // TODO: Implement quiz functionality
          toast.info('Quiz feature coming soon!')
        }}
      >
        <Brain className="h-4 w-4" />
        Take Quiz
      </Button>
    </div>
  )
}

