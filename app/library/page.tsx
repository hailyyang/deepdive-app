import { getSavedItems } from '@/app/actions/library'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LibraryClient } from '@/components/library-client'
import { StudyActions } from '@/components/study-actions'

export default async function LibraryPage() {
  const savedItems = await getSavedItems()

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto py-12 md:py-20">
        <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-6">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Main
            </Button>
          </Link>

          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              My Library
            </h1>
            <p className="text-pretty text-lg text-muted-foreground">
              Your saved explanations and deep dives
            </p>
          </div>

          {/* Study Actions */}
          {savedItems.length > 0 && <StudyActions />}

          {/* Empty State */}
          {savedItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Your library is empty</h3>
                  <p className="text-muted-foreground">
                    You haven't saved anything yet. Go explore and save your favorite explanations!
                  </p>
                </div>
                <Link href="/">
                  <Button className="mt-4">
                    Start Exploring
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <LibraryClient initialItems={savedItems} />
          )}
        </div>
      </div>
    </div>
  )
}

