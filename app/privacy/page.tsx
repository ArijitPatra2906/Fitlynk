'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const router = useRouter()

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
          <h1 className='text-[20px] font-bold text-[color:var(--app-text)]'>
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 py-6'>
        <div className='max-w-3xl mx-auto space-y-6'>
          <div className='text-[13px] text-[color:var(--app-text-muted)] mb-6'>
            Last updated: March 23, 2026
          </div>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              1. Information We Collect
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              Fitlynk collects information you provide directly to us when you create an account, use our services, or communicate with us. This includes:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4'>
              <li>Account information (name, email, password)</li>
              <li>Profile information (height, weight, age, gender, goals)</li>
              <li>Fitness data (workouts, nutrition logs, step counts, water intake)</li>
              <li>Progress photos you choose to upload</li>
              <li>Device and usage information</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              2. How We Use Your Information
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              We use the information we collect to:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4'>
              <li>Provide, maintain, and improve our services</li>
              <li>Track your fitness progress and provide personalized insights</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              3. Information Sharing
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4 mt-3'>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights and property</li>
              <li>With service providers who assist in operating our platform (e.g., cloud storage, analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              4. Data Security
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, secure server infrastructure, and regular security audits.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              5. Data Retention
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time through the app settings.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              6. Your Rights
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              You have the right to:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4'>
              <li>Access and update your personal information</li>
              <li>Export your data in a portable format</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              7. Cookies and Tracking
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              8. Children's Privacy
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              Our service is not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              9. Changes to This Policy
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              10. Contact Us
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className='mt-3 app-surface border border-[color:var(--app-border)] rounded-2xl p-4'>
              <p className='text-[14px] text-[color:var(--app-text)] font-medium mb-2'>
                Fitlynk Support
              </p>
              <p className='text-[13px] text-[color:var(--app-text-muted)]'>
                Email: privacy@fitlynk.com
              </p>
            </div>
          </section>

          <div className='pt-6 pb-2'>
            <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 text-center'>
              <p className='text-[12px] text-[color:var(--app-text-muted)]'>
                By using Fitlynk, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
