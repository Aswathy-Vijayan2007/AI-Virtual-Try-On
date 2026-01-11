export interface ClothingItem {
  id: string;
  name: string;
  image: string; // base64 or blob URL
  type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessories';
  style: 'casual' | 'formal' | 'sporty' | 'party' | 'business';
  color: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Pose {
  keypoints: Keypoint[];
  score: number;
}

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface OutfitCombination {
  id: string;
  name: string;
  items: ClothingItem[];
  createdAt: Date;
  isFavorite: boolean;
  // New fields for AI Stylist & specific events
  eventId?: string;
  scheduledDate?: Date; // If assigned to a calendar slot
  occasion?: string;
  weather?: string;
  notes?: string;
}

export interface ScheduledOutfit extends OutfitCombination {
  scheduledDate: Date; // Required for scheduled items
  status: 'planned' | 'worn' | 'skipped';
}

export interface StylistInput {
  eventName?: string;
  date: Date;
  occasion: string;
  weather?: string;
  temperature?: number; // in Celsius
  notes?: string;
}


export interface RecommendationContext {
  occasion?: 'casual' | 'formal' | 'work' | 'party' | 'date' | 'workout' | string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  weather?: 'sunny' | 'rainy' | 'cold' | 'hot' | string;
  colorPreference?: string;
  temperature?: number;
}

export interface AIRecommendation {
  outfit: ClothingItem[];
  confidence: number;
  reasoning: string;
  tags: string[];
}

export interface WardrobeStats {
  totalItems: number;
  byType: Record<string, number>;
  byStyle: Record<string, number>;
  byColor: Record<string, number>;
  bySeason: Record<string, number>;
}