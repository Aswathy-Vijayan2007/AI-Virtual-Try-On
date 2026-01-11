import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ClothingItem, OutfitCombination } from '@/types'

interface WardrobeDB extends DBSchema {
  clothing: {
    key: string
    value: ClothingItem
    indexes: {
      'by-type': string
      'by-style': string
      'by-color': string
      'by-season': string
    }
  }
  outfits: {
    key: string
    value: OutfitCombination
  }
}

let db: IDBPDatabase<WardrobeDB>

export async function initDB(): Promise<IDBPDatabase<WardrobeDB>> {
  if (db) return db

  db = await openDB<WardrobeDB>('wardrobe-db', 1, {
    upgrade(database) {
      // Create clothing store
      const clothingStore = database.createObjectStore('clothing', {
        keyPath: 'id'
      })

      clothingStore.createIndex('by-type', 'type')
      clothingStore.createIndex('by-style', 'style')
      clothingStore.createIndex('by-color', 'color')
      clothingStore.createIndex('by-season', 'season')

      // Create outfits store
      const outfitStore = database.createObjectStore('outfits', {
        keyPath: 'id'
      })
      outfitStore.createIndex('by-date', 'scheduledDate')
    }
  })

  return db
}

export async function addClothingItem(item: ClothingItem): Promise<void> {
  const database = await initDB()
  await database.add('clothing', item)
}

export async function getClothingItems(): Promise<ClothingItem[]> {
  const database = await initDB()
  return database.getAll('clothing')
}

export async function getClothingItemsByType(type: string): Promise<ClothingItem[]> {
  const database = await initDB()
  return database.getAllFromIndex('clothing', 'by-type', type)
}

export async function updateClothingItem(item: ClothingItem): Promise<void> {
  const database = await initDB()
  await database.put('clothing', item)
}

export async function deleteClothingItem(id: string): Promise<void> {
  const database = await initDB()
  await database.delete('clothing', id)
}

export async function addOutfit(outfit: OutfitCombination): Promise<void> {
  const database = await initDB()
  await database.add('outfits', outfit)
}

export async function getOutfits(): Promise<OutfitCombination[]> {
  const database = await initDB()
  return database.getAll('outfits')
}

export async function getScheduledOutfits(startDate: Date, endDate: Date): Promise<OutfitCombination[]> {
  const database = await initDB()
  const allOutfits = await database.getAll('outfits')
  return allOutfits.filter(outfit =>
    outfit.scheduledDate &&
    outfit.scheduledDate >= startDate &&
    outfit.scheduledDate <= endDate
  )
}

export async function deleteOutfit(id: string): Promise<void> {
  const database = await initDB()
  await database.delete('outfits', id)
}

export async function clearAllData(): Promise<void> {
  const database = await initDB()
  const tx = database.transaction(['clothing', 'outfits'], 'readwrite')
  await Promise.all([
    tx.objectStore('clothing').clear(),
    tx.objectStore('outfits').clear()
  ])
  await tx.done
}