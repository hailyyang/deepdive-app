"use client"
import { Slider } from "@/components/ui/slider"
import { Lock } from "lucide-react"

const LEVELS = [
  { value: 0, label: "5-year-olds", description: "Simple & Fun", premium: false },
  { value: 1, label: "High School", description: "Clear & Detailed", premium: false },
  { value: 2, label: "University", description: "In-Depth", premium: true },
  { value: 3, label: "PhD", description: "Expert Level", premium: true },
]

interface LevelSliderProps {
  value: number
  onChange: (value: number) => void
  isPro?: boolean
  onPremiumLevelClick?: () => void
}

export function LevelSlider({ value, onChange, isPro = false, onPremiumLevelClick }: LevelSliderProps) {
  const currentLevel = LEVELS[value]

  const handleLevelChange = (newValue: number) => {
    const targetLevel = LEVELS[newValue]
    // If trying to access premium level and user is not pro, show upgrade modal
    if (targetLevel.premium && !isPro && onPremiumLevelClick) {
      onPremiumLevelClick()
      return
    }
    onChange(newValue)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Understanding Level:</span>
          <span className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
            {currentLevel.label}
            {currentLevel.premium && <Lock className="h-4 w-4 text-secondary" />}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">{currentLevel.description}</span>
      </div>

      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => handleLevelChange(newValue)}
          max={3}
          step={1}
          className="w-full"
        />
        <div className="mt-3 flex justify-between">
          {LEVELS.map((level, index) => (
            <button
              key={level.value}
              onClick={() => handleLevelChange(index)}
              className={`flex flex-col items-center gap-1 transition-opacity ${
                value === index ? "opacity-100" : "opacity-40 hover:opacity-70"
              } ${level.premium && !isPro ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-xs font-medium">{level.label}</span>
              {level.premium && <Lock className="h-3 w-3 text-secondary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
