'use client'

import { Icon } from '@/components/ui/icon'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      {/* Content */}
      <div className='flex-1 overflow-y-auto pb-28 px-6 py-6'>
        <div className='max-w-3xl mx-auto space-y-6'>
          <div className='text-[13px] text-[color:var(--app-text-muted)] mb-6'>
            Last updated: March 23, 2026
          </div>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              1. Acceptance of Terms
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              By accessing and using Fitlynk ("the App"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms and Conditions, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              2. Use License
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              Permission is granted to use Fitlynk for personal, non-commercial fitness tracking purposes. This license shall automatically terminate if you violate any of these restrictions.
            </p>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              You may not:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4'>
              <li>Use the App for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the App's functionality</li>
              <li>Reverse engineer or decompile any part of the App</li>
              <li>Use automated systems to access the App</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              3. User Accounts
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4'>
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Ensuring your account information remains accurate and up to date</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              4. Health and Fitness Disclaimer
            </h2>
            <div className='app-surface border border-orange-500/30 bg-orange-500/5 rounded-2xl p-4 mb-3'>
              <p className='text-[14px] text-[color:var(--app-text)] font-semibold mb-2'>
                Important Health Notice
              </p>
              <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
                Fitlynk is a fitness tracking tool and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with your healthcare provider before beginning any fitness or nutrition program.
              </p>
            </div>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              The App provides general fitness information and tracking capabilities. We make no warranties about the completeness, reliability, or accuracy of this information. Any action you take based on the information provided by the App is strictly at your own risk.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              5. User Content
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              You retain ownership of any content you submit to Fitlynk (including progress photos, workout logs, and nutrition data). By submitting content, you grant us a license to use, store, and display this content solely for the purpose of providing our services.
            </p>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              You are responsible for ensuring that your content does not violate any laws or infringe on any third-party rights.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              6. Data Accuracy
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              While we strive to provide accurate fitness tracking, the App's data (including step counts, calorie estimates, and other metrics) should be considered estimates. Accuracy may vary based on device sensors, user input, and other factors. We are not responsible for any decisions made based on this data.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              7. Intellectual Property
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              The App and its original content, features, and functionality are owned by Fitlynk and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              8. Termination
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We reserve the right to terminate or suspend your account and access to the App immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              9. Limitation of Liability
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              To the maximum extent permitted by law, Fitlynk shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className='list-disc list-inside space-y-2 text-[14px] text-[color:var(--app-text-muted)] ml-4'>
              <li>Your use or inability to use the App</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any interruption or cessation of the App</li>
              <li>Any bugs, viruses, or malicious code transmitted through the App</li>
              <li>Any errors or omissions in content</li>
            </ul>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              10. Indemnification
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              You agree to defend, indemnify, and hold harmless Fitlynk and its affiliates from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from your use of the App or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              11. Third-Party Services
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              The App may contain links to third-party services (e.g., Google Sign-In, cloud storage providers). We are not responsible for the content, privacy policies, or practices of any third-party services. Your use of such services is at your own risk.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              12. Changes to Terms
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              We reserve the right to modify or replace these Terms at any time. We will notify users of any material changes by updating the "Last updated" date. Your continued use of the App after any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              13. Governing Law
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed'>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className='text-[18px] font-bold text-[color:var(--app-text)] mb-3'>
              14. Contact Information
            </h2>
            <p className='text-[14px] text-[color:var(--app-text-muted)] leading-relaxed mb-3'>
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4'>
              <p className='text-[14px] text-[color:var(--app-text)] font-medium mb-2'>
                Fitlynk Support
              </p>
              <p className='text-[13px] text-[color:var(--app-text-muted)]'>
                Email: support@fitlynk.com
              </p>
            </div>
          </section>

          <div className='pt-6 pb-2'>
            <div className='app-surface border border-[color:var(--app-border)] rounded-2xl p-4 text-center'>
              <p className='text-[12px] text-[color:var(--app-text-muted)]'>
                By using Fitlynk, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
