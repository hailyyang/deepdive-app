"use client"

import { useState } from 'react'
import { LibraryCard } from './library-card'
import { type SavedItem } from '@/app/actions/library'

interface LibraryClientProps {
  initialItems: SavedItem[]
}

export function LibraryClient({ initialItems }: LibraryClientProps) {
  const [items, setItems] = useState<SavedItem[]>(initialItems)

  const handleUnsave = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} onUnsave={handleUnsave} />
      ))}
    </div>
  )
}

