'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, Upload, X, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/components/i18n/language-provider'
import type { MealAnalysis, ScanResult } from '@/lib/types'

interface PhotoCaptureProps {
  onMealAnalyzed: (analysis: MealAnalysis, imageDataUrl: string) => void
  onBack: () => void
  initialImageDataUrl?: string | null
}

const OTHER_OPTION = '__other__'

export function PhotoCapture({ onMealAnalyzed, onBack, initialImageDataUrl = null }: PhotoCaptureProps) {
  const { t } = useTranslation()
  const [realBase64String, setRealBase64String] = useState<string | null>(initialImageDataUrl)
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRealBase64String(initialImageDataUrl)
    setScanResult(null)
    setAnswers({})
    setCustomAnswers({})
  }, [initialImageDataUrl])

  const toDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          resolve(result)
          return
        }
        reject(new Error('Failed to read image as base64.'))
      }
      reader.onerror = () => reject(new Error('Failed to read selected file.'))
      reader.readAsDataURL(file)
    })
  }, [])

  const resetQuestionState = useCallback(() => {
    setScanResult(null)
    setAnswers({})
    setCustomAnswers({})
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      try {
        const imageDataUrl = await toDataUrl(file)
        setRealBase64String(imageDataUrl)
        resetQuestionState()
      } catch {
        toast.error(t('generic_error'))
      }
    },
    [toDataUrl, resetQuestionState, t],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const clearPreview = () => {
    if (isScanning || isCalculating) return
    setRealBase64String(null)
    resetQuestionState()
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleScanMeal = useCallback(async () => {
    if (!realBase64String) return

    setIsScanning(true)
    resetQuestionState()

    try {
      console.log('First 50 chars of image:', realBase64String.substring(0, 50))
      const res = await fetch('/api/analyze/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: realBase64String }),
      })
      const data = await res.json()

      if (!data.success) {
        toast.error(data.message || t('analysis_failed'))
        return
      }

      const result = data.result as ScanResult
      setScanResult(result)

      if (!result.is_food) {
        toast.error('This image does not look like food. Please upload a meal photo.')
      }
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setIsScanning(false)
    }
  }, [realBase64String, resetQuestionState, t])

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (value !== OTHER_OPTION) {
      setCustomAnswers((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  const setCustomAnswer = (questionId: string, value: string) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const allQuestionsAnswered = (() => {
    if (!scanResult?.questions?.length) return true

    return scanResult.questions.every((question) => {
      const answer = answers[question.id]
      if (!answer) return false
      if (answer !== OTHER_OPTION) return true
      return Boolean(customAnswers[question.id]?.trim())
    })
  })()

  const formatClarifications = () => {
    if (!scanResult?.questions?.length) {
      return 'No clarifications provided by user.'
    }

    return scanResult.questions
      .map((question) => {
        const selected = answers[question.id]
        if (selected === OTHER_OPTION) {
          const typed = customAnswers[question.id]?.trim() || 'No custom answer provided'
          return `Q: ${question.text} A: ${typed} (User typed).`
        }
        return `Q: ${question.text} A: ${selected}.`
      })
      .join(' ')
  }

  const handleCalculateMacros = useCallback(async () => {
    if (!realBase64String || !scanResult?.is_food || !allQuestionsAnswered) return

    setIsCalculating(true)

    try {
      const clarifications = formatClarifications()
      console.log('First 50 chars of image:', realBase64String.substring(0, 50))
      const res = await fetch('/api/analyze/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: realBase64String, clarifications }),
      })
      const data = await res.json()

      if (data.success) {
        onMealAnalyzed(data.analysis as MealAnalysis, realBase64String)
      } else {
        toast.error(data.message || t('analysis_failed'))
      }
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setIsCalculating(false)
    }
  }, [allQuestionsAnswered, onMealAnalyzed, realBase64String, scanResult?.is_food, t])

  const busy = isScanning || isCalculating

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 pb-6 pt-20">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" onClick={onBack} className="rounded-xl" disabled={busy}>
          <ArrowLeft className="mr-2 h-5 w-5 rtl:rotate-180" />
          {t('go_back')}
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('photo_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('photo_subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {realBase64String ? (
          <div className="relative w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border-2 border-border shadow-lg">
              <img src={realBase64String} alt="Food photo preview" className="aspect-square w-full object-cover" />
            </div>
            {!busy && (
              <button
                onClick={clearPreview}
                className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110"
                aria-label={t('remove_photo')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex w-full max-w-sm flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed p-12 transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-base font-medium text-foreground">{t('capture_dish')}</p>
              <p className="text-sm text-muted-foreground">{t('capture_hint')}</p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="h-12 w-full rounded-2xl text-base font-semibold"
              >
                <Camera className="mr-2 h-5 w-5" />
                {t('take_photo')}
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-full rounded-2xl text-base font-medium"
              >
                <Upload className="mr-2 h-5 w-5" />
                {t('upload_image')}
              </Button>
            </div>
          </div>
        )}

        {scanResult?.is_food && (
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Answer these quick questions to improve accuracy</p>
            {scanResult.questions.map((question) => {
              const selected = answers[question.id]
              const options = [...question.options, 'Other']
              return (
                <div key={question.id} className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{question.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => {
                      const value = option === 'Other' ? OTHER_OPTION : option
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => selectAnswer(question.id, value)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selected === value
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:bg-accent'
                          }`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  {selected === OTHER_OPTION && (
                    <Input
                      value={customAnswers[question.id] || ''}
                      onChange={(e) => setCustomAnswer(question.id, e.target.value)}
                      placeholder="Type your answer"
                      className="h-10"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {realBase64String && (
        <div className="mt-6 space-y-3 pb-4">
          {!scanResult && (
            <Button
              onClick={handleScanMeal}
              disabled={busy}
              className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('analyzing_meal')}
                </>
              ) : (
                t('analyze_calories')
              )}
            </Button>
          )}

          {scanResult?.is_food && (
            <Button
              onClick={handleCalculateMacros}
              disabled={isCalculating || !allQuestionsAnswered}
              className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Calculating macros...
                </>
              ) : (
                'Calculate Macros'
              )}
            </Button>
          )}
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label={t('aria_take_photo')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label={t('aria_upload_image')}
      />
    </div>
  )
}
