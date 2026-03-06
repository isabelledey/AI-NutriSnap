'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { sendOTP, verifyOTP } from '@/lib/auth'

interface VerifyStepProps {
  email: string
  name: string
  onVerified: () => void
  onBack: () => void
}

export function VerifyStep({ email, name, onVerified, onBack }: VerifyStepProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)

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
      const success = await verifyOTP(email, code)
      if (success) {
        onVerified()
      } else {
        setCode('')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setCountdown(30)
    try {
      const sent = await sendOTP(email, name)
      if (!sent) {
        setCanResend(true)
      }
    } catch {
      toast.error('Failed to resend code')
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
    <div className="flex flex-1 flex-col justify-center py-8">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-foreground">Enter verification code</h2>
      <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
        {"We've"} sent a 6-digit code to{' '}
        <span className="font-medium text-foreground">{email}</span>
      </p>

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
            Resend code
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">
            Resend code in {countdown}s
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
              Verify
              <ArrowRight className="ml-1 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
