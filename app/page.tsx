'use client'

import { useState, useEffect } from 'react'
import type { AppStep, UserProfile, MealAnalysis } from '@/lib/types'
import { getUserProfile, saveUserProfile, isOnboarded, saveMealToLog, setPendingMeal, getPendingMeal, clearPendingMeal } from '@/lib/store'
import { LandingHero } from '@/components/landing-hero'
import { PhotoCapture } from '@/components/photo-capture'
import { MealAnalysisDisplay } from '@/components/meal-analysis'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { Dashboard } from '@/components/dashboard/dashboard'
import { toast } from 'sonner'

export default function Home() {
  const [step, setStep] = useState<AppStep>('landing')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Check if user is already onboarded
  useEffect(() => {
    if (isOnboarded()) {
      const savedProfile = getUserProfile()
      if (savedProfile) {
        setProfile(savedProfile)
        setStep('dashboard')
      }
    }
  }, [])

  const handleStart = () => {
    setStep('photo')
  }

  const runAnalysis = async (imageDataUrl: string) => {
    setIsAnalyzing(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      })
      const data = await res.json()

      if (data.success) {
        setCurrentAnalysis(data.analysis)
        setStep('analysis')
      } else {
        toast.error('Failed to analyze your meal. Please try again.')
        setStep('photo')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setStep('photo')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handlePhotoCapture = async (imageDataUrl: string) => {
    setCurrentImage(imageDataUrl)
    await runAnalysis(imageDataUrl)
  }

  const handleAnalyzeAgain = async () => {
    if (!currentImage) {
      toast.error('No meal image found. Please upload the photo again.')
      setStep('photo')
      return
    }
    await runAnalysis(currentImage)
  }

  const handleAnalysisContinue = () => {
    if (currentAnalysis) {
      // Save the pending meal for after onboarding
      setPendingMeal(currentAnalysis)
    }

    if (isOnboarded() && profile) {
      // Already onboarded, save directly
      if (currentAnalysis) {
        saveMealToLog(currentAnalysis)
        clearPendingMeal()
        toast.success('Meal saved to your daily log!')
      }
      setStep('dashboard')
    } else {
      // Need to onboard first
      setStep('onboarding-email')
    }
  }

  const handleOnboardingComplete = (completedProfile: UserProfile) => {
    saveUserProfile(completedProfile)
    setProfile(completedProfile)

    // Save any pending meal
    const pending = getPendingMeal()
    if (pending) {
      saveMealToLog(pending)
      clearPendingMeal()
      toast.success('Profile created and meal saved!')
    } else {
      toast.success('Profile created! Start tracking your meals.')
    }

    setStep('dashboard')
  }

  const handleAddMeal = () => {
    setCurrentAnalysis(null)
    setCurrentImage(null)
    setStep('photo')
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md">
      {step === 'landing' && <LandingHero onStart={handleStart} />}

      {step === 'photo' && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onBack={() => setStep(profile ? 'dashboard' : 'landing')}
          isAnalyzing={isAnalyzing}
        />
      )}

      {step === 'analysis' && currentAnalysis && (
        <MealAnalysisDisplay
          analysis={currentAnalysis}
          imageUrl={currentImage || undefined}
          onContinue={handleAnalysisContinue}
          onAnalyzeAgain={handleAnalyzeAgain}
          isAnalyzing={isAnalyzing}
        />
      )}

      {(step === 'onboarding-email' || step === 'onboarding-verify' || step === 'onboarding-profile') && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      {step === 'dashboard' && profile && (
        <Dashboard profile={profile} onAddMeal={handleAddMeal} />
      )}
    </main>
  )
}
