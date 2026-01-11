import { useState, useEffect, useRef, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import type { Pose } from '@/types'

interface UsePoseDetectionOptions {
  modelType?: 'MoveNet' | 'BlazePose'
  enableSmoothing?: boolean
  confidenceThreshold?: number
  maxPoses?: number
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}) {
  const {
    modelType = 'MoveNet',
    enableSmoothing = true,
    confidenceThreshold = 0.3,
    maxPoses = 1
  } = options

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poses, setPoses] = useState<Pose[]>([])
  const [isDetecting, setIsDetecting] = useState(false)

  const detectorRef = useRef<poseDetection.PoseDetector | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Initialize TensorFlow.js and pose detection model
  useEffect(() => {
    let mounted = true

    const initializePoseDetection = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initialize TensorFlow.js with WebGL backend for GPU acceleration
        try {
          // Check if webgl is available
          const hasWebGL = tf.findBackend('webgl') !== null
          if (hasWebGL) {
            await tf.setBackend('webgl')
            console.log('TensorFlow.js backend set to WebGL')
          } else {
            console.warn('WebGL backend not found, falling back to default')
            await tf.ready()
          }
        } catch (e) {
          console.warn('Failed to set WebGL backend:', e)
          await tf.ready()
        }

        // Create detector based on model type
        let detector: poseDetection.PoseDetector

        if (modelType === 'MoveNet') {
          const model = poseDetection.SupportedModels.MoveNet
          detector = await poseDetection.createDetector(model, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, // Switch to lightning for speed
            enableSmoothing
          })
        } else {
          const model = poseDetection.SupportedModels.BlazePose
          detector = await poseDetection.createDetector(model, {
            runtime: 'tfjs',
            enableSmoothing,
            modelType: 'lite'
          })
        }

        if (mounted) {
          detectorRef.current = detector
          setIsLoading(false)
          console.log(`${modelType} pose detector initialized`)
        }
      } catch (err) {
        console.error('Failed to initialize pose detection:', err)
        if (mounted) {
          setError('Failed to load AI model. Please refresh and try again.')
          setIsLoading(false)
        }
      }
    }

    initializePoseDetection()

    return () => {
      mounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [modelType, enableSmoothing])

  // Detect poses from video element
  const detectPoses = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!detectorRef.current || !videoElement || videoElement.videoWidth === 0) {
      return
    }

    try {
      const poses = await detectorRef.current.estimatePoses(videoElement, {
        maxPoses,
        flipHorizontal: false
      })

      // Filter poses by confidence threshold
      const validPoses = poses
        .filter(pose => pose.score && pose.score > confidenceThreshold)
        .map(pose => ({
          keypoints: pose.keypoints.map(kp => ({
            x: kp.x,
            y: kp.y,
            score: kp.score || 0,
            name: kp.name || ''
          })),
          score: pose.score || 0
        }))

      setPoses(validPoses)
    } catch (err) {
      console.error('Pose detection error:', err)
    }
  }, [maxPoses, confidenceThreshold])

  // Start pose detection loop
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (isDetecting || !detectorRef.current) return

    setIsDetecting(true)
    videoRef.current = videoElement

    let lastFrameTime = 0
    const targetFPS = 20 // Target 20 FPS to reduce load
    const frameInterval = 1000 / targetFPS

    const detect = async (timestamp: number) => {
      if (videoRef.current && isDetecting) {
        // Throttle frames
        if (timestamp - lastFrameTime >= frameInterval) {
          await detectPoses(videoRef.current)
          lastFrameTime = timestamp
        }
        animationFrameRef.current = requestAnimationFrame(detect)
      }
    }

    animationFrameRef.current = requestAnimationFrame(detect)
  }, [isDetecting, detectPoses])

  // Stop pose detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setPoses([])
  }, [])

  // Get specific keypoints for clothing alignment
  const getAlignmentPoints = useCallback((pose: Pose) => {
    if (!pose.keypoints.length) return null

    const keypoints = pose.keypoints
    const getPoint = (name: string) =>
      keypoints.find(kp => kp.name.includes(name) && kp.score > confidenceThreshold)

    return {
      // Upper body alignment points
      leftShoulder: getPoint('left_shoulder'),
      rightShoulder: getPoint('right_shoulder'),
      leftElbow: getPoint('left_elbow'),
      rightElbow: getPoint('right_elbow'),
      leftWrist: getPoint('left_wrist'),
      rightWrist: getPoint('right_wrist'),

      // Torso alignment points
      leftHip: getPoint('left_hip'),
      rightHip: getPoint('right_hip'),

      // Lower body alignment points
      leftKnee: getPoint('left_knee'),
      rightKnee: getPoint('right_knee'),
      leftAnkle: getPoint('left_ankle'),
      rightAnkle: getPoint('right_ankle'),

      // Face/neck (for avoiding overlay)
      nose: getPoint('nose'),
      leftEye: getPoint('left_eye'),
      rightEye: getPoint('right_eye')
    }
  }, [confidenceThreshold])

  return {
    isLoading,
    error,
    poses,
    isDetecting,
    startDetection,
    stopDetection,
    getAlignmentPoints,
    isReady: !isLoading && !error && detectorRef.current !== null
  }
}