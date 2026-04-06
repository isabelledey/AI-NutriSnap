'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { sendOTP, verifyOTP } from '@/lib/auth'
import { DEMO_OTP, isDevAuthBypassEnabled } from '@/lib/demo-session'
import type { UserProfile } from '@/lib/types'
import type { AuthMode } from '@/lib/auth'

interface VerifyStepProps {
  mode: AuthMode
  email: string
  name: string
  onVerified: (profile: UserProfile | null) => void
  onBack: () => void
}

export function VerifyStep({ mode, email, name, onVerified, onBack }: VerifyStepProps) {
  const isSignIn = mode === 'signin'
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [showMockCodeHint, setShowMockCodeHint] = useState(isSignIn || isDevAuthBypassEnabled())

  useEffect(() => {
    const hasMockOtpStrategy =
      typeof window !== 'undefined' && localStorage.getItem('demo_otp_strategy') === 'mock'
    setShowMockCodeHint(isSignIn || isDevAuthBypassEnabled() || hasMockOtpStrategy)
  }, [isSignIn])

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async () => {
    if (code.length !== 6) return

    setLoading(true)
    try {
      const result = await verifyOTP(email, code)
      if (result.success) {
        onVerified(result.profile)
      } else {
        setCode('')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setCountdown(30)
    try {
      const result = await sendOTP(email, name, mode)
      if (!result.success) {
        setCanResend(true)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend code. Please try again.')
      setCanResend(true)
    }
  }

  useEffect(() => {
    if (code.length === 6) {
      handleVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <div className="flex flex-1 flex-col justify-center pb-8 pt-32">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-foreground">
        {isSignIn ? 'Enter your code' : 'Check your email'}
      </h2>
      <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
        {isSignIn ? (
          <>
            We found an account for <span className="font-medium text-foreground">{email}</span>.
            Enter the 6-digit code below to continue.
          </>
        ) : (
          <>
            We've sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
            Please enter it below to verify your account.
          </>
        )}
      </p>

      {showMockCodeHint && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {isSignIn ? `Use ${DEMO_OTP} to sign in.` : `Use ${DEMO_OTP} to finish signing up.`}
        </div>
      )}

      <div className="mb-6 flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 rounded-xl text-lg" />
            <InputOTPSlot index={1} className="h-12 w-12 rounded-xl text-lg" />
            <InputOTPSlot index={2} className="h-12 w-12 rounded-xl text-lg" />
            <InputOTPSlot index={3} className="h-12 w-12 rounded-xl text-lg" />
            <InputOTPSlot index={4} className="h-12 w-12 rounded-xl text-lg" />
            <InputOTPSlot index={5} className="h-12 w-12 rounded-xl text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* Resend */}
      <div className="mb-6 text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-sm font-medium text-primary hover:underline"
          >
            {isSignIn ? 'Get Code Again' : 'Resend Code'}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {isSignIn ? `Get code again in ${countdown}s` : `Resend code in ${countdown}s`}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-14 flex-1 rounded-2xl text-base font-medium"
        >
          <ArrowLeft className="mr-1 h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={handleVerify}
          disabled={code.length !== 6 || loading}
          className="h-14 flex-1 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Verify Account
              <ArrowRight className="ml-1 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
