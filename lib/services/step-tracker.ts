/**
 * Step Tracking Service
 *
 * Automatically tracks steps using device sensors (iOS/Android)
 * Falls back to manual entry on web browsers
 *
 * FREE - No API keys required
 *
 * Uses @capgo/capacitor-pedometer plugin
 */

import { Capacitor } from "@capacitor/core";
import { CapacitorPedometer } from "@capgo/capacitor-pedometer";

export interface StepData {
  steps: number;
  date: Date;
  source: "manual" | "device" | "synced";
  distance_km?: number;
  calories_burned?: number;
}

class StepTrackerService {
  private isNative: boolean;
  private platform: string;
  private pollingInterval: any = null;
  private trackingStartTime: number = 0;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();
    console.log('[StepTracker] Initialized - isNative:', this.isNative, 'platform:', this.platform);
  }

  /**
   * Check if automatic step tracking is supported
   */
  isSupported(): boolean {
    return this.isNative && (this.platform === "ios" || this.platform === "android");
  }

  /**
   * Request permissions for step tracking
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log("[StepTracker] Step tracking not supported on this platform");
      return false;
    }

    try {
      console.log('[StepTracker] Checking current permissions...');
      const checkResult = await CapacitorPedometer.checkPermissions();
      console.log('[StepTracker] Current permission status:', checkResult);

      if (checkResult.activityRecognition === 'granted') {
        console.log('[StepTracker] Permission already granted');
        return true;
      }

      console.log('[StepTracker] Requesting permissions...');
      const result = await CapacitorPedometer.requestPermissions();
      console.log('[StepTracker] Permission result:', result);
      return result.activityRecognition === 'granted';
    } catch (error) {
      console.error("[StepTracker] Error requesting step tracking permissions:", error);
      return false;
    }
  }

  /**
   * Get today's step count from device sensor
   */
  async getTodaySteps(): Promise<number> {
    if (!this.isSupported()) {
      throw new Error("Step tracking not supported on this platform");
    }

    try {
      console.log('[StepTracker] Checking if pedometer is available...');
      const available = await CapacitorPedometer.isAvailable();
      console.log('[StepTracker] Pedometer available:', available);

      if (!available.stepCounting) {
        console.error('[StepTracker] Step counting not available on this device');
        return 0;
      }

      console.log('[StepTracker] Getting today\'s steps...');

      // Get start of today
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      console.log('[StepTracker] Query range:', {
        start: startDate.getTime(),
        end: Date.now(),
        startFormatted: startDate.toISOString(),
        endFormatted: new Date().toISOString()
      });

      const result = await CapacitorPedometer.getMeasurement({
        start: startDate.getTime(),
        end: Date.now(),
      });

      console.log('[StepTracker] Steps result:', result);

      return result.numberOfSteps || 0;
    } catch (error) {
      console.error("[StepTracker] Error getting step count:", error);
      console.error("[StepTracker] Error details:", JSON.stringify(error));
      return 0;
    }
  }

  /**
   * Start listening for real-time step updates
   */
  async startTracking(callback: (steps: number) => void): Promise<void> {
    if (!this.isSupported()) {
      console.log("[StepTracker] Step tracking not supported, using manual entry only");
      return;
    }

    try {
      console.log('[StepTracker] Starting real-time tracking...');

      // Check permissions again before starting
      const checkResult = await CapacitorPedometer.checkPermissions();
      console.log('[StepTracker] Permission check before tracking:', checkResult);

      if (checkResult.activityRecognition !== 'granted') {
        console.error('[StepTracker] Permission not granted for tracking');
        return;
      }

      // Store the start time for tracking
      this.trackingStartTime = Date.now();

      // Listen for measurement updates BEFORE starting
      await CapacitorPedometer.addListener('measurement', (data) => {
        console.log('[StepTracker] Measurement update received:', data);
        callback(data.numberOfSteps || 0);
      });

      await CapacitorPedometer.startMeasurementUpdates();

      console.log('[StepTracker] Real-time tracking started successfully');

      // Also poll every 5 seconds as a fallback since measurement events may not fire
      console.log('[StepTracker] Starting polling fallback...');
      this.pollingInterval = setInterval(async () => {
        try {
          console.log('[StepTracker] Polling for steps...');
          const result = await CapacitorPedometer.getMeasurement({
            start: this.trackingStartTime,
            end: Date.now(),
          });
          console.log('[StepTracker] Polled result:', result);
          if (result.numberOfSteps !== undefined) {
            callback(result.numberOfSteps);
          }
        } catch (error) {
          console.error('[StepTracker] Error during polling:', error);
        }
      }, 5000); // Poll every 5 seconds

    } catch (error) {
      console.error("[StepTracker] Error starting step tracking:", error);
      console.error("[StepTracker] Error details:", JSON.stringify(error));
    }
  }

  /**
   * Stop listening for step updates
   */
  async stopTracking(): Promise<void> {
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[StepTracker] Polling stopped');
    }

    if (this.isSupported()) {
      try {
        await CapacitorPedometer.stopMeasurementUpdates();
        await CapacitorPedometer.removeAllListeners();
        console.log('[StepTracker] Tracking stopped');
      } catch (error) {
        console.error("[StepTracker] Error stopping tracking:", error);
      }
    }
  }

  /**
   * Estimate distance from steps (rough approximation)
   * Average stride length: ~0.762 meters
   */
  estimateDistance(steps: number): number {
    const averageStrideMeters = 0.762;
    const distanceKm = (steps * averageStrideMeters) / 1000;
    return Math.round(distanceKm * 100) / 100; // Round to 2 decimals
  }

  /**
   * Estimate calories burned from steps (rough approximation)
   * Average: ~0.04 calories per step
   */
  estimateCalories(steps: number): number {
    const caloriesPerStep = 0.04;
    return Math.round(steps * caloriesPerStep);
  }

  /**
   * Sync steps with backend
   */
  async syncSteps(steps: number): Promise<void> {
    const stepData: StepData = {
      steps,
      date: new Date(),
      source: this.isSupported() ? "device" : "manual",
      distance_km: this.estimateDistance(steps),
      calories_burned: this.estimateCalories(steps),
    };

    // TODO: Save to MongoDB via API route
    console.log("Step data to sync:", stepData);
  }
}

// Singleton instance
export const stepTracker = new StepTrackerService();
