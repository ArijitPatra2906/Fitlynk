'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { apiClient } from '@/lib/api/client'
import { getAuthToken } from '@/lib/auth/auth-token'
import { NotificationPreferences } from '@/types/notification'
import { toast } from 'sonner'
import { NotificationSettingsSkeleton } from '@/components/ui/skeleton'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = await getAuthToken()
        if (!token) {
          router.push('/login')
          return
        }

        const response = await apiClient.get(
          '/api/notifications/preferences',
          token,
        )

        if (response.success && response.data) {
          setPreferences(response.data)
        }
      } catch (error) {
        console.error('Error fetching preferences:', error)
        toast.error('Failed to load notification settings')
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [])

  const handleSave = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await apiClient.put(
        '/api/notifications/preferences',
        preferences,
        token,
      )

      if (response.success) {
        toast.success('Notification settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleSwitch = (key: keyof NotificationPreferences) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    })
  }

  const updateReminderSchedule = (
    key: 'morning_checkin' | 'workout_reminder' | 'evening_summary',
    field: 'enabled' | 'time',
    value: boolean | string,
  ) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [key]: {
        ...preferences[key],
        [field]: value,
      },
    })
  }

  if (loading || !preferences) {
    return <NotificationSettingsSkeleton />
  }

  return (
    <div className='h-screen overflow-hidden app-shell-bg'>
      {/* Scrollable Content */}
      <div className='h-full overflow-y-auto px-6 pt-4 pb-24 space-y-6'>
        {/* Global Settings */}
        <div>
          <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-3'>
            Global Settings
          </div>

          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl divide-y divide-[color:var(--app-border)]'>
            <div className='p-4 flex items-center justify-between'>
              <div>
                <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                  Push Notifications
                </div>
                <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                  Receive notifications on your device
                </div>
              </div>

              <button
                onClick={() => toggleSwitch('push_notifications_enabled')}
                className={`w-12 h-7 rounded-full transition-all ${
                  preferences.push_notifications_enabled
                    ? 'bg-blue-500'
                    : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all ${
                    preferences.push_notifications_enabled
                      ? 'ml-[26px]'
                      : 'ml-1'
                  }`}
                />
              </button>
            </div>

            <div className='p-4 flex items-center justify-between'>
              <div>
                <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                  Quiet Hours
                </div>
                <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                  Pause notifications during specific times
                </div>
              </div>

              <button
                onClick={() => toggleSwitch('quiet_hours_enabled')}
                className={`w-12 h-7 rounded-full transition-all ${
                  preferences.quiet_hours_enabled
                    ? 'bg-blue-500'
                    : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-all ${
                    preferences.quiet_hours_enabled ? 'ml-[26px]' : 'ml-1'
                  }`}
                />
              </button>
            </div>

            {preferences.quiet_hours_enabled && (
              <div className='p-4'>
                <div className='flex items-center gap-4'>
                  <div className='flex-1'>
                    <label className='text-[12px] text-[color:var(--app-text-muted)] block mb-1'>
                      Start Time
                    </label>
                    <input
                      type='time'
                      value={preferences.quiet_hours_start}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quiet_hours_start: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 rounded-xl app-surface border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)]'
                    />
                  </div>

                  <div className='flex-1'>
                    <label className='text-[12px] text-[color:var(--app-text-muted)] block mb-1'>
                      End Time
                    </label>
                    <input
                      type='time'
                      value={preferences.quiet_hours_end}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quiet_hours_end: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 rounded-xl app-surface border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)]'
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Achievement Notifications */}
        <div>
          <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-3'>
            Achievement Notifications
          </div>

          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl divide-y divide-[color:var(--app-border)]'>
            {[
              {
                key: 'workout_completed',
                label: 'Workout Completed',
                desc: 'Celebrate when you finish a workout',
              },
              {
                key: 'pr_achieved',
                label: 'Personal Records',
                desc: 'Get notified when you hit a new PR',
              },
              {
                key: 'calorie_goal_reached',
                label: 'Calorie Goal Reached',
                desc: 'Daily calorie target completion',
              },
              {
                key: 'macro_goal_reached',
                label: 'Macro Goals Reached',
                desc: 'Protein/carbs/fat target completion',
              },
              {
                key: 'step_goal_reached',
                label: 'Step Goal Reached',
                desc: 'Daily step target completion',
              },
              {
                key: 'water_goal_reached',
                label: 'Water Goal Reached',
                desc: 'Daily hydration target completion',
              },
              {
                key: 'perfect_day',
                label: 'Perfect Day',
                desc: 'All daily goals completed',
              },
              {
                key: 'streak_milestone',
                label: 'Streak Milestones',
                desc: '7, 14, 30+ day workout streaks',
              },
            ].map((item) => (
              <div
                key={item.key}
                className='p-4 flex items-center justify-between'
              >
                <div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    {item.label}
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                    {item.desc}
                  </div>
                </div>

                <button
                  onClick={() =>
                    toggleSwitch(item.key as keyof NotificationPreferences)
                  }
                  className={`w-12 h-7 rounded-full transition-all ${
                    preferences[item.key as keyof NotificationPreferences]
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      preferences[item.key as keyof NotificationPreferences]
                        ? 'ml-[26px]'
                        : 'ml-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Notifications */}
        <div>
          <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-3'>
            Reminders
          </div>

          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl divide-y divide-[color:var(--app-border)]'>
            {/* Morning Check-in */}
            <div className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    Morning Check-In
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                    Daily morning motivation
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateReminderSchedule(
                      'morning_checkin',
                      'enabled',
                      !preferences.morning_checkin.enabled,
                    )
                  }
                  className={`w-12 h-7 rounded-full transition-all ${
                    preferences.morning_checkin.enabled
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      preferences.morning_checkin.enabled ? 'ml-[26px]' : 'ml-1'
                    }`}
                  />
                </button>
              </div>

              {preferences.morning_checkin.enabled && (
                <div>
                  <label className='text-[12px] text-[color:var(--app-text-muted)] block mb-1'>
                    Time
                  </label>
                  <input
                    type='time'
                    value={preferences.morning_checkin.time}
                    onChange={(e) =>
                      updateReminderSchedule(
                        'morning_checkin',
                        'time',
                        e.target.value,
                      )
                    }
                    className='w-full px-3 py-2 rounded-xl app-surface border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)]'
                  />
                </div>
              )}
            </div>

            {/* Workout Reminder */}
            <div className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    Workout Reminder
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                    Daily workout reminder
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateReminderSchedule(
                      'workout_reminder',
                      'enabled',
                      !preferences.workout_reminder.enabled,
                    )
                  }
                  className={`w-12 h-7 rounded-full transition-all ${
                    preferences.workout_reminder.enabled
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      preferences.workout_reminder.enabled
                        ? 'ml-[26px]'
                        : 'ml-1'
                    }`}
                  />
                </button>
              </div>

              {preferences.workout_reminder.enabled && (
                <div>
                  <label className='text-[12px] text-[color:var(--app-text-muted)] block mb-1'>
                    Time
                  </label>
                  <input
                    type='time'
                    value={preferences.workout_reminder.time}
                    onChange={(e) =>
                      updateReminderSchedule(
                        'workout_reminder',
                        'time',
                        e.target.value,
                      )
                    }
                    className='w-full px-3 py-2 rounded-xl app-surface border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)]'
                  />
                </div>
              )}
            </div>

            {/* Evening Summary */}
            <div className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    Evening Summary
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                    Daily progress recap
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateReminderSchedule(
                      'evening_summary',
                      'enabled',
                      !preferences.evening_summary.enabled,
                    )
                  }
                  className={`w-12 h-7 rounded-full transition-all ${
                    preferences.evening_summary.enabled
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      preferences.evening_summary.enabled ? 'ml-[26px]' : 'ml-1'
                    }`}
                  />
                </button>
              </div>

              {preferences.evening_summary.enabled && (
                <div>
                  <label className='text-[12px] text-[color:var(--app-text-muted)] block mb-1'>
                    Time
                  </label>
                  <input
                    type='time'
                    value={preferences.evening_summary.time}
                    onChange={(e) =>
                      updateReminderSchedule(
                        'evening_summary',
                        'time',
                        e.target.value,
                      )
                    }
                    className='w-full px-3 py-2 rounded-xl app-surface border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)]'
                  />
                </div>
              )}
            </div>

            {/* Other Reminders */}
            {[
              {
                key: 'streak_protection',
                label: 'Streak Protection',
                desc: 'Reminder if streak at risk',
              },
              {
                key: 'incomplete_goals',
                label: 'Incomplete Goals',
                desc: 'End-of-day goal reminder',
              },
              {
                key: 'template_reminder',
                label: 'Template Reminders',
                desc: "Suggest workouts you haven't done",
              },
              {
                key: 'rest_day_suggestion',
                label: 'Rest Day Suggestion',
                desc: 'After consecutive workouts',
              },
            ].map((item) => (
              <div
                key={item.key}
                className='p-4 flex items-center justify-between'
              >
                <div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    {item.label}
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                    {item.desc}
                  </div>
                </div>

                <button
                  onClick={() =>
                    toggleSwitch(item.key as keyof NotificationPreferences)
                  }
                  className={`w-12 h-7 rounded-full transition-all ${
                    preferences[item.key as keyof NotificationPreferences]
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      preferences[item.key as keyof NotificationPreferences]
                        ? 'ml-[26px]'
                        : 'ml-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Progress & Insights */}
        <div>
          <div className='text-[14px] font-bold text-[color:var(--app-text)] mb-3'>
            Progress & Insights
          </div>

          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl divide-y divide-[color:var(--app-border)]'>
            {[
              {
                key: 'weekly_summary',
                label: 'Weekly Summary',
                desc: 'Sunday evening recap',
              },
              {
                key: 'personal_best',
                label: 'Personal Bests',
                desc: 'New achievements detected',
              },
              {
                key: 'consistency_insight',
                label: 'Consistency Insights',
                desc: 'Progress comparisons',
              },
              {
                key: 'improvement_detected',
                label: 'Improvement Detected',
                desc: 'Strength gains over time',
              },
            ].map((item) => (
              <div
                key={item.key}
                className='p-4 flex items-center justify-between'
              >
                <div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    {item.label}
                  </div>
                  <div className='text-[12px] text-[color:var(--app-text-muted)]'>
                    {item.desc}
                  </div>
                </div>

                <button
                  onClick={() =>
                    toggleSwitch(item.key as keyof NotificationPreferences)
                  }
                  className={`w-12 h-7 rounded-full transition-all ${
                    preferences[item.key as keyof NotificationPreferences]
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-all ${
                      preferences[item.key as keyof NotificationPreferences]
                        ? 'ml-[26px]'
                        : 'ml-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button (At the end of scrollable content) */}
        <div className='pt-2'>
          <button
            onClick={handleSave}
            disabled={saving}
            className='w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[15px] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg'
          >
            {saving ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
