import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const PLANS = [
  {
    name: "Free",
    description: "Perfect for casual learners",
    price: "$0",
    features: [
      "Basic Explanations",
      "5-year-olds - High School levels",
      "Limited to 5 searches/day",
      "Save favorite explanations",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
  },
  {
    name: "Pro",
    description: "For serious students & professionals",
    price: "$9.99",
    period: "/month",
    features: [
      "University & PhD Level Deep Dives",
      "Unlimited Searches",
      "Unlimited Flashcard Generation",
      "Interactive Quiz Mode",
      "Export to PDF",
      "Priority Support",
    ],
    buttonText: "Upgrade to Pro",
    buttonVariant: "default" as const,
    highlighted: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="w-full border-t border-border bg-muted/30 py-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Choose Your Learning Path</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Start free, upgrade when you need advanced features
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.highlighted ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
                      : ""
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
