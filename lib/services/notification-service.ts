/**
 * Notification Service
 * Handles push notifications, local notifications, and FCM token registration
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { apiClient } from '../api/client';
import { getAuthToken } from '../auth/auth-token';

class NotificationService {
  private initialized = false;
  private fcmToken: string | null = null;

  /**
   * Initialize notification service
   * Call this on app start (after user is authenticated)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Notifications already initialized');
      return;
    }

    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Skipping notification initialization on web');
      return;
    }

    try {
      // Request permissions
      await this.requestPermissions();

      // Register with FCM
      await this.registerPushNotifications();

      // Setup notification listeners
      this.setupListeners();

      this.initialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request push notification permissions
      const pushResult = await PushNotifications.requestPermissions();

      if (pushResult.receive === 'granted') {
        console.log('✅ Push notification permissions granted');
      } else {
        console.warn('⚠️ Push notification permissions denied');
        return false;
      }

      // Request local notification permissions
      const localResult = await LocalNotifications.requestPermissions();

      if (localResult.display === 'granted') {
        console.log('✅ Local notification permissions granted');
      } else {
        console.warn('⚠️ Local notification permissions denied');
      }

      return pushResult.receive === 'granted' && localResult.display === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get FCM token
   */
  private async registerPushNotifications(): Promise<void> {
    try {
      // Register with FCM
      await PushNotifications.register();
      console.log('Registering for push notifications...');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupListeners(): void {
    // FCM token received
    PushNotifications.addListener('registration', async (token) => {
      console.log('✅ FCM Token received:', token.value);
      this.fcmToken = token.value;

      // Send token to backend
      await this.registerTokenWithBackend(token.value);
    });

    // Error during registration
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ FCM registration error:', error);
    });

    // Notification received (while app is in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📬 Push notification received:', notification);

      // You can show a local notification or update UI here
      // The notification won't show automatically in foreground
    });

    // Notification tapped (user opened the notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Notification tapped:', action);

      // Handle notification tap - navigate to relevant screen
      const data = action.notification.data;

      // You can emit an event or update a store here to navigate
      if (data.type) {
        this.handleNotificationTap(data);
      }
    });

    // Local notification received
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('📬 Local notification received:', notification);
    });

    // Local notification tapped
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('🔔 Local notification tapped:', action);

      const data = action.notification.extra;
      if (data?.type) {
        this.handleNotificationTap(data);
      }
    });
  }

  /**
   * Handle notification tap - navigate to relevant screen
   */
  private handleNotificationTap(data: any): void {
    // This will be handled by the app's routing logic
    // Emit a custom event that the app can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('notification-tapped', { detail: data })
      );
    }
  }

  /**
   * Register FCM token with backend
   */
  private async registerTokenWithBackend(fcmToken: string): Promise<void> {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn('User not authenticated - will register token later');
        return;
      }

      const response = await apiClient.post(
        '/api/notifications/register-token',
        { fcm_token: fcmToken },
        token
      );

      if (response.success) {
        console.log('✅ FCM token registered with backend');
      } else {
        console.error('Failed to register token:', response.error);
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(options: {
    title: string;
    body: string;
    id: number;
    scheduleAt: Date;
    extra?: any;
  }): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: options.id,
            title: options.title,
            body: options.body,
            schedule: { at: options.scheduleAt },
            extra: options.extra || {},
          },
        ],
      });

      console.log(`📅 Local notification scheduled for ${options.scheduleAt.toLocaleString()}`);
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  /**
   * Cancel a local notification
   */
  async cancelLocalNotification(id: number): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log(`❌ Local notification ${id} cancelled`);
    } catch (error) {
      console.error('Error cancelling local notification:', error);
    }
  }

  /**
   * Get pending local notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const pushPerms = await PushNotifications.checkPermissions();
      const localPerms = await LocalNotifications.checkPermissions();

      return (
        pushPerms.receive === 'granted' && localPerms.display === 'granted'
      );
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Cleanup and unregister
   */
  async cleanup(): Promise<void> {
    try {
      // Remove all listeners
      await PushNotifications.removeAllListeners();
      await LocalNotifications.removeAllListeners();

      this.initialized = false;
      console.log('Notification service cleaned up');
    } catch (error) {
      console.error('Error cleaning up notification service:', error);
    }
  }
}

export default new NotificationService();
