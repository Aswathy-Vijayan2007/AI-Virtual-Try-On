import React, { useState, useCallback } from 'react'
import { Upload, Plus, Search, Filter, Trash2, Edit, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useWardrobeManager } from '@/hooks/useWardrobeManager'
import { validateImageFile } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ClothingItem } from '@/types'

interface WardrobePanelProps {
  selectedItems?: ClothingItem[]
  onItemSelect?: (item: ClothingItem) => void
  onItemDeselect?: (itemId: string) => void
  className?: string
}

interface ClothingItemFormData {
  name: string
  type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessories'
  style: 'casual' | 'formal' | 'sporty' | 'party' | 'business'
  color: string
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season'
  tags: string[]
}

const CLOTHING_TYPES = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'dress', label: 'Dress' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'accessories', label: 'Accessories' }
]

const CLOTHING_STYLES = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'sporty', label: 'Sporty' },
  { value: 'party', label: 'Party' },
  { value: 'business', label: 'Business' }
]

const SEASONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'all-season', label: 'All Season' }
]

const COMMON_COLORS = [
  '#000000', '#ffffff', '#808080', '#ff0000', '#0000ff',
  '#008000', '#ffff00', '#ffc0cb', '#800080', '#a52a2a'
]

export const WardrobePanel = React.memo<WardrobePanelProps>(({
  selectedItems = [],
  onItemSelect,
  onItemDeselect,
  className
}) => {
  const {
    clothingItems,
    isLoading,
    error,
    isUploading,
    uploadClothingItem,
    updateClothingItem,
    deleteClothingItem,
    getFilteredItems
  } = useWardrobeManager()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<{
    type?: string
    style?: string
    season?: string
  }>({})

  // Form state
  const [formData, setFormData] = useState<ClothingItemFormData>({
    name: '',
    type: 'top',
    style: 'casual',
    color: '#000000',
    season: 'all-season',
    tags: []
  })
  const [tagInput, setTagInput] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Handle file upload
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const error = validateImageFile(file)
    if (error) {
      setFormErrors({ file: error })
      return
    }

    setSelectedFile(file)
    setFormErrors({})
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedFile && !editingItem) {
      setFormErrors({ file: 'Please select an image file' })
      return
    }

    if (!formData.name.trim()) {
      setFormErrors({ name: 'Please enter a name for the clothing item' })
      return
    }

    try {
      setFormErrors({})

      if (editingItem) {
        // Update existing item
        await updateClothingItem(editingItem.id, {
          name: formData.name.trim(),
          type: formData.type,
          style: formData.style,
          color: formData.color,
          season: formData.season,
          tags: formData.tags
        })
      } else if (selectedFile) {
        // Create new item
        await uploadClothingItem(selectedFile, {
          name: formData.name.trim(),
          type: formData.type,
          style: formData.style,
          color: formData.color,
          season: formData.season,
          tags: formData.tags
        })
      }

      // Reset form
      setFormData({
        name: '',
        type: 'top',
        style: 'casual',
        color: '#000000',
        season: 'all-season',
        tags: []
      })
      setSelectedFile(null)
      setTagInput('')
      setIsAddModalOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Failed to save clothing item:', error)
      setFormErrors({ submit: 'Failed to save clothing item. Please try again.' })
    }
  }, [formData, selectedFile, editingItem, uploadClothingItem, updateClothingItem])

  // Handle tag addition
  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }, [tagInput, formData.tags])

  // Handle tag removal
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Handle item selection
  const handleItemClick = useCallback((item: ClothingItem) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id)

    if (isSelected) {
      onItemDeselect?.(item.id)
    } else {
      onItemSelect?.(item)
    }
  }, [selectedItems, onItemSelect, onItemDeselect])

  // Handle item editing
  const handleEditItem = useCallback((item: ClothingItem, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingItem(item)
    setFormData({
      name: item.name,
      type: item.type,
      style: item.style,
      color: item.color,
      season: item.season,
      tags: item.tags
    })
    setIsAddModalOpen(true)
  }, [])

  // Handle item deletion
  const handleDeleteItem = useCallback(async (item: ClothingItem, event: React.MouseEvent) => {
    event.stopPropagation()

    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteClothingItem(item.id)
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }, [deleteClothingItem])

  // Get filtered items
  const filteredItems = getFilteredItems({
    ...activeFilter,
    search: searchQuery
  })

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            My Wardrobe
          </h2>
          <Button
            onClick={() => {
              setEditingItem(null)
              setFormData({
                name: '',
                type: 'top',
                style: 'casual',
                color: '#000000',
                season: 'all-season',
                tags: []
              })
              setSelectedFile(null)
              setIsAddModalOpen(true)
            }}
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search your wardrobe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={Object.keys(activeFilter).length === 0 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter({})}
          >
            All
          </Button>
          {CLOTHING_TYPES.map(type => (
            <Button
              key={type.value}
              variant={activeFilter.type === type.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter({ type: type.value })}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Loading wardrobe..." />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            Error loading wardrobe: {error.message}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {clothingItems.length === 0 ? (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">Your wardrobe is empty</p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    variant="outline"
                  >
                    Add Your First Item
                  </Button>
                  <Button
                    onClick={async () => {
                      const { seedWardrobe } = await import('@/lib/seedData')
                      await seedWardrobe()
                      // Trigger refresh (might need a better way if hook doesn't auto-refresh, generally hooks using swr/react-query do, but here it might be manual IDB)
                      window.location.reload() // Simple brute force refresh for now as the hook might not verify external DB changes
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                  >
                    Add Demo Wardrobe
                  </Button>
                </div>
              </>
            ) : (
              <p>No items match your search criteria</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.some(selected => selected.id === item.id)

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:shadow-lg',
                    isSelected && 'ring-2 ring-primary-500 shadow-lg'
                  )}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="relative aspect-square">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleEditItem(item, e)}
                        className="p-1 bg-white/90"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => handleDeleteItem(item, e)}
                        className="p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{item.type}</span>
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingItem(null)
          setSelectedFile(null)
          setFormErrors({})
        }}
        title={editingItem ? 'Edit Clothing Item' : 'Add Clothing Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload (only for new items) */}
          {!editingItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'Choose an image file'}
                  </span>
                </label>
              </div>
              {formErrors.file && (
                <p className="mt-1 text-sm text-red-600">{formErrors.file}</p>
              )}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Blue Denim Jacket"
              error={formErrors.name}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="input"
                required
              >
                {CLOTHING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Style
              </label>
              <select
                value={formData.style}
                onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value as any }))}
                className="input"
                required
              >
                {CLOTHING_STYLES.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Season
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value as any }))}
                className="input"
                required
              >
                {SEASONS.map(season => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
              />
              <div className="flex gap-2">
                {COMMON_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={cn(
                      'w-8 h-8 rounded border-2 cursor-pointer',
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                variant="outline"
              >
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Errors */}
          {formErrors.submit && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {formErrors.submit}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isUploading}
              loadingText={editingItem ? 'Updating...' : 'Adding...'}
              className="flex-1"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
})

WardrobePanel.displayName = 'WardrobePanel'