'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

export function GoogleAuthInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    GoogleAuth.initialize({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!,
      scopes: ['profile', 'email'],
      grantOfflineAccess: false,
    })
  }, [])

  return null
}
