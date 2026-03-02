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
import { getAuthToken } from "@/lib/auth/auth-token";
import { apiClient } from "@/lib/api/client";

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
  private lastReportedSteps: number = -1;
  private lastSyncedSteps: number = -1;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();
    console.log('[StepTracker] Initialized - isNative:', this.isNative, 'platform:', this.platform);
  }

  private getStartOfTodayMs(): number {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    return startDate.getTime();
  }

  private async ensurePermission(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Step tracking not supported on this platform");
    }

    // On some Android builds, checkPermissions can be stale/incorrect.
    // Force a runtime request/check path so plugin calls don't fail later.
    if (this.platform === "android") {
      const requestResult = await CapacitorPedometer.requestPermissions();
      if (requestResult.activityRecognition !== "granted") {
        throw new Error("Activity recognition permission not granted");
      }
      return;
    }

    const checkResult = await CapacitorPedometer.checkPermissions();
    if (checkResult.activityRecognition === "granted") {
      return;
    }

    const requestResult = await CapacitorPedometer.requestPermissions();
    if (requestResult.activityRecognition !== "granted") {
      throw new Error("Activity recognition permission not granted");
    }
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
      await this.ensurePermission();

      console.log('[StepTracker] Checking if pedometer is available...');
      const available = await CapacitorPedometer.isAvailable();
      console.log('[StepTracker] Pedometer available:', available);

      if (!available.stepCounting) {
        console.error('[StepTracker] Step counting not available on this device');
        return 0;
      }

      console.log('[StepTracker] Getting today\'s steps...');

      const startOfToday = this.getStartOfTodayMs();

      console.log('[StepTracker] Query range:', {
        start: startOfToday,
        end: Date.now(),
        startFormatted: new Date(startOfToday).toISOString(),
        endFormatted: new Date().toISOString()
      });

      let result;
      try {
        result = await CapacitorPedometer.getMeasurement({
          start: startOfToday,
          end: Date.now(),
        });
      } catch (error: any) {
        // Retry once after forcing permission refresh for Android edge cases.
        const message = String(error?.message || error || "");
        if (this.platform === "android" && message.toLowerCase().includes("permission")) {
          await this.ensurePermission();
          result = await CapacitorPedometer.getMeasurement({
            start: startOfToday,
            end: Date.now(),
          });
        } else {
          throw error;
        }
      }

      console.log('[StepTracker] Steps result:', result);

      return result.numberOfSteps || 0;
    } catch (error) {
      console.error("[StepTracker] Error getting step count:", error);
      console.error("[StepTracker] Error details:", JSON.stringify(error));
      throw error;
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

      await this.ensurePermission();

      // Emit initial value first so UI is immediately accurate
      const initialSteps = await this.getTodaySteps();
      this.lastReportedSteps = initialSteps;
      callback(initialSteps);
      await this.syncSteps(initialSteps);

      // Listen for measurement updates BEFORE starting
      await CapacitorPedometer.addListener('measurement', async (data) => {
        console.log('[StepTracker] Measurement update received:', data);
        const steps = await this.getTodaySteps();
        if (steps !== this.lastReportedSteps) {
          this.lastReportedSteps = steps;
          callback(steps);
        }
        await this.syncSteps(steps);
      });

      await CapacitorPedometer.startMeasurementUpdates();

      console.log('[StepTracker] Real-time tracking started successfully');

      // Also poll every 5 seconds as a fallback since measurement events may not fire
      console.log('[StepTracker] Starting polling fallback...');
      this.pollingInterval = setInterval(async () => {
        try {
          console.log('[StepTracker] Polling for steps...');
          const steps = await this.getTodaySteps();
          if (steps !== this.lastReportedSteps) {
            this.lastReportedSteps = steps;
            callback(steps);
          }
          await this.syncSteps(steps);
        } catch (error) {
          console.error('[StepTracker] Error during polling:', error);
        }
      }, 15000); // Poll every 15 seconds to balance battery and freshness

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
    if (steps < 0 || steps === this.lastSyncedSteps) return;

    const stepData: StepData = {
      steps,
      date: new Date(),
      source: this.isSupported() ? "device" : "manual",
      distance_km: this.estimateDistance(steps),
      calories_burned: this.estimateCalories(steps),
    };

    try {
      const token = await getAuthToken();
      if (!token) return;

      await apiClient.post("/api/metrics/steps", stepData, token);
      this.lastSyncedSteps = steps;
      console.log("[StepTracker] Step data synced:", stepData);
    } catch (error) {
      console.error("[StepTracker] Error syncing steps:", error);
    }
  }

  /**
   * Get today's saved step count from backend (MongoDB)
   */
  async getTodayStepsFromBackend(): Promise<number> {
    try {
      const token = await getAuthToken();
      if (!token) return 0;

      const today = new Date().toISOString().split("T")[0];
      const res = await apiClient.get(`/api/metrics/steps?date=${today}`, token);
      if (!res.success) return 0;

      const logs = Array.isArray(res.data) ? res.data : [];
      if (logs.length === 0) return 0;
      return logs[0]?.steps || 0;
    } catch (error) {
      console.error("[StepTracker] Error fetching steps from backend:", error);
      return 0;
    }
  }
}

// Singleton instance
export const stepTracker = new StepTrackerService();
