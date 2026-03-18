export type NotificationType =
  // Achievement Notifications
  | 'workout_completed'
  | 'pr_achieved'
  | 'calorie_goal_reached'
  | 'macro_goal_reached'
  | 'step_goal_reached'
  | 'water_goal_reached'
  | 'perfect_day'
  | 'streak_milestone'
  | 'volume_milestone'
  | 'weight_milestone'
  | 'total_workouts_milestone'
  // Reminder Notifications
  | 'morning_checkin'
  | 'workout_reminder'
  | 'water_reminder'
  | 'meal_reminder'
  | 'todo_reminder'
  | 'evening_summary'
  | 'streak_protection'
  | 'incomplete_goals'
  | 'template_reminder'
  | 'rest_day_suggestion'
  // Progress & Insights
  | 'weekly_summary'
  | 'personal_best'
  | 'consistency_insight'
  | 'improvement_detected'
  // System
  | 'step_sync_complete'
  | 'goal_update_reminder';

export interface Notification {
  _id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  redirect_path?: string;
  read: boolean;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  _id?: string;
  user_id: string;
  fcm_token?: string;
  fcm_token_updated_at?: string;

  // Global settings
  push_notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;

  // Achievement notifications
  workout_completed: boolean;
  pr_achieved: boolean;
  calorie_goal_reached: boolean;
  macro_goal_reached: boolean;
  step_goal_reached: boolean;
  water_goal_reached: boolean;
  perfect_day: boolean;
  streak_milestone: boolean;
  volume_milestone: boolean;
  weight_milestone: boolean;
  total_workouts_milestone: boolean;

  // Reminder notifications
  morning_checkin: ReminderSchedule;
  workout_reminder: ReminderSchedule;
  water_reminder: WaterReminderSchedule;
  meal_reminder: MealReminderSchedule;
  evening_summary: ReminderSchedule;
  streak_protection: boolean;
  incomplete_goals: boolean;
  template_reminder: boolean;
  rest_day_suggestion: boolean;

  // Progress & Insights
  weekly_summary: boolean;
  personal_best: boolean;
  consistency_insight: boolean;
  improvement_detected: boolean;

  // System notifications
  step_sync_complete: boolean;
  goal_update_reminder: boolean;

  created_at?: string;
  updated_at?: string;
}

export interface ReminderSchedule {
  enabled: boolean;
  time: string;
}

export interface WaterReminderSchedule {
  enabled: boolean;
  times: string[];
}

export interface MealReminderSchedule {
  enabled: boolean;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
}
