import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useStylistRecommendations } from '@/hooks/useStylistRecommendations'
import { useWardrobeManager } from '@/hooks/useWardrobeManager'
import { cn } from '@/lib/utils'
import type { AIRecommendation, RecommendationContext } from '@/types'

interface RecommendationCarouselProps {
  onOutfitSelect: (recommendation: AIRecommendation) => void
  context?: RecommendationContext
  className?: string
}

export const RecommendationCarousel = React.memo<RecommendationCarouselProps>(({
  onOutfitSelect,
  context = {},
  className
}) => {
  const { clothingItems } = useWardrobeManager()
  const {
    generateRecommendations,
    isGenerating,
    lastRecommendations
  } = useStylistRecommendations(clothingItems)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])

  // Generate initial recommendations
  useEffect(() => {
    if (clothingItems.length >= 2 && recommendations.length === 0 && !isGenerating) {
      // Use heuristic only for dashboard carousel to prevent lag
      generateRecommendations(context, 6, true).then(setRecommendations)
    }
  }, [clothingItems.length, context]) // Only re-run if item count changes to prevent loops

  // Update recommendations when they change
  useEffect(() => {
    if (lastRecommendations.length > 0) {
      setRecommendations(lastRecommendations)
      setCurrentIndex(0)
    }
  }, [lastRecommendations])

  // Navigate carousel
  const goToPrevious = () => {
    setCurrentIndex(prev =>
      prev === 0 ? recommendations.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex(prev =>
      prev === recommendations.length - 1 ? 0 : prev + 1
    )
  }

  // Generate new recommendations
  const handleRefresh = async () => {
    if (clothingItems.length >= 2) {
      const newRecommendations = await generateRecommendations(context, 6, true)
      setRecommendations(newRecommendations)
      setCurrentIndex(0)
    }
  }

  if (clothingItems.length < 2) {
    return (
      <div className={cn('bg-white rounded-xl p-6 text-center', className)}>
        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI Stylist Ready
        </h3>
        <p className="text-gray-600">
          Add at least 2 clothing items to get personalized outfit recommendations
        </p>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className={cn('bg-white rounded-xl p-6', className)}>
        <div className="flex items-center justify-center">
          <LoadingSpinner text="AI Stylist is thinking..." />
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl p-6 text-center', className)}>
        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Recommendations Yet
        </h3>
        <p className="text-gray-600 mb-4">
          Let our AI stylist analyze your wardrobe and create outfit suggestions
        </p>
        <Button onClick={handleRefresh} disabled={isGenerating}>
          <Sparkles className="w-4 h-4" />
          Get Recommendations
        </Button>
      </div>
    )
  }

  const currentRecommendation = recommendations[currentIndex]

  return (
    <div className={cn('bg-white rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Stylist
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {recommendations.length}
            </span>
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="ghost"
              disabled={isGenerating}
              isLoading={isGenerating}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Recommendation Content */}
      <div className="p-4">
        {/* Outfit Preview */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {currentRecommendation.outfit.map((item, index) => (
              <div key={item.id} className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation Details */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full mr-1',
                    i < Math.round(currentRecommendation.confidence * 5)
                      ? 'bg-primary-500'
                      : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(currentRecommendation.confidence * 100)}% Match
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {currentRecommendation.reasoning}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-1 mb-4">
            {currentRecommendation.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onOutfitSelect(currentRecommendation)}
            className="flex-1"
          >
            Try This Outfit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled // TODO: Implement favorite functionality
          >
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {recommendations.length > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={goToPrevious}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Dots indicator */}
          <div className="flex gap-1">
            {recommendations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentIndex ? 'bg-primary-500' : 'bg-gray-300'
                )}
                aria-label={`Go to recommendation ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={goToNext}
            size="sm"
            variant="ghost"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
})

RecommendationCarousel.displayName = 'RecommendationCarousel'