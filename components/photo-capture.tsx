'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, ArrowLeft, Loader2 } from 'lucide-react'

interface PhotoCaptureProps {
  onCapture: (imageDataUrl: string) => void
  onBack: () => void
  isAnalyzing?: boolean
}

export function PhotoCapture({ onCapture, onBack, isAnalyzing }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

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
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl"
          disabled={isAnalyzing}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Snap Your Meal</h2>
          <p className="text-sm text-muted-foreground">Take a photo or upload an image</p>
        </div>
      </div>

      {/* Photo area */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {preview ? (
          <div className="relative w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border-2 border-border shadow-lg">
              <img
                src={preview}
                alt="Food photo preview"
                className="aspect-square w-full object-cover"
              />
            </div>
            {!isAnalyzing && (
              <button
                onClick={clearPreview}
                className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110"
                aria-label="Remove photo"
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
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-base font-medium text-foreground">
                Capture your dish
              </p>
              <p className="text-sm text-muted-foreground">
                Take a photo or drag an image here
              </p>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="h-12 w-full rounded-2xl text-base font-semibold"
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-full rounded-2xl text-base font-medium"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Image
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Analyze button */}
      {preview && (
        <div className="mt-6 pb-4">
          <Button
            onClick={() => onCapture(preview)}
            disabled={isAnalyzing}
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing your meal...
              </>
            ) : (
              'Analyze Calories'
            )}
          </Button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take a photo"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload an image"
      />
    </div>
  )
}
