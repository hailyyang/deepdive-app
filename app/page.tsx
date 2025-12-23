"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { LevelSlider } from "@/components/level-slider"
import { ResultCard } from "@/components/result-card"
import { PricingSection } from "@/components/pricing-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Layers, Brain, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { SignedIn, useUser } from "@clerk/nextjs"

interface ExplanationData {
  explanation: string
  analogy: string
  key_terms: string[]
  source?: 'cache' | 'gemini'
}

export default function HomePage() {
  const [level, setLevel] = useState(0)
  const [concept, setConcept] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExplanationData | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalType, setUpgradeModalType] = useState<'limit' | 'premium'>('limit')
  
  const { user } = useUser()
  const ADMIN_ID = 'user_37GIjuBW1YNC0bLc2U3J3bdOq6z'
  
  // Check if user is admin or has pro subscription
  // For now, assume all users are free except admin (can be updated when subscription system is added)
  const isPro = user?.id === ADMIN_ID // || subscriptionStatus === 'active'

  const handleSearch = async () => {
    if (!concept.trim()) {
      return
    }

    // Check if user is trying to search with premium level
    if ((level === 2 || level === 3) && !isPro) {
      setUpgradeModalType('premium')
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: concept.trim(),
          level,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Check if it's a rate limit error
        if (response.status === 429 && errorData.limitReached) {
          setUpgradeModalType('limit')
          setShowUpgradeModal(true)
          setError(errorData.error || 'Daily limit reached')
          return
        }
        
        throw new Error(errorData.error || 'Failed to get explanation')
      }

      const data: ExplanationData = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto py-12 md:py-20">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Understand Anything
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                At Your Level
              </span>
            </h1>
            <p className="text-pretty text-lg text-muted-foreground md:text-xl">
              From simple explanations to PhD-level insights. AI-powered learning that adapts to you.
            </p>
          </div>

          {/* Main Tool */}
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
            {/* Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="What do you want to understand today?"
                  className="h-12 pl-10 text-base"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSearch()}
                  disabled={isLoading}
                />
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
                onClick={handleSearch}
                disabled={isLoading || !concept.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  "Deep Dive"
                )}
              </Button>
            </div>

            {/* Level Slider */}
            <LevelSlider 
              value={level} 
              onChange={setLevel}
              isPro={isPro}
              onPremiumLevelClick={() => {
                setUpgradeModalType('premium')
                setShowUpgradeModal(true)
              }}
            />
          </div>

          {/* Result Display */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          <ResultCard
            title={result ? `Understanding ${concept}` : ""}
            content={result ? result.explanation : ""}
            analogy={result?.analogy}
            keyTerms={result?.key_terms || []}
            isVisible={hasSearched}
            isLoading={isLoading}
            topic={concept}
            level={level}
          />

          {/* Study Features Info */}
          <SignedIn>
            {hasSearched && result && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Study with your saved items
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Save this explanation to your library to access interactive study features:
                      </p>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Layers className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Make Flashcards</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Take Quizzes</span>
                        </div>
                      </div>
                      <Link href="/library" className="inline-block mt-2">
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                          Go to My Library →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </SignedIn>
        </div>
      </main>

      {/* Pricing Section */}
      <PricingSection />

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {upgradeModalType === 'limit' ? 'Daily Limit Reached' : 'Premium Feature'}
            </DialogTitle>
            <DialogDescription>
              {upgradeModalType === 'limit' 
                ? "You've used all 5 free searches today. Upgrade to Pro for unlimited searches and access to advanced features!"
                : "University and PhD level explanations are available for Pro members. Upgrade to unlock advanced learning features!"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              With Pro, you'll get:
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Unlimited daily searches</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>University & PhD level explanations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Flashcard generation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Interactive quizzes</span>
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Maybe Later
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
              onClick={() => {
                setShowUpgradeModal(false)
                // Scroll to pricing section
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
