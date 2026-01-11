import { useState, useCallback, useMemo } from 'react'

import type { ClothingItem, AIRecommendation, RecommendationContext, StylistInput } from '@/types'

interface ColorCompatibility {
  [key: string]: string[]
}

// Color compatibility rules for outfit recommendations
const COLOR_COMPATIBILITY: ColorCompatibility = {
  'black': ['white', 'gray', 'red', 'blue', 'green', 'yellow', 'pink', 'purple'],
  'white': ['black', 'gray', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown'],
  'gray': ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple'],
  'red': ['black', 'white', 'gray', 'blue', 'green'],
  'blue': ['black', 'white', 'gray', 'red', 'yellow', 'green'],
  'green': ['black', 'white', 'gray', 'red', 'blue', 'brown'],
  'yellow': ['black', 'white', 'gray', 'blue', 'purple'],
  'pink': ['black', 'white', 'gray', 'blue', 'green'],
  'purple': ['black', 'white', 'gray', 'yellow'],
  'brown': ['white', 'green', 'blue', 'cream']
}

// Style compatibility rules
const STYLE_COMPATIBILITY = {
  'casual': ['casual', 'sporty'],
  'formal': ['formal', 'business'],
  'sporty': ['sporty', 'casual'],
  'party': ['party', 'formal'],
  'business': ['business', 'formal']
}

// Season-appropriate combinations
const SEASON_RULES = {
  'spring': ['light', 'breathable', 'colorful'],
  'summer': ['light', 'breathable', 'sleeveless'],
  'fall': ['layered', 'warm', 'earth-tones'],
  'winter': ['warm', 'layered', 'heavy']
}

export function useStylistRecommendations(clothingItems: ClothingItem[]) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastRecommendations, setLastRecommendations] = useState<AIRecommendation[]>([])

  // Organize clothing by type for easier access
  const organizedClothing = useMemo(() => {
    return clothingItems.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = []
      }
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, ClothingItem[]>)
  }, [clothingItems])

  // Calculate color compatibility score
  const calculateColorCompatibility = useCallback((color1: string, color2: string): number => {
    const compatibleColors = COLOR_COMPATIBILITY[color1.toLowerCase()] || []
    return compatibleColors.includes(color2.toLowerCase()) ? 1 : 0
  }, [])

  // Calculate style compatibility score
  const calculateStyleCompatibility = useCallback((style1: string, style2: string): number => {
    const compatibleStyles = STYLE_COMPATIBILITY[style1 as keyof typeof STYLE_COMPATIBILITY] || []
    return compatibleStyles.includes(style2) ? 1 : 0.5
  }, [])

  // Generate outfit combinations
  const generateOutfitCombinations = useCallback((
    context: RecommendationContext | StylistInput = {}
  ): ClothingItem[][] => {
    // Normalize input to RecommendationContext
    const occasion = 'occasion' in context ? context.occasion : context.occasion || 'casual'
    const season = 'season' in context ? context.season : undefined
    const weather = 'weather' in context ? context.weather : undefined
    const temperature = 'temperature' in context ? context.temperature : undefined

    const combinations: ClothingItem[][] = []

    // Strategy 1: Top + Bottom combinations
    const tops = organizedClothing['top'] || []
    const bottoms = organizedClothing['bottom'] || []

    tops.forEach(top => {
      bottoms.forEach(bottom => {
        // Check compatibility
        const colorScore = calculateColorCompatibility(top.color, bottom.color)
        const styleScore = calculateStyleCompatibility(top.style, bottom.style)

        // Filter by occasion and season
        const occasionMatch = top.style === occasion || bottom.style === occasion
        const seasonMatch = !season ||
          top.season === season || top.season === 'all-season' ||
          bottom.season === season || bottom.season === 'all-season'

        // Temperature checks
        let tempMatch = true
        if (temperature !== undefined) {
          if (temperature < 15) { // Cold
            // Prefer warm items (fall/winter)
            tempMatch = (top.season === 'winter' || top.season === 'fall' || top.season === 'all-season')
          } else if (temperature > 25) { // Hot
            // Prefer cool items (summer/spring)
            tempMatch = (top.season === 'summer' || top.season === 'spring' || top.season === 'all-season')
          }
        }

        if (colorScore > 0 && styleScore > 0 && occasionMatch && seasonMatch && tempMatch) {
          const combination = [top, bottom]

          // Add outerwear if appropriate (Weather/Temperature based)
          const needsOuterwear =
            (season === 'fall' || season === 'winter') ||
            (weather === 'rainy' || weather === 'snowy') ||
            (temperature !== undefined && temperature < 18)

          if (needsOuterwear) {
            const outerwear = organizedClothing['outerwear']?.find(item =>
              calculateColorCompatibility(item.color, top.color) > 0 &&
              calculateStyleCompatibility(item.style, top.style) > 0 &&
              (!weather || (weather === 'rainy' ? item.tags.includes('waterproof') || item.season !== 'summer' : true))
            )
            if (outerwear) {
              combination.push(outerwear)
            }
          }

          combinations.push(combination)
        }
      })
    })

    // Strategy 2: Dress-based combinations
    const dresses = organizedClothing['dress'] || []
    dresses.forEach(dress => {
      const occasionMatch = dress.style === occasion
      const seasonMatch = !season || dress.season === season || dress.season === 'all-season'

      if (occasionMatch && seasonMatch) {
        const combination = [dress]

        // Add accessories or outerwear
        const accessories = organizedClothing['accessories']?.find(item =>
          calculateColorCompatibility(item.color, dress.color) > 0
        )
        if (accessories) {
          combination.push(accessories)
        }

        combinations.push(combination)
      }
    })

    return combinations
  }, [organizedClothing, calculateColorCompatibility, calculateStyleCompatibility])

  // Score an outfit combination
  const scoreOutfit = useCallback((
    outfit: ClothingItem[],
    context: RecommendationContext = {}
  ): number => {
    let score = 0
    // Normalize input to RecommendationContext
    const occasion = 'occasion' in context ? context.occasion : context.occasion || 'casual'
    const season = 'season' in context ? context.season : undefined
    const weather = 'weather' in context ? context.weather : undefined
    const temperature = 'temperature' in context ? context.temperature : undefined

    // Color harmony score
    if (outfit.length >= 2) {
      for (let i = 0; i < outfit.length - 1; i++) {
        score += calculateColorCompatibility(outfit[i].color, outfit[i + 1].color) * 0.3
      }
    }

    // Style consistency score
    const styles = outfit.map(item => item.style)
    const dominantStyle = styles[0]
    const styleConsistency = styles.every(style =>
      calculateStyleCompatibility(dominantStyle, style) > 0
    ) ? 0.25 : 0

    score += styleConsistency

    // Occasion appropriateness
    const occasionMatch = outfit.some(item => item.style === occasion) ? 0.25 : 0
    score += occasionMatch

    // Season appropriateness
    if (season) {
      const seasonMatch = outfit.every(item =>
        item.season === season || item.season === 'all-season'
      ) ? 0.2 : 0
      score += seasonMatch
    }

    return Math.min(score, 1) // Cap at 1.0
  }, [calculateColorCompatibility, calculateStyleCompatibility])

  // Generate AI recommendations
  const generateRecommendations = useCallback(async (
    context: RecommendationContext = {},
    maxRecommendations: number = 5
  ): Promise<AIRecommendation[]> => {
    setIsGenerating(true)

    try {
      // Simulate AI processing delay
      // Try AI Recommendations first
      let aiRecommendations: AIRecommendation[] = []
      try {
        const { getStructuredOutfitRecommendation } = await import('@/lib/ai-client')
        const aiResults = await getStructuredOutfitRecommendation({
          eventName: 'eventName' in context ? (context as any).eventName : undefined, // Typo in type definition vs usage, casting for now or fixing type later
          date: 'date' in context ? (context as any).date : undefined,
          occasion: context.occasion,
          weather: context.weather,
          temperature: context.temperature
        }, clothingItems)

        if (aiResults.length > 0) {
          aiRecommendations = aiResults.map(res => {
            const outfitItems = res.outfitIds
              .map(id => clothingItems.find(item => item.id === id))
              .filter((item): item is ClothingItem => !!item)

            // Re-calculate local score for consistency or trust AI? 
            // Let's trust AI but normalize confidence
            return {
              outfit: outfitItems,
              confidence: 0.95, // High confidence for AI
              reasoning: res.reasoning,
              tags: ['AI Generated', context.occasion || 'versatile', context.season || 'all-season'].filter(Boolean)
            }
          }).filter(rec => rec.outfit.length > 0)
        }
      } catch (e) {
        console.warn('AI recommendation failed, using heuristic', e)
      }

      // If AI returned results, return them immediately (maybe mixed with heuristic?)
      // For now, let's prioritize AI completely if available
      if (aiRecommendations.length > 0) {
        setLastRecommendations(aiRecommendations)
        return aiRecommendations
      }

      // Fallback to Heuristic Engine
      const combinations = generateOutfitCombinations(context)

      // Score and sort combinations
      const scoredCombinations = combinations
        .map(outfit => ({
          outfit,
          score: scoreOutfit(outfit, context)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations)

      // Generate recommendations with reasoning
      const recommendations: AIRecommendation[] = scoredCombinations.map(({ outfit, score }) => {
        let reasoning = 'This outfit combines '

        // Analyze color harmony
        const colors = outfit.map(item => item.color)
        const uniqueColors = [...new Set(colors)]
        if (uniqueColors.length <= 2) {
          reasoning += 'complementary colors '
        } else {
          reasoning += 'a vibrant color palette '
        }

        // Analyze style consistency
        const styles = outfit.map(item => item.style)
        const dominantStyle = styles[0]
        reasoning += `with a ${dominantStyle} aesthetic`

        // Add context-specific reasoning
        if (context.occasion) {
          reasoning += ` perfect for ${context.occasion} occasions`
        }
        if (context.season) {
          reasoning += ` and suitable for ${context.season} weather`
        }

        return {
          outfit,
          confidence: score,
          reasoning,
          tags: [
            dominantStyle,
            ...uniqueColors,
            context.occasion || 'versatile',
            context.season || 'all-season'
          ].filter(Boolean)
        }
      })

      setLastRecommendations(recommendations)
      return recommendations
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [generateOutfitCombinations, scoreOutfit, clothingItems])

  // Get quick recommendations based on a specific item
  const getRecommendationsForItem = useCallback(async (
    item: ClothingItem,
    maxRecommendations: number = 3
  ): Promise<AIRecommendation[]> => {
    const context: RecommendationContext = {
      occasion: item.style as any,
      season: item.season === 'all-season' ? undefined : item.season as any,
      colorPreference: item.color
    }

    return generateRecommendations(context, maxRecommendations)
  }, [generateRecommendations])

  // Get trending combinations (most commonly worn together)
  const getTrendingCombinations = useCallback((): ClothingItem[][] => {
    // Simple implementation: return most color-coordinated combinations
    const combinations = generateOutfitCombinations()
    return combinations
      .sort((a, b) => scoreOutfit(b) - scoreOutfit(a))
      .slice(0, 3)
  }, [generateOutfitCombinations, scoreOutfit])

  return {
    generateRecommendations,
    getRecommendationsForItem,
    getTrendingCombinations,
    lastRecommendations,
    isGenerating,
    scoreOutfit
  }
}