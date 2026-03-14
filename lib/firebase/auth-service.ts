'use client'

import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth'
import { auth } from './config'

class FirebaseAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null
  private confirmationResult: ConfirmationResult | null = null
  private nativeVerificationId: string | null = null

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

  /**
   * Initialize reCAPTCHA verifier for web platform
   * @param containerId - The ID of the HTML element to render reCAPTCHA
   */
  initRecaptchaVerifier(containerId: string): void {
    if (Capacitor.isNativePlatform()) {
      console.log('[FirebaseAuth] Skipping reCAPTCHA on native platform')
      return
    }

    if (!this.recaptchaVerifier) {
      console.log('[FirebaseAuth] Initializing reCAPTCHA...')
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('[FirebaseAuth] reCAPTCHA verified')
        },
        'expired-callback': () => {
          console.warn('[FirebaseAuth] reCAPTCHA expired')
        },
      })
    }
  }

  /**
   * Sign in with phone number
   * - Uses native phone auth on mobile (via Capacitor Firebase Auth)
   * - Uses Firebase web flow with reCAPTCHA on web
   * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @returns Verification ID (web) or null (native - handled by confirmation)
   */
  async signInWithPhoneNumber(phoneNumber: string): Promise<string | null> {
    try {
      console.log('[FirebaseAuth] Starting phone sign-in...', phoneNumber)
      console.log('[FirebaseAuth] Platform:', Capacitor.getPlatform())

      if (Capacitor.isNativePlatform()) {
        return await this.signInWithPhoneNumberNative(phoneNumber)
      } else {
        return await this.signInWithPhoneNumberWeb(phoneNumber)
      }
    } catch (error: any) {
      console.error('[FirebaseAuth] Phone sign-in error:', error)
      throw error
    }
  }

  /**
   * Native phone sign-in (Android/iOS)
   */
  private async signInWithPhoneNumberNative(phoneNumber: string): Promise<string | null> {
    console.log('[FirebaseAuth] Using native phone sign-in...')

    return new Promise((resolve, reject) => {
      // Listen for phoneCodeSent event to get verificationId
      FirebaseAuthentication.addListener('phoneCodeSent', (event: any) => {
        console.log('[FirebaseAuth] Phone code sent, verification ID:', event.verificationId)
        this.nativeVerificationId = event.verificationId
        resolve(event.verificationId)
      })

      // Listen for phoneVerificationFailed event
      FirebaseAuthentication.addListener('phoneVerificationFailed', (event: any) => {
        console.error('[FirebaseAuth] Phone verification failed:', event.message)
        reject(new Error(event.message || 'Phone verification failed'))
      })

      // Start phone number verification (sends SMS)
      FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber })
        .catch((error) => {
          console.error('[FirebaseAuth] Error starting phone verification:', error)
          reject(error)
        })

      // Set timeout for verification ID
      setTimeout(() => {
        reject(new Error('Phone verification timeout - no verification ID received'))
      }, 60000) // 60 second timeout
    })
  }

  /**
   * Web phone sign-in (browser)
   */
  private async signInWithPhoneNumberWeb(phoneNumber: string): Promise<string | null> {
    console.log('[FirebaseAuth] Using web phone sign-in...')

    if (!this.recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized. Call initRecaptchaVerifier() first.')
    }

    // Send OTP
    this.confirmationResult = await firebaseSignInWithPhoneNumber(
      auth,
      phoneNumber,
      this.recaptchaVerifier
    )

    console.log('[FirebaseAuth] Verification code sent')
    return 'web-confirmation' // For web, we use confirmationResult internally
  }

  /**
   * Verify OTP code
   * @param verificationId - Verification ID from signInWithPhoneNumber (for native)
   * @param verificationCode - The 6-digit OTP code
   * @returns Firebase User object
   */
  async verifyPhoneOTP(verificationId: string | null, verificationCode: string): Promise<User | null> {
    try {
      console.log('[FirebaseAuth] Verifying OTP code...')

      if (Capacitor.isNativePlatform()) {
        return await this.verifyPhoneOTPNative(verificationId!, verificationCode)
      } else {
        return await this.verifyPhoneOTPWeb(verificationCode)
      }
    } catch (error: any) {
      console.error('[FirebaseAuth] OTP verification error:', error)
      throw error
    }
  }

  /**
   * Verify OTP on native platform
   * Returns a mock user object with getIdToken method that gets the token from Capacitor plugin
   */
  private async verifyPhoneOTPNative(verificationId: string, verificationCode: string): Promise<User | null> {
    console.log('[FirebaseAuth] Verifying OTP on native platform...')

    // Use the stored verificationId if available, otherwise use the provided one
    const finalVerificationId = this.nativeVerificationId || verificationId

    // Confirm the verification code using the Capacitor plugin
    const result = await FirebaseAuthentication.confirmVerificationCode({
      verificationId: finalVerificationId,
      verificationCode,
    })

    console.log('[FirebaseAuth] confirmVerificationCode result:', JSON.stringify(result, null, 2))

    // Clear the stored verification ID
    this.nativeVerificationId = null

    // Remove all listeners
    await FirebaseAuthentication.removeAllListeners()

    // For native platforms with skipNativeAuth: false, the web SDK won't sync automatically
    // We need to create a proxy user object that gets the ID token from the Capacitor plugin
    console.log('[FirebaseAuth] Creating proxy user for native authentication...')

    // Create a proxy user object with getIdToken method
    const proxyUser = {
      getIdToken: async () => {
        console.log('[FirebaseAuth] Getting ID token from Capacitor plugin...')
        const tokenResult = await FirebaseAuthentication.getIdToken()
        if (!tokenResult || !tokenResult.token) {
          throw new Error('Failed to get ID token from native authentication')
        }
        console.log('[FirebaseAuth] ID token retrieved from Capacitor plugin')
        return tokenResult.token
      },
      // Add other required User properties as needed
      uid: result.user?.uid || '',
      email: result.user?.email || null,
      phoneNumber: result.user?.phoneNumber || null,
      displayName: result.user?.displayName || null,
      photoURL: (result.user as any)?.photoUrl || null, // Capacitor uses photoUrl, Firebase uses photoURL
      emailVerified: result.user?.emailVerified || false,
    } as User

    console.log('[FirebaseAuth] Proxy user created for phone:', proxyUser.phoneNumber)
    return proxyUser
  }

  /**
   * Verify OTP on web platform
   */
  private async verifyPhoneOTPWeb(verificationCode: string): Promise<User | null> {
    console.log('[FirebaseAuth] Verifying OTP on web platform...')

    if (!this.confirmationResult) {
      throw new Error('No pending confirmation. Call signInWithPhoneNumber() first.')
    }

    // Confirm the OTP code
    const userCredential = await this.confirmationResult.confirm(verificationCode)
    console.log('[FirebaseAuth] Phone sign-in successful:', userCredential.user.phoneNumber)

    // Clear the confirmation result
    this.confirmationResult = null

    return userCredential.user
  }

  /**
   * Clean up reCAPTCHA verifier
   */
  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear()
      this.recaptchaVerifier = null
    }
    this.confirmationResult = null
  }
}

export const firebaseAuthService = new FirebaseAuthService()
