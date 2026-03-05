'use client'

import { useState } from 'react'
import { EmailStep } from './email-step'
import { VerifyStep } from './verify-step'
import { ProfileStep } from './profile-step'
import { Progress } from '@/components/ui/progress'
import type { UserProfile } from '@/lib/types'

type OnboardingStep = 'email' | 'verify' | 'profile'

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void
}

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'verify', label: 'Verify' },
  { key: 'profile', label: 'Profile' },
]

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const currentIndex = STEPS.findIndex((s) => s.key === step)
  const progressValue = ((currentIndex + 1) / STEPS.length) * 100

  const handleEmailSubmit = (payload: { email: string; name: string }) => {
    setEmail(payload.email)
    setName(payload.name)
    setStep('verify')
  }

  const handleVerified = () => {
    setStep('profile')
  }

  const handleProfileComplete = (profile: UserProfile) => {
    onComplete({ ...profile, email, name })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 py-6">
      {/* Progress */}
      <div className="mb-2">
        <div className="mb-3 flex items-center justify-between">
          {STEPS.map((s, i) => (
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
        {step === 'email' && <EmailStep onSubmit={handleEmailSubmit} />}
        {step === 'verify' && (
          <VerifyStep
            email={email}
            onVerified={handleVerified}
            onBack={() => setStep('email')}
          />
        )}
        {step === 'profile' && <ProfileStep onComplete={handleProfileComplete} />}
      </div>
    </div>
  )
}
