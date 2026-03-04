'use client'

import { useEffect } from 'react'
import { stepTracker } from '@/lib/services/step-tracker'

/**
 * Step Tracker Initializer
 *
 * Starts step tracking as soon as the app launches.
 * This ensures the pedometer sensor is actively counting steps.
 */
export function StepTrackerInitializer() {
  useEffect(() => {
    const initStepTracking = async () => {
      if (!stepTracker.isSupported()) {
        console.log('[StepTrackerInit] Step tracking not supported on this platform')
        return
      }

      try {
        console.log('[StepTrackerInit] Requesting step tracking permissions...')
        const hasPermission = await stepTracker.requestPermissions()

        if (hasPermission) {
          console.log('[StepTrackerInit] Starting step tracking...')
          // Start tracking to activate the sensor
          await stepTracker.startTracking(() => {
            // Callback - no need to do anything here, just need to start the sensor
          })
          console.log('[StepTrackerInit] Step tracking initialized successfully')
        } else {
          console.log('[StepTrackerInit] Step tracking permission denied')
        }
      } catch (error) {
        console.error('[StepTrackerInit] Failed to initialize step tracking:', error)
      }
    }

    // Initialize after a short delay to let the app settle
    const timer = setTimeout(initStepTracking, 2000)
    return () => clearTimeout(timer)
  }, [])

  return null
}
