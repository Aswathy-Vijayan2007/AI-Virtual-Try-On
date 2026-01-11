import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronRight, X, Cloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getScheduledOutfits, deleteOutfit } from '@/lib/database'
import type { OutfitCombination } from '@/types'
import { cn } from '@/lib/utils'

interface OutfitCalendarProps {
    onSelectOutfit: (outfit: OutfitCombination) => void
    onUpdate: () => void
    lastUpdate: number // trigger re-fetch
    className?: string
}

export const OutfitCalendar: React.FC<OutfitCalendarProps> = ({
    onSelectOutfit,
    onUpdate,
    lastUpdate,
    className
}) => {
    const [scheduledOutfits, setScheduledOutfits] = useState<OutfitCombination[]>([])

    useEffect(() => {
        const fetchOutfits = async () => {
            // Get outfits for next 30 days
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            const end = new Date()
            end.setDate(end.getDate() + 30)

            const outfits = await getScheduledOutfits(start, end)
            // Sort by date
            outfits.sort((a, b) => {
                if (!a.scheduledDate || !b.scheduledDate) return 0
                return a.scheduledDate.getTime() - b.scheduledDate.getTime()
            })

            setScheduledOutfits(outfits)
        }

        fetchOutfits()
    }, [lastUpdate])

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Remove this outfit from your schedule?')) {
            await deleteOutfit(id)
            onUpdate()
        }
    }

    // Group by date
    const groupedOutfits = scheduledOutfits.reduce((groups, outfit) => {
        if (!outfit.scheduledDate) return groups
        const dateStr = outfit.scheduledDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        })

        if (!groups[dateStr]) {
            groups[dateStr] = []
        }
        groups[dateStr].push(outfit)
        return groups
    }, {} as Record<string, OutfitCombination[]>)

    return (
        <div className={cn('space-y-6', className)}>
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Upcoming Schedule
            </h2>

            {Object.keys(groupedOutfits).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No scheduled outfits yet.</p>
                    <p className="text-sm text-gray-400">Use the AI Stylist to generate and schedule looks!</p>
                </div>
            ) : (
                Object.entries(groupedOutfits).map(([date, outfits]) => (
                    <div key={date} className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-white py-2 z-10">
                            {date}
                        </h3>

                        {outfits.map(outfit => (
                            <Card
                                key={outfit.id}
                                className="hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => onSelectOutfit(outfit)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    {/* Items Preview */}
                                    <div className="flex -space-x-4">
                                        {outfit.items.slice(0, 3).map((item, i) => (
                                            <div
                                                key={i}
                                                className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative z-0"
                                            >
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                        {outfit.items.length > 3 && (
                                            <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 relative z-10">
                                                +{outfit.items.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-gray-900 truncate">
                                                {outfit.name || 'Outfit'}
                                            </h4>
                                            {outfit.occasion && (
                                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full capitalize">
                                                    {outfit.occasion}
                                                </span>
                                            )}
                                        </div>
                                        {outfit.weather && (
                                            <p className="text-xs text-gray-500 mt-1 capitalize flex items-center gap-1">
                                                <Cloud className="w-3 h-3" />
                                                {outfit.weather}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => handleDelete(outfit.id, e)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ))
            )}
        </div>
    )
}
