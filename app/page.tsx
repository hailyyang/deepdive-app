"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { LevelSlider } from "@/components/level-slider"
import { ResultCard } from "@/components/result-card"
import { PricingSection } from "@/components/pricing-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"

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

  const handleSearch = async () => {
    if (!concept.trim()) {
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
            <LevelSlider value={level} onChange={setLevel} />
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
          />
        </div>
      </main>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  )
}
