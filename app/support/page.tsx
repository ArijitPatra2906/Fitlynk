'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

type SupportCategory = 'bug' | 'feature' | 'account' | 'other'

const SUPPORT_CATEGORIES = [
  {
    id: 'bug' as SupportCategory,
    label: 'Bug Report',
    description: 'Report an issue or bug',
    icon: 'alert-triangle',
    color: '#EF4444',
  },
  {
    id: 'feature' as SupportCategory,
    label: 'Feature Request',
    description: 'Suggest a new feature',
    icon: 'lightbulb',
    color: '#F59E0B',
  },
  {
    id: 'account' as SupportCategory,
    label: 'Account Issue',
    description: 'Help with your account',
    icon: 'user',
    color: '#3B82F6',
  },
  {
    id: 'other' as SupportCategory,
    label: 'Other',
    description: 'General inquiry',
    icon: 'message-circle',
    color: '#8B5CF6',
  },
]

export default function SupportPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load user's email if authenticated
  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (token) {
          const response = await apiClient.get('/api/auth/me', token)
          if (response.success && response.data?.email) {
            setEmail(response.data.email)
          }
        }
      } catch (error) {
        // User not authenticated, no problem
        console.log('User not authenticated')
      }
    }

    loadUserEmail()
  }, [])

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category')
      return
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSubmitting(true)

      const { apiClient } = await import('@/lib/api/client')

      // Submit support request
      const response = await apiClient.post('/api/support', {
        email: email.trim(),
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit support request')
      }

      toast.success('Support request submitted successfully!')

      // Reset form
      setSelectedCategory(null)
      setSubject('')
      setMessage('')
      setEmail('')

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit support request. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
              Contact Support
            </h1>
            <p className='text-[12px] text-[color:var(--app-text-muted)]'>
              We're here to help
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 py-6'>
        <div className='max-w-2xl mx-auto space-y-6'>
          {/* Support Categories */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-3 block'>
              What can we help you with?
            </label>
            <div className='grid grid-cols-2 gap-3'>
              {SUPPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    selectedCategory === cat.id
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'app-surface border-[color:var(--app-border)] hover:bg-[color:var(--app-surface-2)]'
                  }`}
                >
                  <div
                    className='w-10 h-10 rounded-xl flex items-center justify-center mb-2'
                    style={{
                      backgroundColor: `${cat.color}15`,
                    }}
                  >
                    <Icon name={cat.icon} size={18} color={cat.color} />
                  </div>
                  <div className='text-[14px] font-semibold text-[color:var(--app-text)] mb-0.5'>
                    {cat.label}
                  </div>
                  <div className='text-[11px] text-[color:var(--app-text-muted)]'>
                    {cat.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-2 block'>
              Your Email
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='your.email@example.com'
              className='w-full px-4 py-3 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50'
            />
            <p className='text-[11px] text-[color:var(--app-text-muted)] mt-1.5 ml-1'>
              We'll send our response to this email address
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-2 block'>
              Subject
            </label>
            <input
              type='text'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Brief description of your issue'
              className='w-full px-4 py-3 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50'
            />
          </div>

          {/* Message */}
          <div>
            <label className='text-[13px] font-semibold text-[color:var(--app-text)] mb-2 block'>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Please describe your issue in detail...'
              rows={8}
              className='w-full px-4 py-3 rounded-2xl bg-[color:var(--app-surface)] border border-[color:var(--app-border)] text-[14px] text-[color:var(--app-text)] placeholder-[color:var(--app-text-muted)] focus:outline-none focus:border-blue-500/50 resize-none'
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className='w-full py-3.5 rounded-2xl bg-blue-500 text-white text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors'
          >
            {submitting ? (
              <span className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Submitting...
              </span>
            ) : (
              'Submit Request'
            )}
          </button>

          {/* Additional Info */}
          <div className='app-surface border rounded-2xl p-4'>
            <div className='flex items-start gap-3'>
              <div className='w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
                <Icon name='info' size={16} color='#3B82F6' />
              </div>
              <div>
                <h3 className='text-[13px] font-semibold text-[color:var(--app-text)] mb-1'>
                  Response Time
                </h3>
                <p className='text-[12px] text-[color:var(--app-text-muted)] leading-relaxed'>
                  We typically respond within 24-48 hours. For urgent issues,
                  please email us directly at{' '}
                  <a
                    href='mailto:support@fitlynk.com'
                    className='text-blue-400 hover:underline'
                  >
                    support@fitlynk.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className='app-surface border rounded-2xl p-4'>
            <h3 className='text-[13px] font-semibold text-[color:var(--app-text)] mb-3'>
              Looking for something else?
            </h3>
            <div className='space-y-2'>
              <button
                onClick={() => router.push('/help')}
                className='w-full flex items-center justify-between p-3 rounded-xl bg-[color:var(--app-surface-2)] hover:bg-white/5 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <Icon name='help-circle' size={16} color='var(--app-text)' />
                  <span className='text-[13px] font-medium text-[color:var(--app-text)]'>
                    Visit Help Center
                  </span>
                </div>
                <Icon
                  name='chevronRight'
                  size={16}
                  color='var(--app-text-muted)'
                />
              </button>
              <button
                onClick={() => router.push('/privacy')}
                className='w-full flex items-center justify-between p-3 rounded-xl bg-[color:var(--app-surface-2)] hover:bg-white/5 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <Icon name='shield' size={16} color='var(--app-text)' />
                  <span className='text-[13px] font-medium text-[color:var(--app-text)]'>
                    Privacy Policy
                  </span>
                </div>
                <Icon
                  name='chevronRight'
                  size={16}
                  color='var(--app-text-muted)'
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
