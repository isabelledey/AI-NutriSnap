'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { sendOTP, verifyOTP } from '@/lib/auth'
import { useTranslation } from '@/components/i18n/language-provider'
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
  const { t } = useTranslation()
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
      const result = await verifyOTP(email, code)
      if (result.success) {
        onVerified(result.profile)
      } else {
        setCode('')
      }
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setCountdown(30)
    try {
      const sent = await sendOTP(email, name, mode)
      if (!sent) {
        setCanResend(true)
      }
    } catch {
      toast.error(t('toast_resend_failed'))
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

      <h2 className="mb-2 text-2xl font-bold text-foreground">{t('verify_title')}</h2>
      <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
        {t('verify_subtitle_prefix')}{' '}
        <span className="font-medium text-foreground">{email}</span>
        {t('verify_subtitle_suffix')}
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
            {t('resend_code')}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('resend_in', { seconds: countdown })}
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
          <ArrowLeft className="mr-1 h-5 w-5 rtl:rotate-180" />
          {t('back')}
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
              {t('verify')}
              <ArrowRight className="ml-1 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
