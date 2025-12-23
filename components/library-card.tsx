"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Heart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { unsaveItem, type SavedItem } from '@/app/actions/library'
import { toast } from 'sonner'

const LEVEL_LABELS: Record<string, string> = {
  '0': '5-year-olds',
  '1': 'High School',
  '2': 'University',
  '3': 'PhD',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

interface LibraryCardProps {
  item: SavedItem
  onUnsave: (itemId: string) => void
}

export function LibraryCard({ item, onUnsave }: LibraryCardProps) {
  const [isUnsaving, setIsUnsaving] = useState(false)

  const handleUnsave = async () => {
    setIsUnsaving(true)
    try {
      const result = await unsaveItem(item.id)
      if (result.success) {
        toast.success('Removed from library')
        onUnsave(item.id)
      } else {
        toast.error(result.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error unsaving item:', error)
      toast.error('Failed to remove item')
    } finally {
      setIsUnsaving(false)
    }
  }

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-lg">
      <CardHeader className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-xl capitalize">
            {item.topic}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {LEVEL_LABELS[item.level] || `Level ${item.level}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Saved on {formatDate(item.created_at)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {truncateText(item.content.explanation, 200)}
        </p>
        {item.content.key_terms && item.content.key_terms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.content.key_terms.slice(0, 3).map((term, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {term}
              </Badge>
            ))}
            {item.content.key_terms.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.content.key_terms.length - 3} more
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent text-destructive hover:text-destructive"
            onClick={handleUnsave}
            disabled={isUnsaving}
          >
            {isUnsaving ? (
              <>
                <Trash2 className="h-4 w-4 animate-pulse" />
                Removing...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 fill-current text-red-500" />
                Unsave
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

