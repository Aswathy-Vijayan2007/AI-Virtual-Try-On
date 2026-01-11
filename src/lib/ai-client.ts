import { ClothingItem } from '@/types'

const API_KEY = import.meta.env.VITE_GROK_API_KEY
// Default to xAI, but adaptable for Groq if the user changes the base URL
const BASE_URL = import.meta.env.DEV
    ? '/api/groq'
    : (import.meta.env.VITE_AI_BASE_URL || 'https://api.x.ai/v1')

// HARDCODED: Using the latest supported Groq model
const MODEL = 'llama-3.3-70b-versatile'

export interface ChatRequest {
    messages: { role: string; content: string }[]
    wardrobeContext?: ClothingItem[]
}

export async function sendChatMessage(request: ChatRequest) {
    if (!API_KEY) {
        // Mock response if no key is provided (for testing/demo)
        return new Promise<{ role: string; content: string }>((resolve) => {
            setTimeout(() => {
                resolve({
                    role: 'assistant',
                    content: "I'm currently in demo mode because no API Key was found. Once configured with xAI's Grok (or compatible API), I can help you pick outfits based on your actual wardrobe!"
                })
            }, 1000)
        })
    }

    // Construct system prompt with wardrobe context
    let systemPrompt = "You are an expert AI Fashion Stylist using the Grok model. Your goal is to help the user look their best."

    if (request.wardrobeContext && request.wardrobeContext.length > 0) {
        const itemsList = request.wardrobeContext.map(item =>
            `- ${item.color} ${item.style} ${item.type} (${item.name})`
        ).join('\n')

        systemPrompt += `\n\nThe user has the following items in their wardrobe:\n${itemsList}\n\nSuggest outfits using ONLY these items when possible, or suggest generic items if they lack something essential.`
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...request.messages
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                temperature: 0.7
            }),
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            let errorDetails = response.statusText;
            try {
                const errorJson = await response.json();
                if (errorJson.error && errorJson.error.message) {
                    errorDetails = errorJson.error.message;
                } else {
                    errorDetails = JSON.stringify(errorJson);
                }
            } catch (e) {
                // Ignore json parse error, just use statusText
            }
            throw new Error(`API Error: ${response.status} ${errorDetails}`)
        }

        const data = await response.json()
        return data.choices[0].message
    } catch (error) {
        console.error('AI Chat Error:', error)
        throw error
    }
}

export async function getStructuredOutfitRecommendation(
    context: {
        eventName?: string
        date?: Date
        occasion?: string
        weather?: string
        temperature?: number
    },
    wardrobe: ClothingItem[]
): Promise<{ outfitIds: string[]; reasoning: string }[]> {
    if (!API_KEY) {
        // Fallback if no API key is present: return empty array so heuristic engine takes over
        return []
    }

    const itemsList = wardrobe.map(item =>
        `- ID: ${item.id}, Type: ${item.type}, Style: ${item.style}, Color: ${item.color}, Name: ${item.name}, Season: ${item.season}`
    ).join('\n')

    const prompt = `
    You are an expert fashion stylist. Based on the user's wardrobe and the event details below, act as a Recommendation Engine.
    
    Event: ${context.eventName || 'General'}
    Occasion: ${context.occasion || 'Any'}
    Weather: ${context.weather || 'Unknown'}
    Temperature: ${context.temperature ? context.temperature + '°C' : 'Unknown'}

    User's Wardrobe:
    ${itemsList}

    Task:
    Create up to 3 complete outfits (Top+Bottom or Dress, plus optional Outerwear/Accessories).
    
    CRITICAL: You must ONLY use the Item IDs provided in the list above. Do not invent items.
    
    Return the response as a valid JSON array of objects with the following structure:
    [
      {
        "outfitIds": ["id1", "id2"],
        "reasoning": "Why this outfit works..."
      }
    ]
    Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.
  `

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.5
            }),
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) return []

        const data = await response.json()
        const content = data.choices[0].message.content

        // Clean up content if it contains markdown code blocks
        const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            return JSON.parse(cleanedContent)
        } catch (e) {
            console.error('Failed to parse AI JSON response', e)
            return []
        }

    } catch (error) {
        console.warn('AI Structured Recs failed, falling back to heuristic', error)
        return []
    }
}
