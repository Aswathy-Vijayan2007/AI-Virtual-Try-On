import { addClothingItem } from './database'
import type { ClothingItem } from '@/types'

const DEMO_ITEMS: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Classic White T-Shirt',
        type: 'top',
        style: 'casual',
        color: '#ffffff',
        season: 'all-season',
        tags: ['basic', 'essential'],
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Blue Denim Jeans',
        type: 'bottom',
        style: 'casual',
        color: '#0000ff',
        season: 'all-season',
        tags: ['denim', 'comfortable'],
        image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Black Blazer',
        type: 'outerwear',
        style: 'business',
        color: '#000000',
        season: 'all-season',
        tags: ['formal', 'work'],
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Floral Summer Dress',
        type: 'dress',
        style: 'casual',
        color: '#ffc0cb',
        season: 'summer',
        tags: ['floral', 'light'],
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Grey Hoodie',
        type: 'top',
        style: 'sporty',
        color: '#808080',
        season: 'fall',
        tags: ['warm', 'comfy'],
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Beige Chinos',
        type: 'bottom',
        style: 'formal',
        color: '#f5f5dc',
        season: 'all-season',
        tags: ['smart', 'versatile'],
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Red Party Dress',
        type: 'dress',
        style: 'party',
        color: '#ff0000',
        season: 'all-season',
        tags: ['elegant', 'night-out'],
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Winter Coat',
        type: 'outerwear',
        style: 'casual',
        color: '#8b4513',
        season: 'winter',
        tags: ['warm', 'heavy'],
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Running Shorts',
        type: 'bottom',
        style: 'sporty',
        color: '#000000',
        season: 'summer',
        tags: ['active', 'gym'],
        image: 'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?w=500&auto=format&fit=crop&q=60'
    },
    {
        name: 'Silk Scarf',
        type: 'accessories',
        style: 'formal',
        color: '#ffd700',
        season: 'all-season',
        tags: ['accessory', 'highlight'],
        image: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=500&auto=format&fit=crop&q=60'
    }
]

export async function seedWardrobe(): Promise<void> {
    const promises = DEMO_ITEMS.map(item => {
        return addClothingItem({
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
        })
    })

    await Promise.all(promises)
}
