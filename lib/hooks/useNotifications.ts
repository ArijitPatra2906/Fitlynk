import { useEffect, useState } from 'react';
import notificationService from '../services/notification-service';
import { useRouter } from 'next/navigation';

export function useNotifications() {
  const [initialized, setInitialized] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize notifications on mount
    const initNotifications = async () => {
      await notificationService.initialize();
      const enabled = await notificationService.areNotificationsEnabled();
      setPermissionsGranted(enabled);
      setInitialized(true);
    };

    initNotifications();

    // Listen for notification taps
    const handleNotificationTap = (event: CustomEvent) => {
      const data = event.detail;
      console.log('Notification tapped with data:', data);

      // Navigate based on notification type
      switch (data.type) {
        case 'workout_completed':
        case 'pr_achieved':
        case 'workout_reminder':
          router.push('/exercise');
          break;

        case 'calorie_goal_reached':
        case 'macro_goal_reached':
        case 'meal_reminder':
          router.push('/nutrition');
          break;

        case 'step_goal_reached':
        case 'step_sync_complete':
          // Temporarily disabled - step log not working properly
          // router.push('/steps');
          router.push('/dashboard');
          break;

        case 'water_goal_reached':
        case 'water_reminder':
          router.push('/water');
          break;

        case 'perfect_day':
        case 'morning_checkin':
        case 'evening_summary':
        case 'weekly_summary':
          router.push('/dashboard');
          break;

        case 'goal_update_reminder':
          router.push('/settings/goals');
          break;

        default:
          // Navigate to notifications page for unknown types
          router.push('/notifications');
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'notification-tapped' as any,
        handleNotificationTap
      );
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'notification-tapped' as any,
          handleNotificationTap
        );
      }
    };
  }, [router]);

  const requestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setPermissionsGranted(granted);
    return granted;
  };

  const scheduleNotification = async (options: {
    title: string;
    body: string;
    id: number;
    scheduleAt: Date;
    extra?: any;
  }) => {
    await notificationService.scheduleLocalNotification(options);
  };

  const cancelNotification = async (id: number) => {
    await notificationService.cancelLocalNotification(id);
  };

  return {
    initialized,
    permissionsGranted,
    requestPermissions,
    scheduleNotification,
    cancelNotification,
  };
}
