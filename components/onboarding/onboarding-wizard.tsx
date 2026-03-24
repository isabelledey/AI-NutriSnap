'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmailStep } from './email-step'
import { VerifyStep } from './verify-step'
import { Progress } from '@/components/ui/progress'
import type { UserProfile } from '@/lib/types'
import type { AuthMode } from '@/lib/auth'
import { setPendingOnboarding } from '@/lib/store'

type OnboardingStep = 'email' | 'verify'

interface OnboardingWizardProps {
  mode: AuthMode
  onComplete: (profile: UserProfile, options?: { isExistingUser?: boolean }) => void
}

export function OnboardingWizard({ mode, onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const signUpSteps: { key: OnboardingStep; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'verify', label: 'Verify' },
  ]
  const signInSteps: { key: OnboardingStep; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'verify', label: 'Verify' },
  ]
  const steps = mode === 'signup' ? signUpSteps : signInSteps

  const currentIndex = steps.findIndex((s) => s.key === step)
  const progressValue = ((currentIndex + 1) / steps.length) * 100

  const handleEmailSubmit = (payload: { email: string; name: string }) => {
    setEmail(payload.email)
    setName(payload.name)
    setStep('verify')
  }

  const handleVerified = (existingProfile: UserProfile | null) => {
    if (mode === 'signin' && existingProfile) {
      onComplete(existingProfile, { isExistingUser: true })
      return
    }
    if (mode === 'signin') {
      setStep('email')
      return
    }
    setPendingOnboarding({ email, name })
    router.refresh()
    router.push('/onboarding')
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 py-6">
      {/* Progress */}
      <div className="mb-2">
        <div className="mb-3 flex items-center justify-between">
          {steps.map((s, i) => (
            <span
              key={s.key}
              className={`text-xs font-medium ${
                i <= currentIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>
        <Progress value={progressValue} className="h-2 rounded-full" />
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col">
        {step === 'email' && <EmailStep mode={mode} onSubmit={handleEmailSubmit} />}
        {step === 'verify' && (
          <VerifyStep
            mode={mode}
            email={email}
            name={name}
            onVerified={handleVerified}
            onBack={() => setStep('email')}
          />
        )}
      </div>
    </div>
  )
}
