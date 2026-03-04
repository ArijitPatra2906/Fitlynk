'use client'

import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './config'

class FirebaseAuthService {
  /**
   * Sign in with Google
   * - Uses native Google Sign-In on mobile (via Capacitor Firebase Auth)
   * - Uses Firebase web flow on web
   */
  async signInWithGoogle(): Promise<User | null> {
    try {
      console.log('[FirebaseAuth] Starting Google Sign-In...')
      console.log('[FirebaseAuth] Platform:', Capacitor.getPlatform())

      if (Capacitor.isNativePlatform()) {
        return await this.signInWithGoogleNative()
      } else {
        return await this.signInWithGoogleWeb()
      }
    } catch (error: any) {
      console.error('[FirebaseAuth] Google Sign-In error:', error)
      throw error
    }
  }

  /**
   * Native Google Sign-In (Android/iOS)
   */
  private async signInWithGoogleNative(): Promise<User | null> {
    console.log('[FirebaseAuth] Using native Google Sign-In...')

    // Sign in with native Google Sign-In
    const result = await FirebaseAuthentication.signInWithGoogle({
      mode: 'popup', // or 'redirect'
    })

    console.log('[FirebaseAuth] Native sign-in result:', result)

    // Get the credential from the result
    const credential = GoogleAuthProvider.credential(
      result.credential?.idToken,
      result.credential?.accessToken
    )

    // Sign in to Firebase with the credential
    const userCredential = await signInWithCredential(auth, credential)
    console.log('[FirebaseAuth] Firebase sign-in successful:', userCredential.user.email)

    return userCredential.user
  }

  /**
   * Web Google Sign-In (browser)
   */
  private async signInWithGoogleWeb(): Promise<User | null> {
    console.log('[FirebaseAuth] Using web Google Sign-In...')

    // For web, we'll use the popup flow
    const { signInWithPopup } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()

    const result = await signInWithPopup(auth, provider)
    console.log('[FirebaseAuth] Web sign-in successful:', result.user.email)

    return result.user
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      console.log('[FirebaseAuth] Signing out...')

      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut()
      }

      await firebaseSignOut(auth)
      console.log('[FirebaseAuth] Sign-out successful')
    } catch (error) {
      console.error('[FirebaseAuth] Sign-out error:', error)
      throw error
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }
}

export const firebaseAuthService = new FirebaseAuthService()
