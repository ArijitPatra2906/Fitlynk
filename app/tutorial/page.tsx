'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface TutorialSlide {
  title: string
  description: string
  icon: string
  iconColor: string
  iconBg: string
  features: string[]
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: 'Welcome to Fitlynk',
    description:
      'Your all-in-one fitness companion for tracking workouts, nutrition, and progress.',
    icon: 'zap',
    iconColor: '#3B82F6',
    iconBg: '#3B82F610',
    features: [
      'Track your workouts and exercises',
      'Monitor your nutrition and macros',
      'Log your daily water intake',
      'Track your body metrics and progress photos',
      'Set and achieve your fitness goals',
    ],
  },
  {
    title: 'Track Your Workouts',
    description:
      'Create custom workout routines and log your exercises with sets, reps, and weight.',
    icon: 'dumbbell',
    iconColor: '#F97316',
    iconBg: '#F9731610',
    features: [
      'Choose from a library of exercises',
      'Create custom workout templates',
      'Track sets, reps, and weight',
      'View your personal records (PRs)',
      'Analyze workout history and trends',
    ],
  },
  {
    title: 'Monitor Your Nutrition',
    description:
      'Log your meals and track your daily calorie and macro intake to meet your goals.',
    icon: 'utensils',
    iconColor: '#10B981',
    iconBg: '#10B98110',
    features: [
      'Log breakfast, lunch, dinner, and snacks',
      'Track calories, protein, carbs, and fats',
      'Set custom nutrition goals',
      'View daily and weekly summaries',
      'Monitor your macro distribution',
    ],
  },
  {
    title: 'Stay Hydrated',
    description:
      'Track your daily water intake and stay on top of your hydration goals.',
    icon: 'water',
    iconColor: '#06B6D4',
    iconBg: '#06B6D410',
    features: [
      'Quick-add water with preset amounts',
      'Set custom daily water goals',
      'Visual progress tracking',
      'Daily intake history',
      'Hydration reminders (coming soon)',
    ],
  },
  {
    title: 'Track Your Progress',
    description:
      'Monitor your body metrics, take progress photos, and visualize your fitness journey.',
    icon: 'trending-up',
    iconColor: '#8B5CF6',
    iconBg: '#8B5CF610',
    features: [
      'Log weight and body measurements',
      'Upload progress photos',
      'View weight trends over time',
      'Track workout personal records',
      'Export all your data anytime',
    ],
  },
  {
    title: "You're All Set!",
    description:
      'Start your fitness journey today. Remember, consistency is key to achieving your goals.',
    icon: 'check-circle',
    iconColor: '#10B981',
    iconBg: '#10B98110',
    features: [
      'Explore the app and discover all features',
      'Set your initial goals in Settings',
      'Log your first workout or meal',
      'Track your progress daily',
      'Access help anytime from your Profile',
    ],
  },
]

export default function TutorialPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const isLastSlide = currentSlide === TUTORIAL_SLIDES.length - 1
  const isFirstSlide = currentSlide === 0

  const handleNext = () => {
    if (isLastSlide) {
      router.back()
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstSlide) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    router.back()
  }

  const slide = TUTORIAL_SLIDES[currentSlide]

  return (
    <div className='h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#0f1426] to-[#131520]'>
      {/* Header - Progress Dots */}
      <div className='flex-shrink-0 px-6 py-4 flex items-center justify-center'>
        <div className='flex gap-1.5'>
          {TUTORIAL_SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-blue-500'
                  : index < currentSlide
                  ? 'w-1.5 bg-blue-500/50'
                  : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 py-8'>
        <div className='max-w-2xl mx-auto'>
          {/* Icon */}
          <div
            className='w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg'
            style={{ backgroundColor: slide.iconBg }}
          >
            <Icon name={slide.icon} size={40} color={slide.iconColor} />
          </div>

          {/* Title */}
          <h1 className='text-[28px] font-bold text-white text-center mb-3'>
            {slide.title}
          </h1>

          {/* Description */}
          <p className='text-[15px] text-gray-400 text-center mb-8 leading-relaxed'>
            {slide.description}
          </p>

          {/* Features */}
          <div className='app-surface border rounded-2xl p-5'>
            <div className='space-y-3'>
              {slide.features.map((feature, index) => (
                <div key={index} className='flex items-start gap-3'>
                  <div className='w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5'>
                    <Icon name='check' size={14} color='#3B82F6' />
                  </div>
                  <p className='text-[14px] text-[color:var(--app-text)] leading-relaxed'>
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className='flex-shrink-0 px-6 py-6 app-surface border-t border-[color:var(--app-border)]'>
        <div className='max-w-2xl mx-auto flex gap-3'>
          {!isFirstSlide && (
            <button
              onClick={handlePrevious}
              className='px-6 py-3 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[color:var(--app-text)] text-[14px] font-semibold hover:bg-[color:var(--app-surface-2)] transition-colors'
            >
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            className='flex-1 py-3 rounded-2xl bg-blue-500 text-white text-[14px] font-semibold hover:bg-blue-600 transition-colors'
          >
            {isLastSlide ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
