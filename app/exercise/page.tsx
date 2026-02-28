"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { BarChart } from "@/components/ui/bar-chart";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth/auth-token";
import { apiClient } from "@/lib/api/client";
import {
  ExerciseQuickActionSkeleton,
  ExerciseTemplateSkeleton,
  ExerciseChartSkeleton,
} from "@/components/ui/skeleton";
import { Workout } from "@/types";

const iconColors = ["#818CF8", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
const iconNames = ["dumbbell", "repeat", "zap", "target", "activity"];

export default function ExercisePage() {
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Fetch workout templates
        const templatesRes = await apiClient.get('/api/workouts?is_template=true&limit=50', token);
        if (templatesRes.success && templatesRes.data?.workouts) {
          setTemplates(templatesRes.data.workouts);
        } else {
          console.error("Error fetching templates:", templatesRes.error);
          setTemplates([]);
        }

        // Fetch workouts from the last 7 days for volume chart
        const workoutsRes = await apiClient.get('/api/workouts?is_template=false&limit=100', token);
        if (workoutsRes.success && workoutsRes.data?.workouts) {
          setCompletedWorkouts(workoutsRes.data.workouts);
          calculateWeeklyVolume(workoutsRes.data.workouts);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateWeeklyVolume = (workouts: any[]) => {
    // Initialize volume for each day of the week [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const volumeByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Get the start of the current week (Monday)
    const startOfWeek = new Date(today);
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Adjust for Sunday
    startOfWeek.setDate(today.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    workouts.forEach((workout) => {
      if (!workout.started_at || !workout.exercises) return;

      const workoutDate = new Date(workout.started_at);
      workoutDate.setHours(0, 0, 0, 0);

      // Check if workout is in current week
      const daysSinceWeekStart = Math.floor((workoutDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceWeekStart >= 0 && daysSinceWeekStart < 7) {
        let totalVolume = 0;

        workout.exercises.forEach((ex: any) => {
          ex.sets?.forEach((set: any) => {
            if (set.weight_kg && set.reps && !set.is_warmup && set.completed_at) {
              totalVolume += set.weight_kg * set.reps;
            }
          });
        });

        volumeByDay[daysSinceWeekStart] += totalVolume;
      }
    });

    setWeeklyVolume(volumeByDay);
  };

  const getExerciseNames = (template: Workout): string => {
    const exercises = template.exercises
      .slice(0, 3)
      .map((ex) => {
        if (typeof ex.exercise_id === 'object' && ex.exercise_id !== null) {
          return ex.exercise_id.name;
        }
        return '';
      })
      .filter(name => name !== '')
      .join(' · ');

    return exercises || 'No exercises';
  };

  const getTotalSets = (template: Workout): number => {
    return template.exercises.reduce((total, ex) => total + (ex.sets?.length || 0), 0);
  };

  const getLastDone = (template: Workout): string => {
    // Find completed workouts that match this template's ID
    const matchingWorkouts = completedWorkouts.filter(
      (workout) => workout.template_id === template._id && workout.ended_at
    );

    if (matchingWorkouts.length === 0) {
      return "Not logged yet";
    }

    // Sort by ended_at to get the most recent
    matchingWorkouts.sort((a, b) =>
      new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()
    );

    const lastWorkout = matchingWorkouts[0];
    const lastDate = new Date(lastWorkout.ended_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? "1 month ago" : `${months} months ago`;
    }
  };

  if (loading) {
    return (
      <div className="px-6 pt-5 pb-4">
        <ExerciseQuickActionSkeleton />
        <ExerciseQuickActionSkeleton />

        <div className="text-[14px] font-bold text-white mb-3">My Templates</div>
        <ExerciseTemplateSkeleton />
        <ExerciseTemplateSkeleton />
        <ExerciseTemplateSkeleton />

        <ExerciseChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 pt-5 pb-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-5 pb-4">
        {/* Quick Start Card */}
        <Link
          href="/workout"
          className="block bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-indigo-500/25 rounded-[22px] p-5 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <Icon name="zap" size={22} color="#818CF8" />
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400 text-[13px] font-semibold">
              Start <Icon name="chevronRight" size={16} color="#818CF8" />
            </div>
          </div>
          <div className="text-lg font-bold text-white mb-1">Quick Workout</div>
          <div className="text-[13px] text-gray-400">Log exercises as you go</div>
        </Link>

        {/* Create Template Card */}
        <Link
          href="/workout?mode=template"
          className="block bg-gradient-to-br from-[#0d1b3e] to-[#1a1f35] border border-blue-500/25 rounded-[22px] p-5 mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Icon name="plus" size={22} color="#3B82F6" />
            </div>
            <div className="flex items-center gap-1.5 text-blue-400 text-[13px] font-semibold">
              Create <Icon name="chevronRight" size={16} color="#3B82F6" />
            </div>
          </div>
          <div className="text-lg font-bold text-white mb-1">New Template</div>
          <div className="text-[13px] text-gray-400">Build a reusable workout template</div>
        </Link>

        {/* Templates */}
        <div className="text-[14px] font-bold text-white mb-3">My Templates</div>
        {templates.length === 0 ? (
          <div className="bg-[#131520] border border-white/5 rounded-2xl p-6 text-center">
            <div className="text-gray-400 text-sm mb-2">No templates yet</div>
            <div className="text-gray-500 text-xs">Create a workout template to get started</div>
          </div>
        ) : (
          templates.map((template, index) => {
            const color = iconColors[index % iconColors.length];
            const icon = iconNames[index % iconNames.length];
            const totalSets = getTotalSets(template);

            return (
              <Link
                key={template._id}
                href={`/workout?templateId=${template._id}`}
                className="flex items-center gap-3.5 p-4 bg-[#131520] border border-white/5 rounded-2xl mb-2.5"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color + "20" }}
                >
                  <Icon name={icon} size={20} color={color} />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-white mb-0.5">
                    {template.name}
                  </div>
                  <div className="text-[12px] text-gray-400">{getExerciseNames(template)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold" style={{ color }}>
                    {totalSets} {totalSets === 1 ? 'set' : 'sets'}
                  </div>
                  <div className="text-[11px] text-gray-600">{getLastDone(template)}</div>
                </div>
              </Link>
            );
          })
        )}

        {/* Weekly Volume Chart */}
        <div className="bg-[#131520] border border-white/5 rounded-[22px] p-[18px] mt-1.5">
          <div className="text-[13px] font-bold text-white mb-1">Volume This Week</div>
          <div className="text-[11px] text-gray-400 mb-3.5">
            Total weight lifted (kg)
          </div>
          <BarChart
            data={weeklyVolume}
            color="#818CF8"
            labels={["M", "T", "W", "T", "F", "S", "S"]}
          />
        </div>
    </div>
  );
}
