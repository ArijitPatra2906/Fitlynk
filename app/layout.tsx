import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/layout/app-layout'
import { AppUrlListener } from '@/components/auth/app-url-listener'
import { GoogleAuthInit } from '@/components/auth/google-auth-init'
import { Toaster } from '@/components/ui/toaster'
import { ThemeInitializer } from '@/components/theme/theme-initializer'
import { NotificationInitializer } from '@/components/notifications/notification-initializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fitlynk - Your Fitness, Unified',
  description:
    'Track workouts, log meals, monitor progress - all in one beautiful app',
  viewport:
    'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' data-theme='dark' className='dark' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeInitializer />
        <GoogleAuthInit />
        <AppUrlListener />
        <NotificationInitializer />
        <Toaster />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
