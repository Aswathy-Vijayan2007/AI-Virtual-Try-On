import React, { useState } from 'react'
import { Calendar as CalendarIcon, Cloud, HelpCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useStylistRecommendations } from '@/hooks/useStylistRecommendations'
import { useWardrobeManager } from '@/hooks/useWardrobeManager'
import type { ClothingItem, StylistInput } from '@/types'
import { cn } from '@/lib/utils'

interface AIStylistPanelProps {
    onSelectOutfit: (outfit: ClothingItem[]) => void
    onSaveToSchedule: (outfit: ClothingItem[], date: Date, eventName?: string) => void
    baseDate?: Date
    className?: string
}

export const AIStylistPanel: React.FC<AIStylistPanelProps> = ({
    onSelectOutfit,
    onSaveToSchedule,
    baseDate = new Date(),
    className
}) => {
    // Input state
    const [eventName, setEventName] = useState('')
    const [date, setDate] = useState<string>(baseDate.toISOString().split('T')[0])
    const [occasion, setOccasion] = useState<string>('casual')
    const [weather, setWeather] = useState<string>('sunny')
    const [temperature, setTemperature] = useState<string>('25')

    const { clothingItems } = useWardrobeManager()
    const {
        generateRecommendations,
        isGenerating,
        lastRecommendations
    } = useStylistRecommendations(clothingItems)

    const handleGenerate = async () => {
        const input: StylistInput = {
            eventName,
            date: new Date(date),
            occasion,
            weather,
            temperature: parseInt(temperature)
        }

        await generateRecommendations(input)
    }

    return (
        <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
            {/* Input Panel */}
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Event Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Event Name</label>
                        <Input
                            placeholder="e.g. Coffee Date, Office"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Occasion</label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                value={occasion}
                                onChange={(e) => setOccasion(e.target.value)}
                            >
                                <option value="casual">Casual</option>
                                <option value="formal">Formal</option>
                                <option value="business">Business</option>
                                <option value="party">Party</option>
                                <option value="sporty">Sporty</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Weather</label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                value={weather}
                                onChange={(e) => setWeather(e.target.value)}
                            >
                                <option value="sunny">Sunny</option>
                                <option value="rainy">Rainy</option>
                                <option value="cloudy">Cloudy</option>
                                <option value="snowy">Snowy</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Temperature (°C)</label>
                        <Input
                            type="number"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full mt-4"
                        onClick={handleGenerate}
                        disabled={isGenerating || clothingItems.length === 0}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Designing...
                            </>
                        ) : (
                            'Generate Outfits'
                        )}
                    </Button>

                    {clothingItems.length === 0 && (
                        <p className="text-xs text-red-500 text-center">
                            Add items to your wardrobe first!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="md:col-span-1 lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Recommended for You</h3>

                {lastRecommendations.length === 0 && !isGenerating ? (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                        <HelpCircle className="w-12 h-12 mb-2" />
                        <p>Enter event details and click Generate to see outfits</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {lastRecommendations.map((rec, index) => (
                            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                                        {rec.outfit.map((item) => (
                                            <div key={item.id} className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-green-600">
                                                {(rec.confidence * 100).toFixed(0)}% Match
                                            </span>
                                            <div className="flex gap-1">
                                                {rec.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 capitalize">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {rec.reasoning}
                                        </p>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => onSelectOutfit(rec.outfit)}
                                            >
                                                Try On
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => onSaveToSchedule(rec.outfit, new Date(date), eventName)}
                                            >
                                                Schedule
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
