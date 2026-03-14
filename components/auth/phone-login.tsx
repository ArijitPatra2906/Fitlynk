'use client'

import { useState, useEffect, useRef } from 'react'

interface PhoneLoginProps {
  onSuccess: (idToken: string) => void
  onError: (error: string) => void
  disabled?: boolean
  onOtpModeChange?: (isOtpMode: boolean) => void
}

export function PhoneLogin({ onSuccess, onError, disabled, onOtpModeChange }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const recaptchaContainerId = 'recaptcha-container'

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      onError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`
      console.log('[Phone Login] Sending OTP to:', fullPhoneNumber)

      const { firebaseAuthService } =
        await import('@/lib/firebase/auth-service')

      // Initialize reCAPTCHA for web platform
      firebaseAuthService.initRecaptchaVerifier(recaptchaContainerId)

      const verificationIdResult =
        await firebaseAuthService.signInWithPhoneNumber(fullPhoneNumber)

      console.log('[Phone Login] Verification ID:', verificationIdResult)
      setVerificationId(verificationIdResult)
      setShowOtpInput(true)
      onOtpModeChange?.(true)
      setResendTimer(60) // 60 seconds cooldown

      // Focus on first OTP input
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100)
    } catch (err: any) {
      console.error('[Phone Login] Send OTP error:', err)
      onError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')
    console.log('[Phone Login] Verifying OTP code:', otpCode)
    if (otpCode.length !== 6) {
      onError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    try {
      console.log('[Phone Login] Verifying OTP...')

      const { firebaseAuthService } =
        await import('@/lib/firebase/auth-service')
      const user = await firebaseAuthService.verifyPhoneOTP(
        verificationId,
        otpCode,
      )

      if (!user) {
        throw new Error('No user returned from verification')
      }

      console.log('[Phone Login] OTP verified, getting ID token...')
      const idToken = await user.getIdToken()

      console.log('[Phone Login] Success!')
      onSuccess(idToken)
    } catch (err: any) {
      console.error('[Phone Login] Verify OTP error:', err)
      onError(err.message || 'Invalid OTP code')
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      otpInputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    const newOtp = [...otp]

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }

    setOtp(newOtp)

    // Focus on next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5)
    otpInputsRef.current[nextIndex]?.focus()
  }

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', ''])
    setShowOtpInput(false)
    handleSendOtp()
  }

  const handleEditPhone = () => {
    setShowOtpInput(false)
    onOtpModeChange?.(false)
    setOtp(['', '', '', '', '', ''])
    setVerificationId(null)
  }

  if (showOtpInput) {
    return (
      <div className='space-y-6'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <p className='text-[13px] text-gray-400 leading-relaxed'>
            Enter the 6-digit code we sent to
          </p>
          <p className='text-[14px] text-white font-semibold'>
            {countryCode} {phoneNumber}
          </p>
        </div>

        {/* OTP Input */}
        <div className='flex justify-center gap-2.5'>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                otpInputsRef.current[index] = el
              }}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handleOtpPaste}
              disabled={loading || disabled}
              className='w-12 h-14 text-center text-[22px] font-bold text-white bg-[#131520] border-2 border-white/10 rounded-xl focus:border-blue-500 focus:outline-none disabled:opacity-50 transition-colors'
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          type='button'
          onClick={handleVerifyOtp}
          disabled={loading || disabled || otp.join('').length !== 6}
          className='w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[15px] font-bold text-center shadow-[0_8px_24px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all'
        >
          {loading ? (
            <span className='flex items-center justify-center gap-2'>
              <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                  fill='none'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Edit Phone & Resend */}
        <div className='flex items-center justify-center gap-4 text-[13px]'>
          <button
            type='button'
            onClick={handleEditPhone}
            disabled={loading || disabled}
            className='text-gray-400 hover:text-white disabled:opacity-50 transition-colors'
          >
            Edit number
          </button>
          <span className='text-gray-600'>•</span>
          {resendTimer > 0 ? (
            <span className='text-gray-400'>Resend in {resendTimer}s</span>
          ) : (
            <button
              type='button'
              onClick={handleResendOtp}
              disabled={loading || disabled}
              className='text-blue-500 hover:text-blue-400 disabled:opacity-50 transition-colors font-medium'
            >
              Resend code
            </button>
          )}
        </div>

        {/* reCAPTCHA container (invisible) */}
        <div id={recaptchaContainerId} />
      </div>
    )
  }

  return (
    <div className='space-y-5'>
      {/* Header Icon and Text */}
      <div className='text-center space-y-2 pb-2'>
        <p className='text-[13px] text-gray-400'>
          Enter your phone number to receive a verification code
        </p>
      </div>

      {/* Phone Number Input */}
      <div className='space-y-3'>
        <div className='bg-[#131520] border border-white/10 rounded-2xl p-3.5 focus-within:border-blue-500/50 transition-colors'>
          <label
            htmlFor='phone'
            className='text-[11px] text-gray-400 uppercase tracking-wider mb-2 block'
          >
            Phone Number
          </label>
          <div className='flex items-center gap-3'>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={loading || disabled}
              className='text-[14px] text-white bg-[#0B0D17] border border-white/5 rounded-lg px-2 py-1.5 outline-none disabled:opacity-50 cursor-pointer hover:bg-[#131520] transition-colors'
              style={{ colorScheme: 'dark' }}
            >
              <option value='+1' className='bg-[#1A1D2E] text-white'>
                🇺🇸 +1
              </option>
              <option value='+44' className='bg-[#1A1D2E] text-white'>
                🇬🇧 +44
              </option>
              <option value='+91' className='bg-[#1A1D2E] text-white'>
                🇮🇳 +91
              </option>
              <option value='+86' className='bg-[#1A1D2E] text-white'>
                🇨🇳 +86
              </option>
              <option value='+81' className='bg-[#1A1D2E] text-white'>
                🇯🇵 +81
              </option>
              <option value='+49' className='bg-[#1A1D2E] text-white'>
                🇩🇪 +49
              </option>
              <option value='+33' className='bg-[#1A1D2E] text-white'>
                🇫🇷 +33
              </option>
              <option value='+39' className='bg-[#1A1D2E] text-white'>
                🇮🇹 +39
              </option>
              <option value='+61' className='bg-[#1A1D2E] text-white'>
                🇦🇺 +61
              </option>
              <option value='+7' className='bg-[#1A1D2E] text-white'>
                🇷🇺 +7
              </option>
              <option value='+55' className='bg-[#1A1D2E] text-white'>
                🇧🇷 +55
              </option>
              <option value='+52' className='bg-[#1A1D2E] text-white'>
                🇲🇽 +52
              </option>
              <option value='+34' className='bg-[#1A1D2E] text-white'>
                🇪🇸 +34
              </option>
              <option value='+82' className='bg-[#1A1D2E] text-white'>
                🇰🇷 +82
              </option>
              <option value='+62' className='bg-[#1A1D2E] text-white'>
                🇮🇩 +62
              </option>
              <option value='+90' className='bg-[#1A1D2E] text-white'>
                🇹🇷 +90
              </option>
              <option value='+966' className='bg-[#1A1D2E] text-white'>
                🇸🇦 +966
              </option>
              <option value='+971' className='bg-[#1A1D2E] text-white'>
                🇦🇪 +971
              </option>
              <option value='+63' className='bg-[#1A1D2E] text-white'>
                🇵🇭 +63
              </option>
              <option value='+60' className='bg-[#1A1D2E] text-white'>
                🇲🇾 +60
              </option>
              <option value='+65' className='bg-[#1A1D2E] text-white'>
                🇸🇬 +65
              </option>
              <option value='+66' className='bg-[#1A1D2E] text-white'>
                🇹🇭 +66
              </option>
              <option value='+84' className='bg-[#1A1D2E] text-white'>
                🇻🇳 +84
              </option>
              <option value='+27' className='bg-[#1A1D2E] text-white'>
                🇿🇦 +27
              </option>
              <option value='+20' className='bg-[#1A1D2E] text-white'>
                🇪🇬 +20
              </option>
              <option value='+234' className='bg-[#1A1D2E] text-white'>
                🇳🇬 +234
              </option>
              <option value='+92' className='bg-[#1A1D2E] text-white'>
                🇵🇰 +92
              </option>
              <option value='+880' className='bg-[#1A1D2E] text-white'>
                🇧🇩 +880
              </option>
              <option value='+351' className='bg-[#1A1D2E] text-white'>
                🇵🇹 +351
              </option>
              <option value='+31' className='bg-[#1A1D2E] text-white'>
                🇳🇱 +31
              </option>
            </select>
            <input
              id='phone'
              type='tel'
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value.replace(/\D/g, ''))
              }
              disabled={loading || disabled}
              placeholder='Enter phone number'
              className='text-[14px] text-white bg-transparent border-none outline-none w-full disabled:opacity-50 placeholder:text-gray-600'
            />
          </div>
        </div>

        {/* Info text */}
        <p className='text-[12px] text-gray-500 px-1'>
          We'll send you a verification code via SMS
        </p>
      </div>

      {/* Send Code Button */}
      <button
        type='button'
        onClick={handleSendOtp}
        disabled={
          loading || disabled || !phoneNumber || phoneNumber.length < 10
        }
        className='w-full py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[15px] font-bold text-center shadow-[0_8px_24px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all'
      >
        {loading ? (
          <span className='flex items-center justify-center gap-2'>
            <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
                fill='none'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
            Sending...
          </span>
        ) : (
          'Send Verification Code'
        )}
      </button>

      {/* reCAPTCHA container (invisible) */}
      <div id={recaptchaContainerId} />
    </div>
  )
}
