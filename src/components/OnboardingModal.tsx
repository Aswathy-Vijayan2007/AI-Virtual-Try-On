import React, { useState } from 'react'
import { Camera, Upload, Sparkles, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const steps = [
  {
    id: 1,
    title: 'Welcome to AI Virtual Try-On',
    description: 'Experience the future of fashion with AI-powered virtual try-on technology.',
    icon: Sparkles,
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Privacy-Safe AI Fashion
          </h3>
          <p className="text-gray-600">
            All processing happens locally in your browser. Your images never leave your device, ensuring complete privacy and security.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'Build Your Digital Wardrobe',
    description: 'Upload photos of your clothing items to create a personalized wardrobe.',
    icon: Upload,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Organize Your Style
          </h3>
          <p className="text-gray-600">
            Categorize by type, style, color, and season. Our AI will learn your preferences and suggest perfect combinations.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: 'Virtual Try-On Experience',
    description: 'Use your webcam to see how outfits look on you in real-time.',
    icon: Camera,
    content: (
      <div className="space-y-4">
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Real-time AI pose detection</p>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            See Yourself in Style
          </h3>
          <p className="text-gray-600">
            Advanced AI aligns clothing with your pose and movements for realistic try-on experiences.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: 'AI-Powered Recommendations',
    description: 'Get personalized outfit suggestions based on your wardrobe and style preferences.',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-primary-700">Casual Friday</span>
            </div>
            <div className="h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-accent-700">Date Night</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-green-700">Work Meeting</span>
            </div>
            <div className="h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-orange-700">Weekend Fun</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Smart Style Suggestions
          </h3>
          <p className="text-gray-600">
            Our AI analyzes color harmony, style consistency, and occasion appropriateness to recommend perfect outfits.
          </p>
        </div>
      </div>
    )
  }
]

export const OnboardingModal = React.memo<OnboardingModalProps>(({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete()
    onClose()
    setIsCompleting(false)
    setCurrentStep(0)
  }

  const handleSkip = () => {
    onClose()
    setCurrentStep(0)
  }

  if (!isOpen) return null

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      size="lg"
      className="max-w-2xl"
    >
      <div className="p-6">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] flex flex-col justify-center">
          {step.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            disabled={currentStep === 0}
            className={cn(
              'transition-opacity',
              currentStep === 0 && 'opacity-0 pointer-events-none'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Step Dots */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentStep
                    ? 'bg-primary-500 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            isLoading={isCompleting && isLastStep}
            loadingText="Getting Started..."
          >
            {isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
})

OnboardingModal.displayName = 'OnboardingModal'