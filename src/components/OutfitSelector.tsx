import React, { useState, useCallback } from 'react'
import { Shuffle, Heart, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useWardrobeManager } from '@/hooks/useWardrobeManager'
import { cn } from '@/lib/utils'
import type { ClothingItem } from '@/types'

interface OutfitSelectorProps {
  selectedOutfit: ClothingItem[]
  onOutfitChange: (outfit: ClothingItem[]) => void
  className?: string
}

export const OutfitSelector = React.memo<OutfitSelectorProps>(({
  selectedOutfit,
  onOutfitChange,
  className
}) => {
  const { clothingItems, getFilteredItems } = useWardrobeManager()
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Categories for outfit building
  const categories = [
    { id: 'all', label: 'All', count: selectedOutfit.length },
    { id: 'top', label: 'Tops', count: selectedOutfit.filter(item => item.type === 'top').length },
    { id: 'bottom', label: 'Bottoms', count: selectedOutfit.filter(item => item.type === 'bottom').length },
    { id: 'dress', label: 'Dresses', count: selectedOutfit.filter(item => item.type === 'dress').length },
    { id: 'outerwear', label: 'Outerwear', count: selectedOutfit.filter(item => item.type === 'outerwear').length },
    { id: 'accessories', label: 'Accessories', count: selectedOutfit.filter(item => item.type === 'accessories').length }
  ]

  // Generate random outfit
  const generateRandomOutfit = useCallback(() => {
    const tops = getFilteredItems({ type: 'top' })
    const bottoms = getFilteredItems({ type: 'bottom' })
    const dresses = getFilteredItems({ type: 'dress' })
    
    const randomOutfit: ClothingItem[] = []

    // 50% chance for dress-based outfit, 50% for top+bottom
    if (dresses.length > 0 && Math.random() > 0.5) {
      // Dress-based outfit
      const randomDress = dresses[Math.floor(Math.random() * dresses.length)]
      randomOutfit.push(randomDress)
      
      // Maybe add outerwear
      const outerwear = getFilteredItems({ type: 'outerwear' })
      if (outerwear.length > 0 && Math.random() > 0.7) {
        const randomOuterwear = outerwear[Math.floor(Math.random() * outerwear.length)]
        randomOutfit.push(randomOuterwear)
      }
    } else if (tops.length > 0 && bottoms.length > 0) {
      // Top + bottom outfit
      const randomTop = tops[Math.floor(Math.random() * tops.length)]
      const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)]
      randomOutfit.push(randomTop, randomBottom)
      
      // Maybe add outerwear
      const outerwear = getFilteredItems({ type: 'outerwear' })
      if (outerwear.length > 0 && Math.random() > 0.6) {
        const randomOuterwear = outerwear[Math.floor(Math.random() * outerwear.length)]
        randomOutfit.push(randomOuterwear)
      }
    }

    // Maybe add accessories
    const accessories = getFilteredItems({ type: 'accessories' })
    if (accessories.length > 0 && Math.random() > 0.5) {
      const randomAccessory = accessories[Math.floor(Math.random() * accessories.length)]
      randomOutfit.push(randomAccessory)
    }

    onOutfitChange(randomOutfit)
  }, [getFilteredItems, onOutfitChange])

  // Remove item from outfit
  const removeFromOutfit = useCallback((itemId: string) => {
    onOutfitChange(selectedOutfit.filter(item => item.id !== itemId))
  }, [selectedOutfit, onOutfitChange])

  // Clear entire outfit
  const clearOutfit = useCallback(() => {
    onOutfitChange([])
  }, [onOutfitChange])

  // Get available items for current category
  const getAvailableItems = useCallback(() => {
    if (activeCategory === 'all') {
      return clothingItems.filter(item => !selectedOutfit.some(selected => selected.id === item.id))
    }
    return getFilteredItems({ type: activeCategory }).filter(item => 
      !selectedOutfit.some(selected => selected.id === item.id)
    )
  }, [activeCategory, clothingItems, selectedOutfit, getFilteredItems])

  const availableItems = getAvailableItems()

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Build Outfit
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={generateRandomOutfit}
              size="sm"
              variant="outline"
              disabled={clothingItems.length < 2}
            >
              <Shuffle className="w-4 h-4" />
              Random
            </Button>
            <Button
              onClick={clearOutfit}
              size="sm"
              variant="ghost"
              disabled={selectedOutfit.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.label}
              {category.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {category.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Current Outfit */}
      {selectedOutfit.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Current Outfit ({selectedOutfit.length} items)
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {selectedOutfit.map(item => (
              <div key={item.id} className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border-2 border-primary-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFromOutfit(item.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate w-20" title={item.name}>
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Items */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {availableItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {clothingItems.length === 0 ? (
              <>
                <p className="mb-2">No clothing items available</p>
                <p className="text-sm">Add items to your wardrobe to start building outfits</p>
              </>
            ) : selectedOutfit.length === clothingItems.length ? (
              <p>All items are already in your outfit!</p>
            ) : (
              <p>No {activeCategory === 'all' ? '' : activeCategory} items available</p>
            )}
          </div>
        ) : (
          <>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Available {activeCategory === 'all' ? 'Items' : categories.find(c => c.id === activeCategory)?.label}
              <span className="ml-1 text-gray-500">({availableItems.length})</span>
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableItems.map(item => (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                  onClick={() => {
                    // Check for conflicting items (e.g., don't allow multiple tops)
                    if (item.type === 'dress' && selectedOutfit.some(selected => selected.type === 'top' || selected.type === 'bottom')) {
                      // Remove tops and bottoms when adding dress
                      const filteredOutfit = selectedOutfit.filter(selected => 
                        selected.type !== 'top' && selected.type !== 'bottom'
                      )
                      onOutfitChange([...filteredOutfit, item])
                    } else if ((item.type === 'top' || item.type === 'bottom') && selectedOutfit.some(selected => selected.type === 'dress')) {
                      // Remove dress when adding top or bottom
                      const filteredOutfit = selectedOutfit.filter(selected => selected.type !== 'dress')
                      onOutfitChange([...filteredOutfit, item])
                    } else if (item.type === 'top' && selectedOutfit.some(selected => selected.type === 'top')) {
                      // Replace existing top
                      const filteredOutfit = selectedOutfit.filter(selected => selected.type !== 'top')
                      onOutfitChange([...filteredOutfit, item])
                    } else if (item.type === 'bottom' && selectedOutfit.some(selected => selected.type === 'bottom')) {
                      // Replace existing bottom
                      const filteredOutfit = selectedOutfit.filter(selected => selected.type !== 'bottom')
                      onOutfitChange([...filteredOutfit, item])
                    } else {
                      // Add item normally
                      onOutfitChange([...selectedOutfit, item])
                    }
                  }}
                >
                  <div className="aspect-square relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    
                    {/* Item type indicator */}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                      {item.type}
                    </div>
                  </div>
                  
                  <CardContent className="p-2">
                    <p className="text-xs font-medium text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 capitalize">
                        {item.style}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Outfit Actions */}
      {selectedOutfit.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled // TODO: Implement save outfit functionality
            >
              <Save className="w-4 h-4" />
              Save Outfit
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
      )}
    </div>
  )
})

OutfitSelector.displayName = 'OutfitSelector'