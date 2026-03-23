'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
  category: 'general' | 'tracking' | 'account' | 'goals'
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'general',
    question: 'What is Fitlynk?',
    answer:
      'Fitlynk is a comprehensive fitness tracking app that helps you monitor your workouts, nutrition, body metrics, and progress photos. It provides insights and tools to help you achieve your fitness goals.',
  },
  {
    category: 'general',
    question: 'Is Fitlynk free to use?',
    answer:
      'Yes, Fitlynk is currently free to use with all features available to all users.',
  },
  {
    category: 'tracking',
    question: 'How do I log my meals?',
    answer:
      'Navigate to the Nutrition tab from the home screen. You can log meals by tapping the "Add Meal" button, then enter your food items with calories, protein, carbs, and fats.',
  },
  {
    category: 'tracking',
    question: 'Can I track my workouts?',
    answer:
      'Yes! Go to the Workouts section to create and log your workouts. You can add exercises, sets, reps, and weight used for each exercise.',
  },
  {
    category: 'tracking',
    question: 'How do I track my water intake?',
    answer:
      'Navigate to the Water tab and use the quick-add buttons (250ml, 500ml, 1000ml) or enter a custom amount. Your daily progress is displayed at the top of the screen.',
  },
  {
    category: 'tracking',
    question: 'How do I upload progress photos?',
    answer:
      'Go to the Progress page, select the "Photos" tab, and tap "Add Progress Photo". You can upload photos from your device and optionally add weight and notes.',
  },
  {
    category: 'goals',
    question: 'How do I set my nutrition goals?',
    answer:
      'From your Profile, tap "Nutrition Goals" under the My Goals section. You can set daily targets for calories, protein, carbs, and fats.',
  },
  {
    category: 'goals',
    question: 'How do I change my water goal?',
    answer:
      'In the Water tab, tap the settings icon next to your progress bar. You can adjust your daily water target in milliliters.',
  },
  {
    category: 'account',
    question: 'How do I change my password?',
    answer:
      'Go to your Profile, scroll to the Account section, and tap "Change Password". Enter your current password and your new password.',
  },
  {
    category: 'account',
    question: 'Can I change between metric and imperial units?',
    answer:
      'Yes! In your Profile under Settings, tap "Units" to switch between metric (kg, cm) and imperial (lbs, in) measurements.',
  },
  {
    category: 'account',
    question: 'How do I export my data?',
    answer:
      'Go to your Profile, scroll to the Account section, and tap "Export Data". A JSON file containing all your fitness data will be downloaded.',
  },
  {
    category: 'account',
    question: 'How do I delete my account?',
    answer:
      'In your Profile under Account settings, tap "Delete Account". You\'ll need to type "DELETE" to confirm. This action is permanent and cannot be undone.',
  },
]

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'layers-3' },
  { id: 'general', label: 'General', icon: 'info' },
  { id: 'tracking', label: 'Tracking', icon: 'activity' },
  { id: 'goals', label: 'Goals', icon: 'target' },
  { id: 'account', label: 'Account', icon: 'user' },
] as const

export default function HelpPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'general' | 'tracking' | 'goals' | 'account'
  >('all')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      {/* Header */}
      <div className='flex-shrink-0 app-surface border-b border-[color:var(--app-border)] px-6 py-4'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => router.back()}
            className='w-9 h-9 rounded-xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] flex items-center justify-center hover:bg-[color:var(--app-surface-2)] transition-colors'
          >
            <Icon name='arrow-left' size={18} color='var(--app-text)' />
          </button>
          <div>
            <h1 className='text-[20px] font-bold text-[color:var(--app-text)]'>
              Help Center
            </h1>
            <p className='text-[12px] text-[color:var(--app-text-muted)]'>
              Frequently asked questions
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 py-6'>
        <div className='max-w-3xl mx-auto space-y-6'>
          {/* Search Bar */}
          <div className='relative'>
            <Icon
              name='search'
              size={16}
              color='var(--app-text-muted)'
              className='absolute left-4 top-1/2 -translate-y-1/2'
            />
            <input
              type='text'
              placeholder='Search questions...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-11 pr-4 py-3 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50'
            />
          </div>

          {/* Category Filters */}
          <div className='flex gap-2 overflow-x-auto pb-2 no-scrollbar'>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(
                    cat.id as 'all' | 'general' | 'tracking' | 'goals' | 'account',
                  )
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-[color:var(--app-surface)] text-[color:var(--app-text-muted)] border border-[color:var(--app-border)] hover:bg-[color:var(--app-surface-2)]'
                }`}
              >
                <Icon
                  name={cat.icon}
                  size={14}
                  color={selectedCategory === cat.id ? '#60A5FA' : 'var(--app-text-muted)'}
                />
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className='space-y-3'>
            {filteredFAQs.length === 0 ? (
              <div className='app-surface border rounded-2xl p-8 text-center'>
                <div className='w-16 h-16 rounded-2xl bg-gray-500/10 flex items-center justify-center mx-auto mb-3'>
                  <Icon name='search' size={24} color='#6B7280' />
                </div>
                <p className='text-[14px] text-[color:var(--app-text)]'>
                  No questions found
                </p>
                <p className='text-[12px] text-[color:var(--app-text-muted)] mt-1'>
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              filteredFAQs.map((item, index) => (
                <div
                  key={index}
                  className='app-surface border rounded-2xl overflow-hidden'
                >
                  <button
                    onClick={() => toggleExpand(index)}
                    className='w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors'
                  >
                    <span className='text-[14px] font-semibold text-[color:var(--app-text)] pr-4'>
                      {item.question}
                    </span>
                    <Icon
                      name='chevron-down'
                      size={18}
                      color='var(--app-text-muted)'
                      className={`flex-shrink-0 transition-transform ${
                        expandedIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedIndex === index && (
                    <div className='px-4 pb-4 pt-1 border-t border-[color:var(--app-border)]'>
                      <p className='text-[13px] text-[color:var(--app-text-muted)] leading-relaxed'>
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact Support CTA */}
          <div className='app-surface border border-blue-500/30 bg-blue-500/5 rounded-2xl p-5 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3'>
              <Icon name='message-circle' size={20} color='#3B82F6' />
            </div>
            <h3 className='text-[15px] font-bold text-[color:var(--app-text)] mb-1'>
              Still need help?
            </h3>
            <p className='text-[12px] text-[color:var(--app-text-muted)] mb-4'>
              Can't find what you're looking for? Contact our support team.
            </p>
            <button
              onClick={() => router.push('/support')}
              className='px-5 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-600 transition-colors'
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
