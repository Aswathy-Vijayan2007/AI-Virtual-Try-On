import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, CameraOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { cn } from '@/lib/utils'
import type { ClothingItem, Pose } from '@/types'

interface WebcamPreviewProps {
  selectedOutfit?: ClothingItem[]
  onPoseDetected?: (poses: Pose[]) => void
  className?: string
}

export const WebcamPreview = React.memo<WebcamPreviewProps>(({
  selectedOutfit = [],
  onPoseDetected,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 })

  const {
    isLoading: isPoseModelLoading,
    error: poseError,
    poses,
    isDetecting,
    startDetection,
    stopDetection,
    getAlignmentPoints,
    isReady: isPoseReady
  } = usePoseDetection({
    modelType: 'MoveNet',
    enableSmoothing: true,
    confidenceThreshold: 0.3
  })

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current
            setDimensions({ width: videoWidth, height: videoHeight })
            setIsWebcamActive(true)

            // Start pose detection when video is ready
            if (isPoseReady) {
              startDetection(videoRef.current)
            }
          }
        }
      }
    } catch (error) {
      console.error('Webcam access error:', error)
      setWebcamError('Unable to access webcam. Please check permissions and try again.')
    }
  }, [isPoseReady, startDetection])

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    stopDetection()
    setIsWebcamActive(false)
    setWebcamError(null)
  }, [stopDetection])

  // Handle pose detection results
  useEffect(() => {
    if (poses.length > 0 && onPoseDetected) {
      onPoseDetected(poses)
    }
  }, [poses, onPoseDetected])

  // Start pose detection when webcam becomes active and model is ready
  useEffect(() => {
    if (isWebcamActive && isPoseReady && videoRef.current && !isDetecting) {
      startDetection(videoRef.current)
    }
  }, [isWebcamActive, isPoseReady, isDetecting, startDetection])

  // Render clothing overlay
  const renderClothingOverlay = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || poses.length === 0 || selectedOutfit.length === 0) {
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get pose alignment points
    const pose = poses[0] // Use first detected pose
    const alignmentPoints = getAlignmentPoints(pose)

    if (!alignmentPoints) return

    selectedOutfit.forEach(async (item, index) => {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          // Calculate positioning based on clothing type and pose points
          let x = 0, y = 0, width = 0, height = 0

          if (item.type === 'top') {
            // Position top based on shoulders
            if (alignmentPoints.leftShoulder && alignmentPoints.rightShoulder) {
              const shoulderWidth = Math.abs(alignmentPoints.rightShoulder.x - alignmentPoints.leftShoulder.x)
              const centerX = (alignmentPoints.leftShoulder.x + alignmentPoints.rightShoulder.x) / 2

              width = shoulderWidth * 2
              height = (img.height / img.width) * width
              x = centerX - width / 2
              y = alignmentPoints.leftShoulder.y - height * 0.1
            }
          } else if (item.type === 'bottom') {
            // Position bottom based on hips
            if (alignmentPoints.leftHip && alignmentPoints.rightHip) {
              const hipWidth = Math.abs(alignmentPoints.rightHip.x - alignmentPoints.leftHip.x)
              const centerX = (alignmentPoints.leftHip.x + alignmentPoints.rightHip.x) / 2

              width = hipWidth * 2.2
              height = (img.height / img.width) * width
              x = centerX - width / 2
              y = alignmentPoints.leftHip.y
            }
          } else if (item.type === 'dress') {
            // Position dress based on shoulders and extend to legs
            if (alignmentPoints.leftShoulder && alignmentPoints.rightShoulder && alignmentPoints.leftKnee) {
              const shoulderWidth = Math.abs(alignmentPoints.rightShoulder.x - alignmentPoints.leftShoulder.x)
              const centerX = (alignmentPoints.leftShoulder.x + alignmentPoints.rightShoulder.x) / 2

              width = shoulderWidth * 2
              height = Math.abs(alignmentPoints.leftKnee.y - alignmentPoints.leftShoulder.y) * 1.2
              x = centerX - width / 2
              y = alignmentPoints.leftShoulder.y - height * 0.1
            }
          }

          // Apply some transparency and draw the clothing item
          ctx.globalAlpha = 0.8
          ctx.drawImage(img, x, y, width, height)
          ctx.globalAlpha = 1
        }

        img.src = item.image
      } catch (error) {
        console.error('Error rendering clothing overlay:', error)
      }
    })
  }, [poses, selectedOutfit, getAlignmentPoints])

  // Render overlay when poses change
  useEffect(() => {
    renderClothingOverlay()
  }, [renderClothingOverlay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [stopWebcam])

  const hasError = webcamError || poseError
  const isLoading = isPoseModelLoading

  return (
    <div className={cn('webcam-container', className)}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'w-full h-full object-cover',
          !isWebcamActive && 'hidden'
        )}
        style={{ transform: 'scaleX(-1)' }} // Mirror effect
      />

      {/* Clothing overlay canvas */}
      <canvas
        ref={canvasRef}
        className="clothing-overlay"
        style={{ transform: 'scaleX(-1)' }} // Mirror effect to match video
      />

      {/* Pose keypoints overlay (for debugging) */}
      {isWebcamActive && poses.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {poses[0].keypoints.map((keypoint, index) => (
            keypoint.score > 0.3 && (
              <div
                key={index}
                className="pose-keypoint"
                style={{
                  left: `${(keypoint.x / dimensions.width) * 100}%`,
                  top: `${(keypoint.y / dimensions.height) * 100}%`,
                  transform: 'translate(-50%, -50%) scaleX(-1)'
                }}
                title={keypoint.name}
              />
            )
          ))}
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        {!isWebcamActive ? (
          <Button
            onClick={startWebcam}
            disabled={isLoading || !!hasError}
            isLoading={isLoading}
            loadingText="Loading AI Model..."
            className="bg-white/90 text-gray-900 hover:bg-white"
          >
            <Camera className="w-4 h-4" />
            Start Camera
          </Button>
        ) : (
          <Button
            onClick={stopWebcam}
            variant="secondary"
            className="bg-white/90 text-gray-900 hover:bg-white"
          >
            <CameraOff className="w-4 h-4" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Status indicators */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {isDetecting && (
          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            AI Active
          </div>
        )}

        {selectedOutfit.length > 0 && (
          <div className="bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {selectedOutfit.length} item{selectedOutfit.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Error state */}
      {hasError && !isWebcamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-sm mx-auto p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isPoseModelLoading ? 'Loading AI Model' : 'Camera Error'}
            </h3>
            <p className="text-gray-600 mb-4">
              {webcamError || poseError}
            </p>
            <Button onClick={startWebcam} disabled={isLoading}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <LoadingSpinner size="lg" text="Loading AI Model..." />
        </div>
      )}
    </div>
  )
})

WebcamPreview.displayName = 'WebcamPreview'