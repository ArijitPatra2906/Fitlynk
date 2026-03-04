import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md skeleton-bg', className)}
      {...props}
    />
  )
}

// Dashboard-specific skeleton components
export function DashboardCalorieSkeleton() {
  return (
    <div className='bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-blue-500/20 rounded-3xl p-5 mb-4'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex-1'>
          <Skeleton className='h-3 w-32 mb-2' />
          <Skeleton className='h-9 w-24 mb-2' />
          <Skeleton className='h-4 w-28' />
        </div>
        <Skeleton className='h-[88px] w-[88px] rounded-full' />
      </div>
      <div className='flex gap-4'>
        <Skeleton className='h-[52px] flex-1 rounded-2xl' />
        <Skeleton className='h-[52px] flex-1 rounded-2xl' />
        <Skeleton className='h-[52px] flex-1 rounded-2xl' />
      </div>
    </div>
  )
}

export function DashboardMetricCardSkeleton() {
  return (
    <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4'>
      <div className='flex items-center gap-2 mb-3'>
        <Skeleton className='h-[34px] w-[34px] rounded-xl' />
        <Skeleton className='h-3 w-16' />
      </div>
      <div className='flex items-baseline gap-1 mb-2'>
        <Skeleton className='h-10 w-16' />
        <Skeleton className='h-4 w-12' />
      </div>
      <Skeleton className='h-3 w-24' />
    </div>
  )
}

export function DashboardMetricsSkeleton() {
  return (
    <div className='grid grid-cols-2 gap-2.5 mb-4'>
      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-3.5 min-h-[154px] flex flex-col'>
        <div className='flex items-center gap-2 mb-2'>
          <Skeleton className='w-7 h-7 rounded-lg' />
          <Skeleton className='h-3 w-14' />
        </div>
        <div className='flex items-baseline gap-1'>
          <Skeleton className='h-8 w-14' />
          <Skeleton className='h-3 w-8' />
        </div>
        <div className='mt-auto pt-2 border-t border-[color:var(--app-border)]'>
          <Skeleton className='h-3 w-20' />
        </div>
      </div>

      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-3.5 min-h-[154px] flex flex-col'>
        <div className='flex items-center gap-2 mb-2'>
          <Skeleton className='w-7 h-7 rounded-lg' />
          <Skeleton className='h-3 w-14' />
        </div>
        <div className='flex items-baseline gap-1'>
          <Skeleton className='h-8 w-14' />
          <Skeleton className='h-3 w-8' />
        </div>
        <div className='mt-auto pt-2.5 border-t border-[color:var(--app-border)] grid grid-cols-2 gap-2'>
          <Skeleton className='h-8 rounded-md' />
          <Skeleton className='h-8 rounded-md' />
        </div>
      </div>

      <div className='col-span-2 app-surface border border-[color:var(--app-border)] rounded-2xl p-3.5 min-h-[128px] flex flex-col'>
        <div className='flex items-center gap-2 mb-2'>
          <Skeleton className='w-7 h-7 rounded-lg' />
          <Skeleton className='h-3 w-14' />
        </div>
        <Skeleton className='h-8 w-24 mb-2' />
        <div className='mt-auto pt-2.5 border-t border-[color:var(--app-border)] w-full'>
          <Skeleton className='h-1.5 w-full rounded-full mb-2' />
          <Skeleton className='h-3 w-24 mb-1' />
          <Skeleton className='h-3 w-40' />
        </div>
      </div>

      <div className='col-span-2 app-surface border border-[color:var(--app-border)] rounded-2xl p-3.5 min-h-[126px] flex flex-col'>
        <div className='flex items-center gap-2 mb-2'>
          <Skeleton className='w-7 h-7 rounded-lg' />
          <Skeleton className='h-3 w-14' />
        </div>
        <div className='flex items-center justify-between mb-1'>
          <Skeleton className='h-8 w-16' />
          <Skeleton className='h-3 w-16' />
        </div>
        <Skeleton className='h-3 w-24 mb-2' />
        <div className='mt-auto pt-3 border-t border-[color:var(--app-border)]'>
          <Skeleton className='h-1.5 w-full rounded-full mb-2' />
          <Skeleton className='h-3 w-44' />
        </div>
      </div>
    </div>
  )
}

export function DashboardActivitySkeleton() {
  return (
    <div className='flex items-center gap-3 py-3 border-b border-[color:var(--app-border)]'>
      <Skeleton className='h-[38px] w-[38px] rounded-xl' />
      <div className='flex-1'>
        <Skeleton className='h-4 w-32 mb-2' />
        <Skeleton className='h-3 w-48' />
      </div>
      <div className='text-right'>
        <Skeleton className='h-4 w-16 mb-2 ml-auto' />
        <Skeleton className='h-3 w-12 ml-auto' />
      </div>
    </div>
  )
}

// Exercise-specific skeleton components
function ExerciseQuickActionSkeleton() {
  return (
    <div className='bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-indigo-500/25 rounded-[22px] p-5 mb-3'>
      <div className='flex items-center justify-between mb-3'>
        <Skeleton className='h-11 w-11 rounded-2xl' />
        <Skeleton className='h-4 w-16' />
      </div>
      <Skeleton className='h-5 w-32 mb-1' />
      <Skeleton className='h-4 w-32' />
    </div>
  )
}

function ExerciseTemplateSkeleton() {
  return (
    <div className='flex items-center gap-3.5 p-4 app-surface border border-[color:var(--app-border)] rounded-2xl mb-2.5'>
      <Skeleton className='h-11 w-11 rounded-2xl flex-shrink-0' />
      <div className='flex-1'>
        <Skeleton className='h-4 w-24 mb-1' />
        <Skeleton className='h-3 w-40' />
      </div>
      <div className='text-right'>
        <Skeleton className='h-3 w-12 mb-1 ml-auto' />
        <Skeleton className='h-3 w-16 ml-auto' />
      </div>
    </div>
  )
}

export function ExercisePageSkeleton() {
  return (
    <div className='px-6 pt-5 pb-4'>
      {/* Quick Actions */}
      <div className='grid grid-cols-2 gap-2.5 mb-4'>
        <ExerciseQuickActionSkeleton />
        <ExerciseQuickActionSkeleton />
      </div>

      {/* Steps Tracker Link */}
      <div className='mb-4 app-surface border border-[color:var(--app-border)] rounded-2xl p-3.5 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Skeleton className='w-10 h-10 rounded-xl' />
          <div>
            <Skeleton className='h-4 w-28 mb-1' />
            <Skeleton className='h-3 w-36' />
          </div>
        </div>
        <Skeleton className='h-4 w-4' />
      </div>

      {/* Recent Workouts */}
      <div className='flex items-center justify-between mb-3'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-3 w-14' />
      </div>
      <ExerciseTemplateSkeleton />
      <ExerciseTemplateSkeleton />

      {/* Templates */}
      <div className='flex items-center justify-between mt-5 mb-3'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-3 w-14' />
      </div>
      <ExerciseTemplateSkeleton />
      <ExerciseTemplateSkeleton />

      {/* Exercises */}
      <div className='flex items-center justify-between mt-5 mb-3'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-3 w-14' />
      </div>
      <ExerciseTemplateSkeleton />
      <ExerciseTemplateSkeleton />
    </div>
  )
}

// Nutrition-specific skeleton components
export function NutritionMacroSummarySkeleton() {
  return (
    <div className='app-surface border border-[color:var(--app-border)] rounded-[22px] p-[18px] mb-4 flex items-center gap-4'>
      <Skeleton className='h-[72px] w-[72px] rounded-full' />
      <div className='flex-1 flex gap-3'>
        <div className='flex-1'>
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-3 w-3/4' />
        </div>
        <div className='flex-1'>
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-3 w-3/4' />
        </div>
        <div className='flex-1'>
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-3 w-3/4' />
        </div>
      </div>
    </div>
  )
}

export function NutritionMealCardSkeleton() {
  return (
    <div className='app-surface border border-[color:var(--app-border)] rounded-2xl mb-2.5 overflow-hidden'>
      <div className='flex items-center justify-between px-4 py-3.5'>
        <div className='flex items-center gap-2.5'>
          <Skeleton className='h-2.5 w-2.5 rounded' />
          <Skeleton className='h-4 w-20' />
        </div>
        <Skeleton className='h-7 w-7 rounded-lg' />
      </div>
      <div className='px-4 py-3.5 border-t border-[color:var(--app-border)] text-center'>
        <Skeleton className='h-3 w-32 mx-auto' />
      </div>
    </div>
  )
}

// Progress-specific skeleton components
export function ProgressTabsSkeleton() {
  return (
    <div className='flex gap-2 mb-4'>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className='h-8 w-20 rounded-xl' />
      ))}
    </div>
  )
}

export function ProgressChartSkeleton() {
  return (
    <div className='app-surface border border-[color:var(--app-border)] rounded-[22px] p-[18px] mb-3.5'>
      <div className='flex justify-between items-start mb-3.5'>
        <div>
          <Skeleton className='h-3 w-24 mb-1' />
          <Skeleton className='h-8 w-32 mb-1' />
          <Skeleton className='h-3 w-36' />
        </div>
        <Skeleton className='h-6 w-16 rounded-lg' />
      </div>
      <Skeleton className='h-[100px] w-full mb-2' />
      <div className='flex justify-between mt-1.5'>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className='h-3 w-8' />
        ))}
      </div>
    </div>
  )
}

export function ProgressStatsSkeleton() {
  return (
    <div className='grid grid-cols-3 gap-2.5 mb-3.5'>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className='app-surface border border-[color:var(--app-border)] rounded-2xl p-3.5 text-center'
        >
          <Skeleton className='h-3 w-12 mx-auto mb-1' />
          <Skeleton className='h-4 w-16 mx-auto mb-1' />
          <Skeleton className='h-3 w-10 mx-auto' />
        </div>
      ))}
    </div>
  )
}

export function ProgressPRsSkeleton() {
  return (
    <div className='app-surface border border-[color:var(--app-border)] rounded-[22px] p-[18px]'>
      <div className='flex items-center gap-2 mb-3.5'>
        <Skeleton className='h-4 w-4' />
        <Skeleton className='h-4 w-32' />
      </div>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className='flex justify-between py-2.5 border-b border-[color:var(--app-border)] last:border-0'
        >
          <Skeleton className='h-4 w-24' />
          <div className='text-right'>
            <Skeleton className='h-4 w-16 mb-1 ml-auto' />
            <Skeleton className='h-3 w-12 ml-auto' />
          </div>
        </div>
      ))}
    </div>
  )
}

// Profile-specific skeleton components
export function ProfileHeaderSkeleton() {
  return (
    <div className='bg-gradient-to-b from-[#0d1b3e] to-[#0B0D17] px-6 pt-12 pb-7 text-center'>
      <Skeleton className='w-20 h-20 rounded-[28px] mx-auto mb-3' />
      <Skeleton className='h-6 w-32 mx-auto mb-1' />
      <Skeleton className='h-4 w-48 mx-auto mb-4' />
      <div className='flex justify-center gap-6'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='text-center'>
            <Skeleton className='h-5 w-12 mx-auto mb-1' />
            <Skeleton className='h-3 w-10 mx-auto' />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSectionSkeleton() {
  return (
    <div className='mb-5'>
      <Skeleton className='h-3 w-20 mb-2' />
      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl overflow-hidden'>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3.5 ${
              i < 2 ? 'border-b border-[color:var(--app-border)]' : ''
            }`}
          >
            <Skeleton className='h-[34px] w-[34px] rounded-xl' />
            <Skeleton className='h-4 flex-1' />
            <Skeleton className='h-3 w-16' />
            <Skeleton className='h-4 w-4' />
          </div>
        ))}
      </div>
    </div>
  )
}

// Workout-specific skeleton components
export function WorkoutPageSkeleton() {
  return (
    <div className='h-full flex flex-col bg-[var(--app-bg)]'>
      {/* Header */}
      <div className='flex-shrink-0 px-6 pt-safe pb-3 flex items-center justify-between border-b border-[color:var(--app-border)]'>
        <div className='flex items-center gap-3 flex-1'>
          <Skeleton className='w-10 h-10 rounded-xl' />
          <div className='flex-1'>
            <Skeleton className='h-5 w-32 mb-1' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
        <div className='flex gap-2'>
          <Skeleton className='w-10 h-10 rounded-xl' />
          <Skeleton className='w-10 h-10 rounded-xl' />
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 py-4'>
        {/* Exercise blocks */}
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className='app-surface border border-[color:var(--app-border)] rounded-[22px] p-4 mb-3'
          >
            <div className='flex items-center justify-between mb-3'>
              <Skeleton className='h-5 w-40' />
              <Skeleton className='w-8 h-8 rounded-lg' />
            </div>

            {/* Sets */}
            <div className='space-y-2'>
              {[...Array(3)].map((_, j) => (
                <div key={j} className='flex gap-2'>
                  <Skeleton className='h-10 w-12 rounded-xl' />
                  <Skeleton className='h-10 flex-1 rounded-xl' />
                  <Skeleton className='h-10 flex-1 rounded-xl' />
                  <Skeleton className='w-10 h-10 rounded-xl' />
                </div>
              ))}
            </div>

            <Skeleton className='h-9 w-full rounded-xl mt-3' />
          </div>
        ))}

        {/* Add Exercise Button */}
        <Skeleton className='h-12 w-full rounded-xl' />
      </div>

      {/* Bottom Actions */}
      <div className='flex-shrink-0 px-6 py-4 border-t border-[color:var(--app-border)] flex gap-3'>
        <Skeleton className='h-12 flex-1 rounded-xl' />
        <Skeleton className='h-12 flex-1 rounded-xl' />
      </div>
    </div>
  )
}

// Settings/Goals-specific skeleton components
export function GoalsPageSkeleton() {
  return (
    <div className='bg-[var(--app-bg)] pb-20'>
      <div className='px-6 pt-5'>
        <div className='space-y-4'>
          {/* Goal Type */}
          <div>
            <Skeleton className='h-4 w-32 mb-2' />
            <div className='grid grid-cols-3 gap-2'>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className='p-4 rounded-2xl border border-[color:var(--app-border)] app-surface flex flex-col items-center gap-2'
                >
                  <Skeleton className='h-10 w-10 rounded-xl' />
                  <Skeleton className='h-3 w-16' />
                </div>
              ))}
            </div>
          </div>

          {/* Calories */}
          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div>
                <Skeleton className='h-4 w-28 mb-1' />
                <Skeleton className='h-3 w-40' />
              </div>
              <Skeleton className='h-6 w-16' />
            </div>
            <Skeleton className='h-2 w-full rounded-lg mb-1' />
            <div className='flex justify-between'>
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-10' />
            </div>
          </div>

          {/* Macros */}
          <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 space-y-4'>
            <Skeleton className='h-4 w-40 mb-2' />
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-3 w-3 rounded-full' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                  <Skeleton className='h-8 w-16 rounded-lg' />
                </div>
                <Skeleton className='h-3 w-24' />
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <Skeleton className='h-14 w-full rounded-2xl' />
        </div>
      </div>
    </div>
  )
}

// Steps-specific skeleton components
export function StepsPageSkeleton() {
  return (
    <div className='px-6 pt-4 pb-24'>
      {/* Today card */}
      <div className='bg-gradient-to-br from-[#1a1f35] to-[#0d1b3e] border border-blue-500/20 rounded-2xl p-3.5 mb-4'>
        <Skeleton className='h-[118px] w-full rounded-xl mb-3' />
        <div className='flex justify-between mb-2'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-20' />
        </div>
        <Skeleton className='h-2 w-full rounded-full mb-2' />
        <div className='flex justify-between mb-3'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-3 w-20' />
        </div>
        <div className='grid grid-cols-2 gap-3 pt-3 border-t border-blue-500/20'>
          <div className='text-center'>
            <Skeleton className='h-3 w-16 mx-auto mb-2' />
            <Skeleton className='h-7 w-16 mx-auto mb-2' />
            <Skeleton className='h-3 w-8 mx-auto' />
          </div>
          <div className='text-center border-l border-blue-500/20'>
            <Skeleton className='h-3 w-16 mx-auto mb-2' />
            <Skeleton className='h-7 w-16 mx-auto mb-2' />
            <Skeleton className='h-3 w-10 mx-auto' />
          </div>
        </div>
      </div>

      {/* Goal card */}
      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 mb-4'>
        <div className='flex items-center justify-between mb-3'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-5 w-20' />
        </div>
        <Skeleton className='h-2 w-full rounded-lg mb-3' />
        <Skeleton className='h-11 w-full rounded-xl' />
      </div>

      {/* Log form */}
      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 mb-4'>
        <Skeleton className='h-4 w-28 mb-3' />
        <div className='grid grid-cols-3 gap-2 mb-3'>
          <Skeleton className='h-9 rounded-lg' />
          <Skeleton className='h-9 rounded-lg' />
          <Skeleton className='h-9 rounded-lg' />
        </div>
        <Skeleton className='h-12 w-full rounded-xl mb-3' />
        <div className='grid grid-cols-2 gap-2'>
          <Skeleton className='h-11 rounded-xl' />
          <Skeleton className='h-11 rounded-xl' />
        </div>
      </div>

      {/* Logs */}
      <div className='flex items-center justify-between mb-3'>
        <Skeleton className='h-5 w-20' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-20 rounded-lg' />
          <Skeleton className='h-8 w-20 rounded-lg' />
        </div>
      </div>

      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className='app-surface border border-[color:var(--app-border)] rounded-xl p-3 mb-2'
        >
          <div className='flex items-center justify-between mb-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-3 w-10' />
          </div>
          <div className='flex items-center justify-between mb-2'>
            <Skeleton className='h-3 w-20' />
            <div className='text-right'>
              <Skeleton className='h-5 w-14 mb-1 ml-auto' />
              <Skeleton className='h-3 w-10 ml-auto' />
            </div>
          </div>
          <div className='pt-2 border-t border-[color:var(--app-border)] grid grid-cols-3 gap-2'>
            <Skeleton className='h-8 rounded-md' />
            <Skeleton className='h-8 rounded-md' />
            <Skeleton className='h-8 rounded-md' />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WaterPageSkeleton() {
  return (
    <div className='px-6 pt-4 pb-24'>
      <div className='bg-gradient-to-br from-[#1a1f35] to-[#102346] border border-blue-500/20 rounded-2xl p-4 mb-4'>
        <Skeleton className='h-4 w-24 mb-2' />
        <Skeleton className='h-10 w-24 mb-2' />
        <Skeleton className='h-2 w-full rounded-full mb-2' />
        <Skeleton className='h-3 w-32' />
      </div>

      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 mb-4'>
        <div className='flex items-center justify-between mb-3'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-5 w-20' />
        </div>
        <Skeleton className='h-2 w-full rounded-lg mb-3' />
        <Skeleton className='h-11 w-full rounded-xl' />
      </div>

      <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 mb-4'>
        <Skeleton className='h-4 w-28 mb-3' />
        <div className='grid grid-cols-3 gap-2 mb-3'>
          <Skeleton className='h-9 rounded-lg' />
          <Skeleton className='h-9 rounded-lg' />
          <Skeleton className='h-9 rounded-lg' />
        </div>
        <Skeleton className='h-12 w-full rounded-xl mb-3' />
        <Skeleton className='h-11 w-full rounded-xl' />
      </div>

      <div className='flex items-center justify-between mb-3'>
        <Skeleton className='h-5 w-20' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-20 rounded-lg' />
          <Skeleton className='h-8 w-20 rounded-lg' />
        </div>
      </div>

      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className='app-surface border border-[color:var(--app-border)] rounded-xl p-3 mb-2'
        >
          <div className='flex items-center justify-between mb-1'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-5 w-14' />
          </div>
          <Skeleton className='h-3 w-28' />
        </div>
      ))}
    </div>
  )
}
