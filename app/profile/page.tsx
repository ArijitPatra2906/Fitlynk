'use client'

import { Icon } from '@/components/ui/icon'
import { BottomNav } from '@/components/layout/bottom-nav'

const settingsSections = [
  {
    title: 'My Goals',
    items: [
      { label: 'Goal Type', val: 'Fat Loss', icon: 'target' },
      { label: 'Calorie Target', val: '2,400 kcal', icon: 'fire' },
      { label: 'Activity Level', val: 'Moderate', icon: 'zap' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Units', val: 'Metric', icon: 'repeat' },
      { label: 'Notifications', val: 'Enabled', icon: 'bell' },
      { label: 'Dark Mode', val: 'On', icon: 'star' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Export Data', val: '', icon: 'edit' },
      { label: 'Privacy Policy', val: '', icon: 'mail' },
      { label: 'Log Out', val: '', icon: 'logout' },
    ],
  },
]

export default function ProfilePage() {
  return (
    <div className='flex flex-col h-screen overflow-hidden bg-[#0B0D17]'>
      {/* Header with Avatar */}
      <div className='bg-gradient-to-b from-[#0d1b3e] to-[#0B0D17] px-6 pt-6 pb-7 text-center'>
        <div className='w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mx-auto mb-3 text-[32px] font-extrabold text-white shadow-[0_8px_32px_rgba(59,130,246,0.4)]'>
          A
        </div>
        <div className='text-xl font-extrabold text-white mb-1'>
          Alex Johnson
        </div>
        <div className='text-[13px] text-gray-400 mb-3.5'>alex@example.com</div>
        <div className='flex justify-center gap-6'>
          {[
            { label: 'Height', val: '178 cm' },
            { label: 'Weight', val: '81.2 kg' },
            { label: 'Age', val: '28' },
          ].map((item) => (
            <div key={item.label} className='text-center'>
              <div className='text-[15px] font-bold text-white'>{item.val}</div>
              <div className='text-[11px] text-gray-400'>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className='flex-1 overflow-y-auto px-6 pb-4'>
        {settingsSections.map((section) => (
          <div key={section.title} className='mb-5'>
            <div className='text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2'>
              {section.title}
            </div>
            <div className='bg-[#131520] border border-white/5 rounded-2xl overflow-hidden'>
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < section.items.length - 1
                      ? 'border-b border-white/5'
                      : ''
                  }`}
                >
                  <div className='w-[34px] h-[34px] rounded-xl flex items-center justify-center bg-blue-500/10'>
                    <Icon name={item.icon} size={16} color='#3B82F6' />
                  </div>
                  <span className='flex-1 text-[14px] font-medium text-white'>
                    {item.label}
                  </span>
                  {item.val && (
                    <span className='text-[13px] text-gray-400'>
                      {item.val}
                    </span>
                  )}
                  <Icon name='chevronRight' size={16} color='#374151' />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
