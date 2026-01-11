import React, { useState, useEffect, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Shirt, Camera, Sparkles, Menu, X, Calendar as CalendarIcon } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Button } from '@/components/ui/Button'
import { WebcamPreview } from '@/components/WebcamPreview'
import { WardrobePanel } from '@/components/WardrobePanel'
import { OutfitSelector } from '@/components/OutfitSelector'
import { RecommendationCarousel } from '@/components/RecommendationCarousel'
import { AIStylistPanel } from '@/components/Stylist/AIStylistPanel'
import { AIChatPanel } from '@/components/Stylist/AIChatPanel'
import { OutfitCalendar } from '@/components/Stylist/OutfitCalendar'
import { OnboardingModal } from '@/components/OnboardingModal'
import { addOutfit } from '@/lib/database'
import { cn } from '@/lib/utils'
import type { ClothingItem, Pose, AIRecommendation } from '@/types'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    }
  }
})

type ActiveView = 'tryon' | 'wardrobe' | 'outfits' | 'recommendations' | 'stylist'

function AppContent() {
  const [activeView, setActiveView] = useState<ActiveView>('tryon')
  const [selectedOutfit, setSelectedOutfit] = useState<ClothingItem[]>([])
  const [currentPoses, setCurrentPoses] = useState<Pose[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if this is the user's first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setShowOnboarding(false)
  }, [])

  // Handle outfit selection from recommendations
  const handleRecommendationSelect = useCallback((recommendation: AIRecommendation) => {
    setSelectedOutfit(recommendation.outfit)
    setActiveView('tryon')
  }, [])

  // Handle item selection from wardrobe
  const handleItemSelect = useCallback((item: ClothingItem) => {
    setSelectedOutfit(prev => [...prev, item])
  }, [])

  // Handle item deselection
  const handleItemDeselect = useCallback((itemId: string) => {
    setSelectedOutfit(prev => prev.filter(item => item.id !== itemId))
  }, [])

  // Handle pose detection results
  const handlePoseDetected = useCallback((poses: Pose[]) => {
    setCurrentPoses(poses)
  }, [])

  // Navigation items
  const navigationItems = [
    { id: 'tryon' as const, label: 'Virtual Try-On', icon: Camera },
    { id: 'wardrobe' as const, label: 'Wardrobe', icon: Shirt },
    { id: 'outfits' as const, label: 'Build Outfit', icon: Menu },
    { id: 'recommendations' as const, label: 'AI Suggestions', icon: Sparkles },
    { id: 'stylist' as const, label: 'Stylist & Schedule', icon: CalendarIcon }
  ]

  // Add mandatory iframe logging
  useEffect(() => {
    ["log", "warn", "error"].forEach((level) => {
      const original = console[level as keyof Console] as (...args: any[]) => void;

      (console as any)[level] = (...args: any[]) => {
        // keep normal console output
        original.apply(console, args);

        // sanitize args for postMessage
        const safeArgs = args.map((a) => {
          if (a instanceof Error) {
            return {
              message: a.message,
              stack: a.stack,
              name: a.name,
            };
          }
          try {
            JSON.stringify(a);
            return a;
          } catch {
            return String(a);
          }
        });

        try {
          window.parent?.postMessage(
            { type: "iframe-console", level, args: safeArgs },
            "*"
          );
        } catch (e) {
          // use original, not the wrapped one (avoid recursion)
          original("Failed to postMessage:", e);
        }
      };
    });

    // Global error handler
    window.onerror = (msg, url, line, col, error) => {
      window.parent?.postMessage(
        {
          type: "iframe-console",
          level: "error",
          args: [
            msg,
            url,
            line,
            col,
            error ? { message: error.message, stack: error.stack } : null,
          ],
        },
        "*"
      );
    };

    // Unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const reason =
        event.reason instanceof Error
          ? { message: event.reason.message, stack: event.reason.stack }
          : event.reason;

      window.parent?.postMessage(
        {
          type: "iframe-console",
          level: "error",
          args: ["Unhandled Promise Rejection:", reason],
        },
        "*"
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              AI Virtual Try-On
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map(item => (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isSidebarOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col gap-2">
              {navigationItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveView(item.id)
                    setIsSidebarOpen(false)
                  }}
                  className="justify-start"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Primary Content Area */}
        <div className="flex-1 flex flex-col">
          {activeView === 'tryon' && (
            <div className="flex-1 p-4">
              <div className="max-w-4xl mx-auto h-full">
                <div className="grid lg:grid-cols-3 gap-6 h-full">
                  {/* Webcam Preview */}
                  <div className="lg:col-span-2">
                    <div className="h-full min-h-[400px] lg:min-h-[600px]">
                      <WebcamPreview
                        selectedOutfit={selectedOutfit}
                        onPoseDetected={handlePoseDetected}
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Current Outfit & Quick Actions */}
                  <div className="space-y-6">
                    {/* Current Outfit */}
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Current Outfit
                      </h3>
                      {selectedOutfit.length === 0 ? (
                        <div className="text-center py-8">
                          <Shirt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">No outfit selected</p>
                          <div className="space-y-2">
                            <Button
                              onClick={() => setActiveView('outfits')}
                              size="sm"
                              className="w-full"
                            >
                              Build Outfit
                            </Button>
                            <Button
                              onClick={() => setActiveView('recommendations')}
                              size="sm"
                              variant="outline"
                              className="w-full"
                            >
                              Get AI Suggestions
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedOutfit.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {item.type} • {item.style}
                                </p>
                              </div>
                              <button
                                onClick={() => handleItemDeselect(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <Button
                            onClick={() => setSelectedOutfit([])}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            Clear Outfit
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Quick Recommendations */}
                    <RecommendationCarousel
                      onOutfitSelect={handleRecommendationSelect}
                      className="lg:max-h-96"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'wardrobe' && (
            <div className="flex-1 p-4">
              <div className="max-w-6xl mx-auto h-full">
                <WardrobePanel
                  selectedItems={selectedOutfit}
                  onItemSelect={handleItemSelect}
                  onItemDeselect={handleItemDeselect}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {activeView === 'outfits' && (
            <div className="flex-1 p-4">
              <div className="max-w-6xl mx-auto h-full">
                <OutfitSelector
                  selectedOutfit={selectedOutfit}
                  onOutfitChange={setSelectedOutfit}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {activeView === 'recommendations' && (
            <div className="flex-1 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    AI Suggestions
                  </h2>
                  <p className="text-gray-600">
                    Get personalized outfit suggestions based on your wardrobe and style preferences
                  </p>
                </div>
                <RecommendationCarousel
                  onOutfitSelect={handleRecommendationSelect}
                />
              </div>
            </div>
          )}

          {activeView === 'stylist' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-6xl mx-auto space-y-8 pb-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">Advanced Stylist</h2>
                  <p className="text-gray-600 mb-6">Plan your looks with intelligent recommendations based on your schedule and weather.</p>
                  <AIStylistPanel
                    onSelectOutfit={(outfit) => {
                      setSelectedOutfit(outfit)
                      setActiveView('tryon')
                    }}
                    onSaveToSchedule={async (items, date, eventName) => {
                      try {
                        await addOutfit({
                          id: crypto.randomUUID(),
                          name: eventName || 'Scheduled Outfit',
                          items,
                          createdAt: new Date(),
                          isFavorite: false,
                          scheduledDate: date,
                          eventId: crypto.randomUUID(),
                          occasion: 'casual',
                          weather: 'sunny'
                        })
                        alert('Outfit scheduled!')
                      } catch (e) {
                        console.error('Failed to schedule', e)
                      }
                    }}
                  />
                </section>

                <section className="border-t pt-8">
                  <h2 className="text-2xl font-bold mb-4">Chat with Stylist</h2>
                  <AIChatPanel />
                </section>

                <section className="border-t pt-8">
                  <OutfitCalendar
                    onSelectOutfit={(outfit) => {
                      setSelectedOutfit(outfit.items)
                      setActiveView('tryon')
                    }}
                    onUpdate={() => { }}
                    lastUpdate={Date.now()}
                  />
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App