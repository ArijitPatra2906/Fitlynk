/**
 * Step Tracking Service
 *
 * Tracks steps via device sensors (iOS/Android).
 * On Android, also starts an in-app foreground service so step counting can
 * continue while the app is backgrounded without relying on external apps.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
import { CapacitorPedometer } from "@capgo/capacitor-pedometer";
import { getAuthToken } from "@/lib/auth/auth-token";
import { apiClient } from "@/lib/api/client";

export interface StepData {
  steps: number;
  date: Date;
  source: "manual" | "device" | "synced";
  distance_km?: number;
  calories_burned?: number;
  active_minutes?: number;
  slow_minutes?: number;
  brisk_minutes?: number;
  slow_steps?: number;
  brisk_steps?: number;
}

export interface StepActivityStats {
  steps: number;
  slowSteps: number;
  briskSteps: number;
  slowMinutes: number;
  briskMinutes: number;
  activeMinutes: number;
  distanceKm: number;
  caloriesBurned: number;
}

interface StepBackgroundBridgePlugin {
  startBackgroundService(): Promise<{ started: boolean }>;
  stopBackgroundService(): Promise<{ stopped: boolean }>;
  getCachedTodaySteps(): Promise<{ steps: number; date: string }>;
  getCachedTodayStats(): Promise<{
    date: string;
    steps: number;
    slowSteps: number;
    briskSteps: number;
    slowMinutes: number;
    briskMinutes: number;
    activeMinutes: number;
  }>;
}

const StepBackgroundBridge = registerPlugin<StepBackgroundBridgePlugin>("StepBackgroundBridge");

class StepTrackerService {
  private isNative: boolean;
  private platform: string;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastReportedSteps: number = -1;
  private lastSyncedSteps: number = -1;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();
    console.log("[StepTracker] Initialized - isNative:", this.isNative, "platform:", this.platform);
  }

  private getStartOfTodayMs(): number {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    return startDate.getTime();
  }

  private isAndroidNative(): boolean {
    return this.isNative && this.platform === "android";
  }

  private async startAndroidBackgroundService(): Promise<void> {
    if (!this.isAndroidNative()) return;

    try {
      await StepBackgroundBridge.startBackgroundService();
    } catch (error) {
      console.error("[StepTracker] Failed to start Android background step service:", error);
    }
  }

  private async getAndroidCachedTodaySteps(): Promise<number> {
    if (!this.isAndroidNative()) return 0;

    try {
      const result = await StepBackgroundBridge.getCachedTodaySteps();
      return Number(result?.steps || 0);
    } catch (error) {
      console.log("[StepTracker] Android cached step read unavailable:", error);
      return 0;
    }
  }

  private async getAndroidCachedTodayStats(): Promise<StepActivityStats | null> {
    if (!this.isAndroidNative()) return null;

    try {
      const result = await StepBackgroundBridge.getCachedTodayStats();
      const steps = Number(result?.steps || 0);
      const slowSteps = Number(result?.slowSteps || 0);
      const briskSteps = Number(result?.briskSteps || 0);
      const slowMinutes = Number(result?.slowMinutes || 0);
      const briskMinutes = Number(result?.briskMinutes || 0);
      const activeMinutes = Number(result?.activeMinutes || slowMinutes + briskMinutes);

      return {
        steps,
        slowSteps,
        briskSteps,
        slowMinutes,
        briskMinutes,
        activeMinutes,
        distanceKm: this.estimateDistance(steps),
        caloriesBurned: this.estimateCalories(steps),
      };
    } catch (error) {
      console.log("[StepTracker] Android cached stats unavailable:", error);
      return null;
    }
  }

  private buildHeuristicStats(steps: number): StepActivityStats {
    const safeSteps = Math.max(0, steps);
    const slowSteps = Math.round(safeSteps * 0.62);
    const briskSteps = Math.max(0, safeSteps - slowSteps);
    const slowMinutes = Math.round(slowSteps / 85);
    const briskMinutes = Math.round(briskSteps / 130);
    const activeMinutes = slowMinutes + briskMinutes;

    return {
      steps: safeSteps,
      slowSteps,
      briskSteps,
      slowMinutes,
      briskMinutes,
      activeMinutes,
      distanceKm: this.estimateDistance(safeSteps),
      caloriesBurned: this.estimateCalories(safeSteps),
    };
  }

  private normalizeStatsToSteps(stats: StepActivityStats, targetSteps: number): StepActivityStats {
    const safeTarget = Math.max(0, targetSteps);
    if (stats.steps <= 0 || safeTarget <= 0) {
      return this.buildHeuristicStats(safeTarget);
    }

    if (stats.steps === safeTarget) {
      return {
        ...stats,
        distanceKm: this.estimateDistance(safeTarget),
        caloriesBurned: this.estimateCalories(safeTarget),
      };
    }

    const ratio = safeTarget / stats.steps;
    const slowSteps = Math.round(stats.slowSteps * ratio);
    const briskSteps = Math.max(0, safeTarget - slowSteps);

    return {
      steps: safeTarget,
      slowSteps,
      briskSteps,
      slowMinutes: Math.round(stats.slowMinutes * ratio),
      briskMinutes: Math.round(stats.briskMinutes * ratio),
      activeMinutes: Math.round(stats.activeMinutes * ratio),
      distanceKm: this.estimateDistance(safeTarget),
      caloriesBurned: this.estimateCalories(safeTarget),
    };
  }

  private async ensurePermission(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Step tracking not supported on this platform");
    }

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

  isSupported(): boolean {
    return this.isNative && (this.platform === "ios" || this.platform === "android");
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log("[StepTracker] Step tracking not supported on this platform");
      return false;
    }

    try {
      console.log("[StepTracker] Checking current permissions...");
      const checkResult = await CapacitorPedometer.checkPermissions();
      console.log("[StepTracker] Current permission status:", checkResult);

      if (checkResult.activityRecognition === "granted") {
        console.log("[StepTracker] Permission already granted");
        await this.startAndroidBackgroundService();
        return true;
      }

      console.log("[StepTracker] Requesting permissions...");
      const result = await CapacitorPedometer.requestPermissions();
      console.log("[StepTracker] Permission result:", result);
      if (result.activityRecognition !== "granted") return false;

      await this.startAndroidBackgroundService();
      return true;
    } catch (error) {
      console.error("[StepTracker] Error requesting step tracking permissions:", error);
      return false;
    }
  }

  async getTodaySteps(): Promise<number> {
    if (!this.isSupported()) {
      throw new Error("Step tracking not supported on this platform");
    }

    try {
      await this.ensurePermission();
      await this.startAndroidBackgroundService();

      console.log("[StepTracker] Checking if pedometer is available...");
      const available = await CapacitorPedometer.isAvailable();
      console.log("[StepTracker] Pedometer available:", available);

      let sensorSteps = 0;
      if (available.stepCounting) {
        const startOfToday = this.getStartOfTodayMs();

        let result;
        try {
          result = await CapacitorPedometer.getMeasurement({
            start: startOfToday,
            end: Date.now(),
          });
        } catch (error: any) {
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

        sensorSteps = Number(result?.numberOfSteps || 0);
      }

      const cachedAndroidSteps = await this.getAndroidCachedTodaySteps();
      const best = Math.max(sensorSteps, cachedAndroidSteps);
      console.log("[StepTracker] Steps result - sensor:", sensorSteps, "cached:", cachedAndroidSteps, "using:", best);
      return best;
    } catch (error) {
      if (this.isAndroidNative()) {
        const cached = await this.getAndroidCachedTodaySteps();
        if (cached > 0) {
          console.log("[StepTracker] Falling back to cached Android service steps:", cached);
          return cached;
        }
      }

      console.error("[StepTracker] Error getting step count:", error);
      throw error;
    }
  }

  async getTodayActivityStats(): Promise<StepActivityStats> {
    const steps = await this.getTodaySteps();
    const cached = await this.getAndroidCachedTodayStats();
    if (!cached) {
      return this.buildHeuristicStats(steps);
    }

    const alignedSteps = Math.max(steps, cached.steps);
    return this.normalizeStatsToSteps(cached, alignedSteps);
  }

  async startTracking(callback: (steps: number) => void): Promise<void> {
    if (!this.isSupported()) {
      console.log("[StepTracker] Step tracking not supported, using manual entry only");
      return;
    }

    try {
      console.log("[StepTracker] Starting real-time tracking...");

      await this.ensurePermission();
      await this.startAndroidBackgroundService();

      const initialSteps = await this.getTodaySteps();
      this.lastReportedSteps = initialSteps;
      callback(initialSteps);
      await this.syncSteps(initialSteps);

      await CapacitorPedometer.addListener("measurement", async () => {
        const steps = await this.getTodaySteps();
        if (steps !== this.lastReportedSteps) {
          this.lastReportedSteps = steps;
          callback(steps);
        }
        await this.syncSteps(steps);
      });

      await CapacitorPedometer.startMeasurementUpdates();

      this.pollingInterval = setInterval(async () => {
        try {
          const steps = await this.getTodaySteps();
          if (steps !== this.lastReportedSteps) {
            this.lastReportedSteps = steps;
            callback(steps);
          }
          await this.syncSteps(steps);
        } catch (error) {
          console.error("[StepTracker] Error during polling:", error);
        }
      }, 15000);
    } catch (error) {
      console.error("[StepTracker] Error starting step tracking:", error);
    }
  }

  async stopTracking(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log("[StepTracker] Polling stopped");
    }

    if (this.isSupported()) {
      try {
        await CapacitorPedometer.stopMeasurementUpdates();
        await CapacitorPedometer.removeAllListeners();
        console.log("[StepTracker] Foreground app listeners stopped");
      } catch (error) {
        console.error("[StepTracker] Error stopping listeners:", error);
      }
    }
  }

  async stopBackgroundService(): Promise<boolean> {
    if (!this.isAndroidNative()) return false;

    try {
      await StepBackgroundBridge.stopBackgroundService();
      return true;
    } catch (error) {
      console.error("[StepTracker] Failed to stop Android background step service:", error);
      return false;
    }
  }

  estimateDistance(steps: number): number {
    const averageStrideMeters = 0.762;
    const distanceKm = (steps * averageStrideMeters) / 1000;
    return Math.round(distanceKm * 100) / 100;
  }

  estimateCalories(steps: number): number {
    const caloriesPerStep = 0.04;
    return Math.round(steps * caloriesPerStep);
  }

  async syncSteps(steps: number): Promise<void> {
    if (steps < 0 || steps === this.lastSyncedSteps) return;

    if (steps === 0) {
      const existingToday = await this.getTodayStepsFromBackend();
      if (existingToday > 0) {
        console.log("[StepTracker] Skipping zero-step overwrite; backend already has:", existingToday);
        return;
      }
    }

    let stats = this.buildHeuristicStats(steps);
    if (this.isAndroidNative()) {
      const cached = await this.getAndroidCachedTodayStats();
      if (cached) {
        stats = this.normalizeStatsToSteps(cached, steps);
      }
    }

    const stepData: StepData = {
      steps,
      date: new Date(),
      source: this.isSupported() ? "device" : "manual",
      distance_km: stats.distanceKm,
      calories_burned: stats.caloriesBurned,
      active_minutes: stats.activeMinutes,
      slow_minutes: stats.slowMinutes,
      brisk_minutes: stats.briskMinutes,
      slow_steps: stats.slowSteps,
      brisk_steps: stats.briskSteps,
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

  /**
   * Kept for compatibility with existing dashboard flow.
   * Without Health Connect/external providers, historical backfill is not available.
   */
  async syncOfflineAndHistoricalSteps(): Promise<{ syncedDays: number; fullSync: boolean }> {
    if (this.isAndroidNative()) {
      const cached = await this.getAndroidCachedTodaySteps();
      if (cached > 0) {
        await this.syncSteps(cached);
        return { syncedDays: 1, fullSync: false };
      }
    }

    return { syncedDays: 0, fullSync: false };
  }
}

export const stepTracker = new StepTrackerService();
