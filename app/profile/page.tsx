'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import Link from 'next/link'
import {
  ProfileHeaderSkeleton,
  ProfileSectionSkeleton,
} from '@/components/ui/skeleton'
import { User } from '@/types'

export default function ProfilePage() {
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { getAuthToken } = await import('@/lib/auth/auth-token')
        const { apiClient } = await import('@/lib/api/client')
        const token = await getAuthToken()

        if (!token) {
          console.error('No auth token')
          setLoading(false)
          return
        }

        const response = await apiClient.get('/api/auth/me', token)

        if (response.success) {
          setUserData(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    const { removeAuthToken } = await import('@/lib/auth/auth-token')
    await removeAuthToken()
    window.location.href = '/login'
  }

  // Calculate age from date of birth
  const calculateAge = (dob?: string) => {
    if (!dob) return '-'
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age.toString()
  }

  // Format height and weight based on units
  const formatHeight = (height?: number, units?: string) => {
    if (!height) return '-'
    if (units === 'imperial') {
      const inches = Math.round(height / 2.54)
      return `${inches} in`
    }
    return `${height} cm`
  }

  const formatWeight = (weight?: number, units?: string) => {
    if (!weight) return '-'
    if (units === 'imperial') {
      const lbs = Math.round(weight * 2.20462)
      return `${lbs} lbs`
    }
    return `${weight} kg`
  }

  const userInitial = userData?.name?.charAt(0).toUpperCase() || 'U'
  const userAvatar = userData?.avatar_url

  if (loading) {
    return (
      <div>
        <ProfileHeaderSkeleton />
        <div className='px-6 pb-4'>
          <ProfileSectionSkeleton />
          <ProfileSectionSkeleton />
          <ProfileSectionSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Profile Header with Avatar */}
      <div className='bg-gradient-to-b from-[#0d1b3e] to-[#0B0D17] px-6 pt-12 pb-7 text-center'>
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userData?.name || 'User'}
            className='w-20 h-20 rounded-[28px] object-cover mx-auto mb-3 shadow-[0_8px_32px_rgba(59,130,246,0.4)]'
          />
        ) : (
          <div className='w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mx-auto mb-3 text-[32px] font-extrabold text-white shadow-[0_8px_32px_rgba(59,130,246,0.4)]'>
            {userInitial}
          </div>
        )}
        <div className='text-xl font-extrabold text-white mb-1'>
          {userData?.name || 'User'}
        </div>
        <div className='text-[13px] text-gray-400 mb-3.5'>
          {userData?.email || ''}
        </div>
        <div className='flex justify-center gap-6'>
          {[
            {
              label: 'Height',
              val: formatHeight(userData?.height, userData?.units),
            },
            {
              label: 'Weight',
              val: formatWeight(userData?.weight_kg, userData?.units),
            },
            { label: 'Age', val: calculateAge(userData?.date_of_birth) },
          ].map((item) => (
            <div key={item.label} className='text-center'>
              <div className='text-[15px] font-bold text-white'>{item.val}</div>
              <div className='text-[11px] text-gray-400'>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className='px-6 pb-4'>
        {/* My Goals */}
        <div className='mb-5'>
          <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
            My Goals
          </div>
          <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
            <Link
              href='/settings/goals'
              className='flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors'
            >
              <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                <Icon name='target' size={16} color='#3B82F6' />
              </div>
              <span className='flex-1 text-[14px] font-medium text-white'>
                Nutrition Goals
              </span>
              <span className='text-[13px] text-gray-400'>Set targets</span>
              <Icon name='chevronRight' size={16} color='#374151' />
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className='mb-5'>
          <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
            Settings
          </div>
          <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
            {[
              {
                label: 'Units',
                val: userData?.units === 'metric' ? 'Metric' : 'Imperial',
                icon: 'repeat',
              },
              { label: 'Notifications', val: 'Enabled', icon: 'bell' },
              { label: 'Dark Mode', val: 'On', icon: 'star' },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i < arr.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                  <Icon name={item.icon} size={16} color='#3B82F6' />
                </div>
                <span className='flex-1 text-[14px] font-medium text-white'>
                  {item.label}
                </span>
                <span className='text-[13px] text-gray-400'>{item.val}</span>
                <Icon name='chevronRight' size={16} color='#374151' />
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className='mb-5'>
          <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
            Account
          </div>
          <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
            {[
              { label: 'Export Data', val: '', icon: 'edit', action: null },
              { label: 'Privacy Policy', val: '', icon: 'mail', action: null },
              {
                label: 'Log Out',
                val: '',
                icon: 'logout',
                action: handleLogout,
              },
            ].map((item, i, arr) => (
              <button
                key={item.label}
                onClick={item.action || undefined}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                  i < arr.length - 1 ? 'border-b border-white/5' : ''
                } ${item.label === 'Log Out' ? 'text-red-500' : ''}`}
              >
                <div
                  className={`w-[34px] h-[34px] rounded-xl flex items-center justify-center ${
                    item.label === 'Log Out'
                      ? 'bg-red-500/10'
                      : 'bg-blue-500/10'
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    color={item.label === 'Log Out' ? '#EF4444' : '#3B82F6'}
                  />
                </div>
                <span
                  className={`flex-1 text-[14px] font-medium ${
                    item.label === 'Log Out' ? 'text-red-500' : 'text-white'
                  }`}
                >
                  {item.label}
                </span>
                {item.val && (
                  <span className='text-[13px] text-gray-400'>{item.val}</span>
                )}
                <Icon name='chevronRight' size={16} color='#374151' />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
