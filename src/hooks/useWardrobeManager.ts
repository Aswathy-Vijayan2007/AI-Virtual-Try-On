import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClothingItem, WardrobeStats } from '@/types'
import { generateId, getImageDataUrl, resizeImage } from '@/lib/utils'
import * as db from '@/lib/database'

export function useWardrobeManager() {
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)

  // Fetch all clothing items
  const {
    data: clothingItems = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['clothing-items'],
    queryFn: db.getClothingItems,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  // Add clothing item mutation
  const addClothingMutation = useMutation({
    mutationFn: db.addClothingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-items'] })
    }
  })

  // Update clothing item mutation
  const updateClothingMutation = useMutation({
    mutationFn: db.updateClothingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-items'] })
    }
  })

  // Delete clothing item mutation
  const deleteClothingMutation = useMutation({
    mutationFn: db.deleteClothingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clothing-items'] })
    }
  })

  // Upload and add clothing item
  const uploadClothingItem = useCallback(async (
    file: File,
    metadata: Omit<ClothingItem, 'id' | 'image' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      setIsUploading(true)

      // Convert file to data URL
      const imageDataUrl = await getImageDataUrl(file)
      
      // Resize image for storage efficiency
      const resizedImage = await resizeImage(imageDataUrl, 800, 800, 0.8)

      const clothingItem: ClothingItem = {
        ...metadata,
        id: generateId(),
        image: resizedImage,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await addClothingMutation.mutateAsync(clothingItem)
      return clothingItem
    } catch (error) {
      console.error('Failed to upload clothing item:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [addClothingMutation])

  // Update clothing item
  const updateClothingItem = useCallback(async (
    id: string,
    updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>
  ) => {
    const existingItem = clothingItems.find(item => item.id === id)
    if (!existingItem) {
      throw new Error('Clothing item not found')
    }

    const updatedItem: ClothingItem = {
      ...existingItem,
      ...updates,
      updatedAt: new Date()
    }

    await updateClothingMutation.mutateAsync(updatedItem)
    return updatedItem
  }, [clothingItems, updateClothingMutation])

  // Delete clothing item
  const deleteClothingItem = useCallback(async (id: string) => {
    await deleteClothingMutation.mutateAsync(id)
  }, [deleteClothingMutation])

  // Get clothing items by filters
  const getFilteredItems = useCallback((filters: {
    type?: string
    style?: string
    color?: string
    season?: string
    search?: string
  }) => {
    return clothingItems.filter(item => {
      if (filters.type && item.type !== filters.type) return false
      if (filters.style && item.style !== filters.style) return false
      if (filters.color && item.color !== filters.color) return false
      if (filters.season && item.season !== filters.season && item.season !== 'all-season') return false
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = `${item.name} ${item.tags.join(' ')}`.toLowerCase()
        if (!searchableText.includes(searchTerm)) return false
      }
      return true
    })
  }, [clothingItems])

  // Get wardrobe statistics
  const getWardrobeStats = useCallback((): WardrobeStats => {
    const stats: WardrobeStats = {
      totalItems: clothingItems.length,
      byType: {},
      byStyle: {},
      byColor: {},
      bySeason: {}
    }

    clothingItems.forEach(item => {
      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1
      
      // Count by style
      stats.byStyle[item.style] = (stats.byStyle[item.style] || 0) + 1
      
      // Count by color
      stats.byColor[item.color] = (stats.byColor[item.color] || 0) + 1
      
      // Count by season
      stats.bySeason[item.season] = (stats.bySeason[item.season] || 0) + 1
    })

    return stats
  }, [clothingItems])

  // Get random clothing items for demo
  const getRandomItems = useCallback((count: number = 3): ClothingItem[] => {
    if (clothingItems.length <= count) return clothingItems
    
    const shuffled = [...clothingItems].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }, [clothingItems])

  return {
    // Data
    clothingItems,
    isLoading,
    error,
    isUploading,
    
    // Actions
    uploadClothingItem,
    updateClothingItem,
    deleteClothingItem,
    
    // Utilities
    getFilteredItems,
    getWardrobeStats,
    getRandomItems,
    
    // Mutation states
    isAdding: addClothingMutation.isPending,
    isUpdating: updateClothingMutation.isPending,
    isDeleting: deleteClothingMutation.isPending
  }
}